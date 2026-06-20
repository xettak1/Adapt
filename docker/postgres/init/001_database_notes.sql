-- This project currently contains the React frontend only.
-- Keep application tables and migrations in the backend service that owns the
-- API contract. Files in this directory run once when the Postgres volume is
-- first created.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
