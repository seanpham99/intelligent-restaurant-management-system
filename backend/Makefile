.PHONY=init-network data-dir init-db services-up \
		services-down services-recreate install build

init-network:
	docker network inspect irms-frontend >/dev/null 2>&1 || docker network create irms-frontend

data-dir:
	mkdir -p data/db
	chmod -R 777 data/db

	mkdir -p data/mqtt/config \
		data/mqtt/data \
		data/mqtt/log
	chmod -R 777 data/mqtt/*

	mkdir data/pgadmin
	chmod -R 777 data/pgadmin

init-db:
	cp env.template .env
	docker compose up -d db
	sleep 5
	docker cp migrate.sql irms-db:/tmp/migrate.sql
	docker exec irms-db psql -U postgres -d postgres -f /tmp/migrate.sql

build:
	docker compose build

services-up:
	docker compose up -d

services-down:
	docker compose down

services-recreate:
	docker compose up -d --force-recreate

install: init-network data-dir init-db build services-up
