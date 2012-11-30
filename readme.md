# 311.fm Data API (and tools)

### Data API and tooling for the 311.fm data analysis application

In 2012, Code for America, Smart Chicago Collaborative, and the City of Chicago worked with the City's vendors to stand up an Open311 server for 311 data in Chicago. The tools in this repo allow you to set up a mirrored copy of the Chicago endpoint* and access that data with a web API that supports aggregation and anlysis features that are not available on the underlying Open311 API.

\* Note: Theortically, this tool will work with any compatible Open311 endpoint - to be compatible, the Open311 endpoint must support and supply the Connected Bits "extended" Open311 parameters. More information about the extended parameters can be found in the [City of Chicago's Open311 API documenation](http://dev.cityofchicago.org/docs/api)

### Features
<hr/>

Here is a listing of capabilities of the tools this repo:

* **shovel** a command line buddy tool that makes it easier to setup and run this project
* **sync** a script that copies data from an Open311 endpoint (i.e. Chicago's) into a postgres database
* **server** a node web server that makes the data in the postgres database available via a web API that supports analysis and aggregation capabilities not found in the native Open311 API

### Development Setup
<hr/>

The best way to get started with this project is to install the prerequisites (listed below) in your development environment and then clone this repo. The principal technologies used are [node](http://nodejs.org/), [npm](https://npmjs.org/), and [postgreSQL database](http://www.postgresql.org/) and development has been done on a mac but you should be able to use any *nix or windows computer to run and do development on this project.

#### Prerequisites
<hr/>

To run the API server in your local environment first install:

* **Postgres** if you are using a mac, a great (and easy) way to get postgres running is [Postgres.app](http://postgresapp.com/). You can also install with a package manager for your machine like [homebrew](http://mxcl.github.com/homebrew/) on a mac or [APT](https://help.ubuntu.com/8.04/serverguide/apt-get.html) on Ubuntu for example.
* **Node** and **NPM** a quick and easy way to install node and it's packagage manager (NPM) is to simply go to the [node distribution page](http://nodejs.org/dist/), download a distro for your environment, and then install on your machine.

Although it is not required, another helpful tool to install is [pgadmin](http://www.pgadmin.org/). It's a visual database administration and exploration tool that might be easier to use than the psql command line tool that comes with postgres.


##### A word about Postgres, Node, and NPM versions

Please note that this application has been developed and tested with:

* Postgres 9.1.3 the current (as of this writing) postgres version in Postgres.app
* Node 8.14
* NPM 1.1.65

**The 311.fm Data application and tooling might work with prior or later versions of Postgres and Node but you will be in untested territory.**

#### Installation
<hr/>

Clone the repo:

    $ clone git@github.com:codeforamerica/311-fm-data.git
    
cd into the repo:

    $ cd 311-fm-data
    
Install the node dependancies with npm:

    $ npm install
    
For your convience, you should also install the project via npm globally so that the "shovel" tool is easily available from your development command line:

    $ npm install . -g
    
#### database setup
<hr/>

When you installed postgres, you also should've installed the psql command line tool (Postgres.app does this for you). Use this to create your local development database:

    $ createdb testdb
    
Use the 311.fm shovel tool to initialize the database with the sql scripts in the 311-fm-data/scripts folder:

    $ shovel database init --database "dbname=testdb" --scripts ./scripts

At this point, you should be able to connect to the database with psql or pgadmin and check that the tables and stored procedures were created by the shovel command.

#### environment variable setup
<hr/>

To make the API server aware of the database that was just created, we create an environment variable called DATABASE_URL and set the connection string appropriately. For development, you should be able to use localhost and the "testdb" database name we used when we created the db:

    $ export DATABASE_URL=tcp://@localhost/testdb
 
Of course, this variable will only last as long as your current shell session so you can also set up a .env file that holds the export command so this step can be avoided in the future.

#### run the tests
<hr/>

If all the previous steps have completed without errors, you should be able to run the API server tests to make sure the system is functioning correctly. One of the packages installed in the "npm install" step above was "jasmine-node" which is a command line wrapper for the [jasmine](http://pivotal.github.com/jasmine/) testing library. This allows us to run all the tests in the repo with:

    $ jasmine-node spec/
    
    ./api/v1/wardsummary                                                                                                                                                                                                                                                               
    ./api/v1/ward/summary?start=2012-01-01                                                                                                                                                                                                                                              
    ./api/v1/ward/summary?end=2012-01-01                                                                                                                                                                                                                                     
    ./api/v1/ward/summary?start=2012-01-01&end=2012-12-01                                                                                                                                                                                                                                                                                                                      
    
    Finished in 0.288 seconds                                                                                                                                                                                                                                                        
    5 tests, 5 assertions, 0 failures

At this point, you have a working version of the 311.fm API on your development environment! Keep going to learn how to populate it with data from the Chicago endpoint and run the server API web application.

#### pull data from an Open311 endpoint
<hr/>

Although the core components of the application are working at this point, we don't yet have data in our test database. To fix that, run:

    $ shovel database sync --database "tcp://@localhost/testdb"
    
By default, this will pull the last 60 minutes worth of service requests from Chicago's endpoint into your local database. You can specify a --start parameter to force the script to start from a different datetime (see shovel "buddy" script details below)

#### run the server API application
<hr/>

Running the API server is as easy as:

    $ node lib/server.js
    now serving on port 3000

This starts the server on port 3000 on your development machine. Some interesting test queries might be:


* **Summary for all wards for June, 2012**

  http://localhost/api/v1/ward/summary?start=2012-06-01&end=2012-06-30
  
* **Summary detail for Ward 47 for November, 2012**

  http://localhost/api/v1/47/summary?start=2012-11-01&end=2012-11-30
  
* **Summary detail for Ward 17 for November, 2012**

  http://localhost/api/v1/47/summary?start=2012-11-01&end=2012-11-30  
  
  NOTE: you might not have data for June or November 2012 in your development environment at first so you might want to adjust the **start/end** query params to see something more meaningful

### Deploying to a Production Environment
<hr/>

Deploying the 311.fm API application to your own server environment is easy. Just follow the above steps on whatever environment you want to deploy to! 

For Heroku, the repo includes a Procfile script so you should only need to follow the [Heroku node deployment instructions](https://devcenter.heroku.com/articles/nodejs) and push your working development environment to the cloud. 

Of course, for both one off servers and Heroku, you will need to create a postgres instance and set your DATABASE_URL environment variable on the production server accordingly. Also, it's useful to set a NODE_ENV (export NODE_ENV=production) environment variable so devel dependancies (i.e. jasmine) don't get installed on your production server.

You might also want to script a "shovel database sync" worker to run every so often to get the latest information available on the Open311 endpoint and copy to your database.

### The shovel "buddy" Script

As we've seen, the shovel tool can help you to more easily intialize your development environment and control the sync script. For a full listing of its capabilities, simply run:

    $ shovel --help

### More Information

* This project is maintained by Jesse Bounds at Code for America and Dan X O'niel at the Smart Chicago Collaborative. If you are interested in contributing to the project, please contact Jesse Bounds (jesse@codeforamerica.org)
* A canonical instance of the API server runs [here](http://chicagoworks-api.herokuapp.com/)
* This software is free and MIT licensed so please feel free to use accordingly

## License
<hr/>

License
(The MIT License)

Copyright (c) 2012-2013 Code for America

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

<hr/>

![logo](http://codeforamerica.org/wp-content/themes/cfawp2012/images/logo.png)


