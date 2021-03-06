--
-- PostgreSQL database dump for fm_311_mirror
-- pg_dump --host localhost --schema-only --no-owner fm_311_mirror > schema.sql
-- psql fm_311_mirror < schema.sql
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;

--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

--COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: service_requests; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE service_requests (
    service_request_id text NOT NULL,
    status character varying(15),
    duplicate boolean,
    parent_service_request_id character varying(30),
    requested_datetime timestamp with time zone NOT NULL,
    updated_datetime timestamp with time zone NOT NULL,
    opened_datetime timestamp with time zone,
    closed_datetime timestamp with time zone,
    service_name character varying(50) NOT NULL,
    service_code character varying(50) NOT NULL,
    agency_responsible character varying(100) NOT NULL,
    lat double precision,
    long double precision,
    zipcode character varying(10),
    channel character varying(20),
    ward character varying(10),
    police_district character varying(10)
);


--
-- Name: update_log; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE update_log (
    last_run_at timestamp with time zone NOT NULL,
    notes character varying(100)
);


--
-- Name: service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (service_request_id);


--
-- Name: update_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY update_log
    ADD CONSTRAINT update_log_pkey PRIMARY KEY (last_run_at);


--
-- Name: public; Type: ACL; Schema: -; Owner: -
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--
