-- 311.fm SUMMARY STORED PROC
-- CALCULATE SUMMARY DATA FOR WARD IN A TIME RANGE
-- AUTHOR: JESSE BOUNDS
-- DATE: 9/11/2012

CREATE FUNCTION ward_summary(start_date timestamp, end_date timestamp)
RETURNS setof RECORD AS $$

  DECLARE
  rec RECORD;

  BEGIN

  FOR i IN 1..50 LOOP -- OUTER

  FOR rec in SELECT ward,
                  opened_requests, 
                  closed_requests, 
                  tardy_requests
           FROM ward_summary_minimal(trim(to_char(i, '99')), start_date, end_date)
           AS (ward text,
               opened_requests int,
               closed_requests int,
               tardy_requests int)
  LOOP -- INNER
    RETURN NEXT rec;
  END LOOP; -- INNER

  END LOOP; -- OUTER
  
  RETURN;

  END;
$$ LANGUAGE 'plpgsql'