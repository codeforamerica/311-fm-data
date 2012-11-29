var request = require('request');

var Requester = {
  get: function(path, callback){
    request('http://localhost:3000' + path, callback);
  }
};

function withServer(callback) {
  var app = require('../lib/server.js');
  app.listen(3000);

  var stopServer = function(){
    app.close();
  };

  callback(Requester, stopServer);
}

describe('Server', function(){

  var stopServer;

  describe('get /', function(){
    var flag, statusCode;

    it('responds successfully', function(){
      runs(function(){
        flag = false;

        withServer(function(r, done){
          r.get('/', function(err, res, body){
            flag = true;
            statusCode = res.statusCode;
            stopServer = done;
          });
        });
      });

      waitsFor(function(){
        return flag;
      }, "The status should be returned", 750);

      runs(function(){
        expect(statusCode).toEqual(200);
      });
    });

  });

  describe('get /api/v1/ward/summary', function(){
    var flag, statusCode;

    it('responds with 406 when start and end are not passed', function(){
      runs(function(){
        flag = false;

        withServer(function(r, done){
          r.get('/api/v1/ward/summary', function(err, res, body){
            flag = true;
            statusCode = res.statusCode;
            stopServer = done;
          });
        });
      });

      waitsFor(function(){
        return flag;
      }, "The status should be returned", 750);

      runs(function(){
        expect(statusCode).toEqual(406);
      });
    });

    it('responds with 406 when only start is passed', function(){
      runs(function(){
        flag = false;

        withServer(function(r, done){
          r.get('/api/v1/ward/summary?start=2012-01-01', function(err, res, body){
            flag = true;
            statusCode = res.statusCode;
            stopServer = done;
          });
        });
      });

      waitsFor(function(){
        return flag;
      }, "The status should be returned", 750);

      runs(function(){
        expect(statusCode).toEqual(406);
      });
    });

    it('responds with 406 when only end is passed', function(){
      runs(function(){
        flag = false;

        withServer(function(r, done){
          r.get('/api/v1/ward/summary?end=2012-01-01', function(err, res, body){
            flag = true;
            statusCode = res.statusCode;
            stopServer = done;
          });
        });
      });

      waitsFor(function(){
        return flag;
      }, "The status should be returned", 750);

      runs(function(){
        expect(statusCode).toEqual(406);
      });
    });

    it('responds successfully', function(){
      runs(function(){
        flag = false;

        withServer(function(r, done){
          r.get('/api/v1/ward/summary?start=2012-01-01&end=2012-12-01', function(err, res, body){
            flag = true;
            statusCode = res.statusCode;
            stopServer = done;
          });
        });
      });

      waitsFor(function(){
        return flag;
      }, "The status should be returned", 750);

      runs(function(){
        expect(statusCode).toEqual(200);
        stopServer();
      });
    });

  });

});

