#!/usr/bin/env node

var argv = require("optimist").argv
  , fs = require('fs')
  , exec = require('child_process').exec;

if (argv.help || argv.h){
  printHelp();
  process.exit();
}

var category = argv._[0];
var command = argv._[1];

if (category === "database"){
  if (command === "init"){
    initDatabase();
  }
} else {
  printHelp();
}

function initDatabase(){
  var database = argv.database || ''
    , scriptsPath = argv.scripts || '.'
    , scripts = [];

  try {
    var scriptNames = fs.readdirSync(scriptsPath);
  } catch(e) {
    console.log(e.message);
    process.exit(1);
  }

  for (var i = 0; i < scriptNames.length; i++) {
    var scriptName = scriptNames[i];
    try{
      scripts.push(scriptsPath + '/' + scriptName);
    } catch(e){
      console.log('unable to find database scripts at path: ' + scriptsPath);
      process.exit(1);
    }
  }

  console.log('running scripts on database ' + database);

  var scriptIdx = 0;
  runScript(database, scripts, scriptIdx);
}

function runScript(database, scripts, scriptIdx){
  console.log('running', scripts[scriptIdx]);
  var child = exec('psql -d ' + database + ' -f ' + scripts[scriptIdx], function(error, stdout, stderr){
    console.log(stdout);
    console.log(stderr);
    if (error !== null){
      console.log(error);
    }
  });
  child.on('exit', function(code, signal){
    scriptIdx++;
    if (scriptIdx < scripts.length){
      runScript(database, scripts, scriptIdx);
    } else{
      console.log('finished running scripts');
      process.exit();
    }
  });
}

function printHelp(){
  console.log('Usage: shovel [options]');
  console.log('       shovel database init [arguments]');
  console.log();
  console.log('Arguments:');
  console.log('  --database     name of database to run scripts on');
  console.log('  --scripts      path for database scripts');
  console.log('');
  console.log('Options:');
  console.log('  -h, --help     print this help documentation');
  console.log();
  console.log('Examples:');
  console.log('  apply 311fm database schema to existing postgres database:');
  console.log('  $ shovel database init --database testdb --scripts ./scripts');
}

