/**
 * Sync
 * Sync 311fm database with remote Open311 endpoint.
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var request = require('request')
  , tempus = require('Tempus')
  , pg = require('pg')['native']
  , _ = require('underscore')
  , argv = require("optimist").argv;

exports = module.exports = createSync;

/**
 * Sync script variables
 */

var baseUrl = "http://311api.cityofchicago.org/open311/v2/requests.json?extensions=true&page_size=100"
  , serviceRequests = []
  , datetime
  , postgresUrl
  , database;

// sql statements
var insertStatement = "INSERT INTO service_requests(service_request_id, " +
        "status, duplicate, parent_service_request_id, requested_datetime, " +
        "updated_datetime, opened_datetime, closed_datetime, service_name, service_code, " +
        "agency_responsible, lat, long, zipcode, channel, ward, police_district) " +
        "values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)"
  , updateStatement = "UPDATE service_requests SET status = $2, duplicate = $3, " +
        "parent_service_request_id = $4, requested_datetime = $5, updated_datetime =$6, " +
        "opened_datetime = $7, closed_datetime = $8, service_name = $9, service_code = $10, " +
        "agency_responsible = $11, lat = $12, long = $13, zipcode = $14, channel = $15, " +
        "ward = $16, police_district = $17 " +
        "WHERE service_request_id = $1";

// postgres error codes
var duplicateKeyError = "23505";

// postgres object
var database;

function createSync(){
  var sync = {};
  sync.download = _download;
  if (argv.database){
    postgresUrl = argv.database;
    database = new pg.Client(process.env.DATABASE_URL || postgresUrl);
    database.on('drain', database.end.bind(database)); //disconnect client when all queries are finished
    database.connect();
  }
  return sync;
}

/**
 * Orchestrates downloading service requests and saving them to DB (if required)
 */

function _download(datetime, page) {
  // default to 1 hour back and page 1
  var runTime = new tempus(new Date()).addTimeStamp(-3600);
  datetime = (datetime === undefined) ? runTime.toJSON('ISO') : datetime;
  page = (page === undefined) ? 1 : page;

  var url = _buildUrlString(page, datetime);
  console.log(url);

  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      responses = JSON.parse(body);
      serviceRequests.push(responses);

      if (responses.length == 100) {
        _download(datetime, ++page);
      } else {
        _.each(_.flatten(serviceRequests), function(serviceRequest) {
          console.log(serviceRequest);

          if (database) {
            // with this version of the API, we must sift through the notes looking for
            // datetimes. there is no guarantee the notes will be there, there is no guarnatee
            // there will be an "opened" or "closeed", note. we just have to hope
            var openedNote = _.find(serviceRequest.notes, function(note) {
              if ("opened" === note.type) {
                return note;
              }
            }) || {};
            var closedNote = _.find(serviceRequest.notes, function(note) {
              if ("closed" === note.type) {
                return note;
              }
            }) || {};
            // Extended attributes are not guaranteed to be present
            if (!serviceRequest.extended_attributes) {
              serviceRequest.extended_attributes = {};
            }
            database.query({
              name: "insert",
              text: insertStatement,
              values: [serviceRequest.service_request_id,
                serviceRequest.status,
                serviceRequest.extended_attributes.duplicate || false,
                serviceRequest.extended_attributes.parent_service_request_id,
                serviceRequest.requested_datetime,
                serviceRequest.updated_datetime,
                openedNote.datetime,
                closedNote.datetime,
                serviceRequest.service_name,
                serviceRequest.service_code,
                serviceRequest.agency_responsible,
                serviceRequest.lat,
                serviceRequest.long,
                serviceRequest.zipcode,
                serviceRequest.extended_attributes.channel,
                serviceRequest.extended_attributes.ward,
                serviceRequest.extended_attributes.police_district]
            }).on("error", function(error) {
              _handleInsertError(error, serviceRequest, openedNote, closedNote);
            });
          }
        });
      }
    }
  });
}

/**
 * Utility functions
 */

function _handleInsertError(error, serviceRequest, openedNote, closedNote) {
  if (duplicateKeyError === error.code) {
    database.query({
      name: "update",
      text: updateStatement,
      values: [serviceRequest.service_request_id,
        serviceRequest.status,
        serviceRequest.extended_attributes.duplicate || false,
        serviceRequest.extended_attributes.parent_service_request_id,
        serviceRequest.requested_datetime,
        serviceRequest.updated_datetime,
        openedNote.datetime,
        closedNote.datetime,
        serviceRequest.service_name,
        serviceRequest.service_code,
        serviceRequest.agency_responsible,
        serviceRequest.lat,
        serviceRequest.long,
        serviceRequest.zipcode,
        serviceRequest.extended_attributes.channel,
        serviceRequest.extended_attributes.ward,
        serviceRequest.extended_attributes.police_district]
    }).on("error", function(error) {
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
