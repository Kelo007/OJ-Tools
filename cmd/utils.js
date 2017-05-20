import fs from "fs";
import path from "path";
import Promise from "bluebird"
import packageInfo from "../package"

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);
var mkdir = Promise.promisify(fs.mkdir);

const WORKING_DIR = process.cwd();
const MAIN_DIR = path.resolve(__dirname, "..");
const VERSION = packageInfo.version;

if (require.main === module)
{
  console.log(`
Version: ${VERSION}
WorkingDir: ${WORKING_DIR}
MainDir: ${MAIN_DIR}
`);
}

export {
  readFile, writeFile, mkdir,
  WORKING_DIR, MAIN_DIR, VERSION
};
