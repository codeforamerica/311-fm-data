#!/usr/bin/env node

var argv = require("optimist").argv
  , fs = require('fs')
  , exec = require('child_process').exec
  , sync = require('../lib/sync');

if (argv.help || argv.h){
  printHelp();
  process.exit();
}

var category = argv._[0];
var command = argv._[1];

if (category === 'database'){
  if (command === 'init'){
    initDatabase();
  }
  if (command === 'sync'){
    syncDatabase();
  } else{
    printHelp();
  }
} else {
  printHelp();
}

function syncDatabase(){
  var s = sync(argv.database)
    , start = argv.start;

  s.download(start);
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
  var child = exec('psql "' + database + '" -f ' + scripts[scriptIdx], function(error, stdout, stderr){
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
  console.log('       shovel database sync [arguments]');
  console.log();
  console.log('Arguments:');
  console.log('  --database     database connection string');
  console.log('                 *** NOTE: this is a psql connstr for init and a postgres URL for sync. ***');
  console.log('  --scripts      path for database scripts');
  console.log('  --start        start datetime for sync operation');
  console.log();
  console.log('Options:');
  console.log('  -h, --help     print this help documentation');
  console.log();
  console.log('Examples:');
  console.log('  apply 311fm database schema to EXISTING postgres database:');
  console.log('  $ shovel database init --database "dbname=testdb" --scripts ./scripts');
  console.log();
  console.log('  sync data from Open311 endpoint to postgres database:');
  console.log('  $ shovel database sync --start "2012-11-28T00:00:00"');
}

