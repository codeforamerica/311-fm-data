/*
 * Sync 311.fm database with remote endpoint.
 */

var request = require('request'),
    tempus = require('Tempus'),
    pg = require('pg'); 
    _ = require('underscore'),
    argv = require("optimist").argv;

var baseUrl = "http://311api.cityofchicago.org/open311/v2/requests.json?extensions=true&page_size=100",
    serviceRequests = [],
    datetime,    
    postgresUrl,
    database;

// sql statements
var insertStatement = "INSERT INTO service_requests(service_request_id, status, duplicate, parent_service_request_id, requested_datetime) values($1, $2, $3, $4, $5)",
    updateStatement = "UPDATE service_requests SET status = $2, duplicate = $3, parent_service_request_id = $4, requested_datetime = $5 WHERE service_request_id = $1";

// postgres error codes
var duplicateKeyError = "23505";

// XXX: we should be able to work completely in UTC time on the server side.
//      but, due to issues on the ConnectedBits endpoint, we cannot. They seem to only deal
//      in local, Chicago time no matter what offset we pass in. For now, we will convert to
//      Chicago time in this script but this should be changed to UTC ASAP
//tempus.addTimeFormat('iso', '%m::%d::%y');
var runTime = new tempus(new Date());
// -18000 is the current CDT offset for Chicago (-5 hours in seconds) from UTC
// 300 is the current CDT offset for Chicago (-5 hours in minutes) from UTC
runTime.timezoneOffset(300).addTimeStamp(-18000);

// XXX: under construction: process input params:
if (argv.dt) {
	datetime = argv.dt;	
}
if (argv.u) {
	postgresUrl = argv.u;
	database = new pg.Client(postgresUrl);
	database.on('drain', database.end.bind(database)); //disconnect client when all queries are finished
	database.connect();
}

// start process of downloading - this will run via recursive calls in the callbacks 
// of the responses until all pages are downloaded
call(1, datetime);

/*
 * Orchestrates downloading service requests and saving them to DB (if required)
 */
function call(page, datetime) {
	var url = _buildUrlString(page, datetime);
	console.log(url);

	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			responses = JSON.parse(body);			
			serviceRequests.push(responses);

			if (responses.length == 100) { 
				call(++page, datetime); 
			}
			else {	
				_.each(_.flatten(serviceRequests), function(serviceRequest) {
					console.log(serviceRequest);

					if (database) {
						database.query({name: "insert",
							text: insertStatement, 
							values: [serviceRequest.service_request_id, 
                       serviceRequest.status, 
                       serviceRequest.extended_attributes.duplicate | false,
                       serviceRequest.extended_attributes.parent_service_request_id,
                       serviceRequest.requested_datetime]}
						).on("error", function(error) {
							_handleInsertError(error, serviceRequest);
						});
					}					
				}); 
			}
		}
	});
}

/*
 * Utility functions
 */

function _handleInsertError(error, serviceRequest) {
	if (duplicateKeyError === error.code) {
		database.query({name: "update",
			text: updateStatement, 
			values: [serviceRequest.service_request_id, 
               serviceRequest.status,
               serviceRequest.extended_attributes.duplicate | false,
               serviceRequest.extended_attributes.parent_service_request_id,
               serviceRequest.requested_datetime]}
		).on("error", function(error) {
			// update failure for upsert case, this should not happen
			console.log(error);
		});
	} else { 
		// XXX: handle other types of db errors better
		console.log(error);
	}
}

function _buildUrlString(page, datetime) {
	var url = baseUrl + "&page=" + page + "&updated_after=" + datetime;

	return url;
}