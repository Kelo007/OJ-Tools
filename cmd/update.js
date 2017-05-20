#!/usr/bin/env node

var ARGV = process.argv;
import fs from "fs";
import path from "path";
import request from "request";
import cheerio from "cheerio";
import inquirer from "inquirer";
import Promise from "bluebird";
import chalk from "chalk";
import {readFile, writeFile, mkdir} from "./lib/utils";
import {WORKING_DIR, VERSION} from "./lib/utils";

