var express = require('express'),
    pg = require('pg').native;

// configure database
database = new pg.Client(process.env.DATABASE_URL || postgresUrl);
//database.on('drain', database.end.bind(database)); //disconnect client when all queries are finished
database.connect();

// configure server
var app = express();
app.set('title', '311.fm :: data');

// routes
app.get('/', function(req, res){
  res.send("311.fm API");
});


app.get('/api/v1/ward/summary', function(req, res){

  console.log(req.originalUrl);

  start = req.query.start;
  end = req.query.end;

  if (null === start || undefined === start || '' === start) {
    res.send(406, "start and end date required");
  }
  if (null === end || undefined === end || '' === end) {
    res.send(406, "start and end date required");
  }

  responses = [];

  response = {
    type: "Summary",
    ward: "All",
    summaries: responses
  };

  database.query(
    "SELECT opened_requests, " +
    "       closed_requests, " +
    "       tardy_requests, " +
    "       days_to_close_requests_avg, " +
    "       request_time_bins, " +
    "       request_counts, " +
    "       ward " +
    "FROM ward_summary('" + start +"', '" + end + "') " +
    "AS " +
    "(opened_requests int, " +
    " closed_requests int, " +
    " tardy_requests int, " +
    " days_to_close_requests_avg double precision, " +
    " request_time_bins text, " +
    " request_counts text, " +
    " ward text)"
  ).on('row', function(result) {    
    result.request_time_bins = JSON.parse(result.request_time_bins);
    result.request_counts = JSON.parse(result.request_counts);
    response.stats = result;
    responses.push(result);
  }).on('end', function() {
    console.log(response);
    res.jsonp(200, response);
  });

});


app.get('/api/v1/:ward/summary', function(req, res){

  console.log(req.originalUrl);

  var ward = req.params.ward,
      start = req.query.start;
      end = req.query.end;

  if (null === start || undefined === start || '' === start) {
    res.send(406, "start and end date required");
  }
  if (null === end || undefined === end || '' === end) {
    res.send(406, "start and end date required");
  }

  response = {
    type: "Summary",
    ward: ward
  };

  database.query(
    "SELECT opened_requests, " +
    "       closed_requests, " +
    "       tardy_requests, " +
    "       days_to_close_requests_avg, " +
    "       request_time_bins, " +
    "       request_counts " +
    "FROM ward_summary('" + ward + "', " + "'" + start +"', '" + end + "') " +
    "AS " +
    "(opened_requests int, " +
    " closed_requests int, " +
    " tardy_requests int, " +
    " days_to_close_requests_avg double precision, " +
    " request_time_bins text, " +
    " request_counts text)"
  ).on('row', function(result) {
    result.request_time_bins = JSON.parse(result.request_time_bins);
    console.log(result.request_counts);
    result.request_counts = JSON.parse(result.request_counts);
    response.stats = result;
  }).on('end', function() {
    console.log(response);
    res.jsonp(200, response);
  });
});

// start server
app.listen(process.env.PORT || 3000);
console.log("server running...");
