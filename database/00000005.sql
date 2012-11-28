-- 311.fm SUMMARY STORED PROC
-- CALCULATE SUMMARY DATA FOR WARD IN A TIME RANGE
-- AUTHOR: JESSE BOUNDS
-- DATE: 9/11/2012

CREATE FUNCTION ward_summary(ward_number text, start_date timestamp, end_date timestamp)
RETURNS RECORD AS $$

  DECLARE

  opened_requests integer;
  closed_requests integer;
  tardy_requests integer;
  days_to_close_requests_avg double precision;
  request_time_bins text;
  request_time_bin_morning integer;
  request_time_bin_afternoon integer;
  request_time_bin_night integer;
  request_time_bin_sunday integer; -- 0
  request_time_bin_monday integer; -- 1
  request_time_bin_tuesday integer; -- 2
  request_time_bin_wednesday integer; -- 3
  request_time_bin_thursday integer; -- 4
  request_time_bin_friday integer; -- 5
  request_time_bin_saturday integer; -- 6
  request_types text;
  request_types_ret_row RECORD;
  ret RECORD;

  BEGIN

  -- COUNT REQUESTS OPENED DURING RANGE
  SELECT count(*)
    INTO opened_requests
    FROM service_requests 
    WHERE ward = ward_number
      AND requested_datetime >= start_date
      AND requested_datetime < end_date;

  -- COUNT REQUESTS CLOSED DURING RANGE
  SELECT count(*) 
    INTO closed_requests 
    FROM service_requests
    WHERE ward = ward_number
      AND closed_datetime >= start_date 
      AND closed_datetime < end_date;

  -- COUNT REQUESTS OPEN > 1 MONTH (28 DAYS)
  SELECT count(*) from service_requests
    INTO tardy_requests
    WHERE status = 'open' 
      AND requested_datetime >= start_date 
      AND requested_datetime < end_date
      AND ward = ward_number
      AND extract(DAY from now() - requested_datetime) > 28;

  -- CALCULATE AVG DAYS CLOSED REQUESTS TAKE TO REACH CLOSED STATE
  SELECT avg(extract(DAY from closed_datetime - requested_datetime))
  INTO days_to_close_requests_avg
  FROM service_requests
  WHERE status = 'closed'
    AND ward = ward_number
    AND requested_datetime >= start_date 
    AND requested_datetime < end_date;

  -- BIN REQUEST TIMES INTO TIME OF DAY BUCKETS

  -- GET MORNING BIN
  SELECT count(*)
  INTO request_time_bin_morning
  FROM service_requests 
  WHERE extract(hour from requested_datetime) >= 0
    AND extract(hour from requested_datetime) < 11
    AND ward = ward_number
    AND requested_datetime >= start_date 
    AND requested_datetime < end_date;

  -- GET AFTERNOON BIN
  SELECT count(*)
  INTO request_time_bin_afternoon
  FROM service_requests 
  WHERE extract(hour from requested_datetime) >= 11
    AND extract(hour from requested_datetime) < 17
    AND ward = ward_number
    AND requested_datetime >= start_date 
    AND requested_datetime < end_date;    

  -- GET NIGHT BIN
  SELECT count(*)
  INTO request_time_bin_night
  FROM service_requests 
  WHERE extract(hour from requested_datetime) >= 17
    AND extract(hour from requested_datetime) < 24
    AND ward = ward_number
    AND requested_datetime >= start_date 
    AND requested_datetime < end_date;

  -- GET SUNDAY BIN
  SELECT count(*)
  INTO request_time_bin_sunday
  FROM service_requests
  WHERE extract(DOW from requested_datetime) = 0
    AND ward = ward_number
    AND requested_datetime >= start_date 
    AND requested_datetime < end_date;

  -- GET MONDAY BIN
  SELECT count(*)
  INTO request_time_bin_monday
  FROM service_requests
  WHERE extract(DOW from requested_datetime) = 1
    AND ward = ward_number
    AND requested_datetime >= start_date 
    AND requested_datetime < end_date;

  -- GET TUESDAY BIN
  SELECT count(*)
  INTO request_time_bin_tuesday
  FROM service_requests
  WHERE extract(DOW from requested_datetime) = 2
    AND ward = ward_number
    AND requested_datetime >= start_date 
    AND requested_datetime < end_date;

  -- GET WEDNESDAY BIN
  SELECT count(*)
  INTO request_time_bin_wednesday
  FROM service_requests
  WHERE extract(DOW from requested_datetime) = 3
    AND ward = ward_number
    AND requested_datetime >= start_date 
    AND requested_datetime < end_date;

  -- GET THURSDAY BIN
  SELECT count(*)
  INTO request_time_bin_thursday
  FROM service_requests
  WHERE extract(DOW from requested_datetime) = 4
    AND ward = ward_number
    AND requested_datetime >= start_date 
    AND requested_datetime < end_date;

  -- GET FRIDAY BIN
  SELECT count(*)
  INTO request_time_bin_friday
  FROM service_requests
  WHERE extract(DOW from requested_datetime) = 5
    AND ward = ward_number
    AND requested_datetime >= start_date 
    AND requested_datetime < end_date;

  -- GET SATURDAY BIN
  SELECT count(*)
  INTO request_time_bin_saturday
  FROM service_requests
  WHERE extract(DOW from requested_datetime) = 6
    AND ward = ward_number
    AND requested_datetime >= start_date 
    AND requested_datetime < end_date;        

 -- PACKAGE TIME BINS
 request_time_bins := '{"morning":' || request_time_bin_morning || 
                      ',"afternoon":' || request_time_bin_afternoon || 
                      ',"night":' || request_time_bin_night || 
                      ',"days": {' ||
                      '    "sunday":' || request_time_bin_sunday || ',' ||
                      '    "monday":' || request_time_bin_monday || ',' ||
                      '    "tuesday":' || request_time_bin_tuesday || ',' ||
                      '    "wednesday":' || request_time_bin_wednesday || ',' ||
                      '    "thursday":' || request_time_bin_thursday || ',' ||
                      '    "friday":' || request_time_bin_friday || ',' ||
                      '    "saturday":' || request_time_bin_saturday ||
                      '  }' ||
                      '}';

  -- GET REQUEST COUNTS
  request_types := '[';
  FOR request_types_ret_row IN SELECT count(*) as count, service_name 
  FROM service_requests
  WHERE ward = ward_number
    AND requested_datetime >= start_date
    AND requested_datetime < end_date
  GROUP BY service_name
  ORDER BY count(*)  DESC
  LOOP
    request_types := request_types || '{"type":"' || request_types_ret_row.service_name || '", "count":' || request_types_ret_row.count || '},';
  END LOOP;
  request_types := trim(trailing ',' from request_types) || ']';
  
  -- PACKAGE FOR SHIPPING
  SELECT opened_requests, 
         closed_requests, 
         tardy_requests,
         days_to_close_requests_avg,
         request_time_bins,
         request_types
  INTO ret;

  -- SEND IT
  RETURN ret;

  END;
$$ LANGUAGE 'plpgsql'
