#!/usr/bin/env node

var ARGV = process.argv;
import fs from "fs";
import path from "path";
import process from "process"
import request from "request";
import cheerio from "cheerio";
import inquirer from "inquirer";
import Promise from "bluebird";
import chalk from "chalk"

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);
var mkdir = Promise.promisify(fs.mkdir);

const WORKING_DIR = process.cwd();

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
    this.set = new Set;
  }
  exist(fileName)
  {
    if (this.set.has(fileName))
    {
      return true;
    } else {
      this.set.add(fileName);
      return false;
    }
  }
}
var exister = new Exister();

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
    var count = 1;
    while(exister.exist(name))
    {
      name = `${id}(${++count}).cpp`;
    }
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
      console.log(chalk.green(`OK. ${res.length} files have been saved.`));
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