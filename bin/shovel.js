#!/usr/bin/env node

var argv = require("optimist").argv
  , pg = require('pg')
  , fs = require('fs');

if (argv.help || argv.h){
  printHelp();
  process.exit();
}

var category = argv._[0];
var command = argv._[1];

if (category === "database"){
  if (command === "init"){
    createDatabase();
  }
} else {
  printHelp();
}

function createDatabase(){
  var connection = argv.connection || 'localhost';
  var scripts = argv.scripts || '.';
  var script = '';

  try{
    script = fs.readFileSync(scripts + '/schema.sql');
  } catch(e){
    console.log('ERROR: cannot find database scripts at path: ' + scripts);
    process.exit(1);
  }

  console.log('creating database with connection ' + connection  + '...');
  var database = new pg.Client(connection);
  database.on('drain', database.end.bind(database)); //disconnect client when all queries are finished
  database.connect();
  var query = database.query(script.toString());
  query.on('error', function(){
    console.log('it did not work out; check arguments and try again');
  });
  query.on('end', function(){
    process.exit();
  });
}

function printHelp(){
  console.log('Usage: shovel [options]');
  console.log('       shovel database init [arguments]');
  console.log();
  console.log('Arguments:');
  console.log('  --connection   connection string for database to install onto');
  console.log('  --scripts      path for database scripts');
  console.log('');
  console.log('Options:');
  console.log('  -h, --help     print this help documentation');
  console.log();
  console.log('Examples:');
  console.log('  apply 311fm database schema to existing postgres database:');
  console.log('  $ shovel database init --connection "tcp://user:pass@localhost/testdb" --scripts ./scripts');
}

