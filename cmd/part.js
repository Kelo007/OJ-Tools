#!/usr/bin/env node

var ARGV = process.argv;
import fs from "fs";
import path from "path";
import request from "request";
import cheerio from "cheerio";
import inquirer from "inquirer";
import Promise from "bluebird";
import chalk from "chalk"
import {readFile, writeFile, mkdir} from "./utils";
import {WORKING_DIR} from "./utils";

function emptyDir(filePath)
{
  var files = fs.readdirSync(filePath);
  files.forEach(file => {
    var stats = fs.statSync(path.join(filePath, file));
    if (stats.isDirectory())
    {
      emptyDir(path.join(filePath, file));
    }
    else {
      fs.unlinkSync(path.join(filePath, file));
    }
  });
  fs.rmdirSync(filePath);
}

class Config
{
  constructor()
  {
    this.fileName = "";
    this.filePath = "";
    this.savePath = "";
  }
  get()
  {
    if (ARGV[2] && ARGV[3])
    {
      this.fileName = ARGV[2];
      this.savePath = ARGV[3];
    }
    else if (ARGV[2])
    {
      this.fileName = ARGV[2];
      this.savePath = path.join(WORKING_DIR, this.fileName.split('.')[0]);
    }
    this.filePath = path.join(WORKING_DIR, this.fileName);
  }
  check()
  {
    return new Promise((resolve, reject) => {
      if (!this.filePath || !this.savePath)
        throw new Error("Too few arguments.");
      if (!fs.existsSync(this.filePath))
        throw new Error("No exist file.");
      if (fs.existsSync(this.savePath))
      {
        inquirer.prompt({
          name: "delete",
          type: "confirm",
          message: `There have already been a folder named your SAVE_PATH (${this.savePath}). If you type yes, I will help you delete the folder. Ready?`,
          default: true
        }).then(ans => {
          if (ans.delete)
          {
            emptyDir(this.savePath);
            resolve();
          } 
          else reject();
        });
      } 
      else resolve();
    });
  }
}

class Exister
{
  constructor()
  {
    this.set = new Object;
    this.length = 0;
    this.sum = 0;
  }
  exist(id)
  {
    return (typeof this.set[id]) == "number" && this.set[id] > 0;
  }
  count(id)
  {
    if (this.exist(id)) {
      ++this.sum;
      ++this.set[id];
    } else {
      this.set[id] = 1
      ++this.sum;
      ++this.length;
    }
    return this.set[id];
  }
}

class Timer
{
  constructor()
  {
    this.last = 0;
  }
  start()
  {
    this.last = Date.now();
  }
  end()
  {
    return Date.now() - this.last;
  }
}

var exister = new Exister();
var timer = new Timer();

class Context
{
  constructor(data, savePath)
  {
    this.data = data;
    this.savePath = savePath;
  }
  save()
  {
    var lastPath;
    return Promise.all([this.getSuggestName(), this.getFileContext()])
      .spread((fileName, fileContext) => {
        lastPath = path.join(this.savePath, fileName);
        return writeFile(lastPath, fileContext);
      })
      .then(() => {
        console.log(
`It's saved. 
FilePath: ${path.relative(WORKING_DIR, lastPath)}
Time: ${new Date()}
`);
      })
  }
  getFileContext()
  {
    return this.data.replace(/Problem(\d+):/i, "");
  }
  getSuggestName()
  {
    /Problem(\d+):/i.test(this.data);
    var id = RegExp.$1;
    var name = `${id}.cpp`;
    var count = exister.count(id);
    if (count > 1)
      name = `${id}(${count}).cpp`;
    return name;
  }
}

export class Worker
{
  constructor()
  {
    this.config = new Config();
  }
  run()
  {
    timer.start();
    this.config.get();
    
    return this.config.check()
    .then(() => {
      return mkdir(this.config.savePath);
    })
    .then(() => {
      return readFile(this.config.filePath);
    })
    .then(data => {
      data = data.toString();
      var contexts = data.split(/-{10,}/);
      var tasks = new Array;
      contexts.forEach(singleContext => {
        if (!singleContext) return;
        var context = new Context(singleContext, this.config.savePath);
        tasks.push(context.save());
      });
      return tasks;
    }).all()
    .then((res) => {
      console.log(chalk.green(`OK! The program runs fine.
Handle      ${res.length} files;
Save        ${exister.sum} files;
Do          ${exister.length} problems;
Finished in ${timer.end()} ms.
`
));
    })
    .catch(err => {
      if (err) console.error(err);
    });
  }
}

if (require.main === module)
{
  (new Worker()).run();
}