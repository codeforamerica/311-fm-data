-- 311.fm SUMMARY MINMAL STORED PROC
-- CALCULATE SUMMARY DATA FOR WARD IN A TIME RANGE
-- AUTHOR: JESSE BOUNDS
-- DATE: 9/11/2012

CREATE FUNCTION ward_summary_minimal(ward_number text, start_date timestamp, end_date timestamp)
RETURNS RECORD AS $$

  DECLARE

  opened_requests integer;
  closed_requests integer;
  tardy_requests integer;
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
  
  -- PACKAGE FOR SHIPPING
  SELECT ward_number as ward,
         opened_requests, 
         closed_requests, 
         tardy_requests
  INTO ret;

  -- SEND IT
  RETURN ret;

  END;
$$ LANGUAGE 'plpgsql'
