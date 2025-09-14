#!/usr/bin/env node
const { program } = require('commander');

program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log('Hello from lucandjeremi-cli!');
  });

program.parse();