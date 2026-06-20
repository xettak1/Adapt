# Adapt

Adapt is a React + Vite frontend. It can run entirely on mock data, or it can
connect to the Adapt API at `http://localhost:8080/api/v1`.

## Local Frontend

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` if you need to change the API URL or mock
mode for a Vite-only run.

## Docker

Copy the example environment file, then start Postgres:

```bash
Copy-Item .env.example .env
docker compose up -d
```

Run the frontend locally with `npm run dev`. This avoids Docker Desktop doing a
full Linux npm install for the Vite app.

If you specifically want Docker to build and serve the frontend too, run:

```bash
docker compose --profile frontend up --build
```

The Dockerized frontend is served at `http://localhost:3000` by default.

## Postgres

Docker Compose starts a Postgres 16 database with a persistent named volume.
The default local settings are:

```text
host: localhost
port: 5432
database: adapt
user: adapt
password: adapt_dev_password
```

Backend services running inside the same Compose network should use:

```text
postgresql://adapt:adapt_dev_password@db:5432/adapt
```

For a Spring Boot backend, use:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/adapt
SPRING_DATASOURCE_USERNAME=adapt
SPRING_DATASOURCE_PASSWORD=adapt_dev_password
```

This repository currently contains only the frontend. The database schema should
be created by the backend service that owns the API and migrations. SQL files in
`docker/postgres/init` run only the first time the Postgres volume is created.
