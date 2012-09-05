--
-- PostgreSQL database dump
-- pg_dump --host localhost --schema-only --no-owner fm_311_mirror > schema.sql
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

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


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
    requested_datetime timestamp with time zone NOT NULL
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
REVOKE ALL ON SCHEMA public FROM jesse;
GRANT ALL ON SCHEMA public TO jesse;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--
