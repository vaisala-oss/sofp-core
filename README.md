# sofp-core

This is a OGC API Features server originally developed for distributing meteorological data using an encoding that will be calle simple observation features. The core project only serves as a proxy to a backend implementation that provides access to data. Deployment strategy is dockerized so that the sofp-core will produce a docker image that a backend implementation may build on top of.

[![Build Status](https://semaphoreci.com/api/v1/sampov2/sofp-core-2/branches/master/badge.svg)](https://semaphoreci.com/sampov2/sofp-core-2)

© 2018-2020 Vaisala Corporation

## To release

To release a new version, do the following:

1. Bump the version appropriately in package.json
2. Commit and push all changes
3. rm -r dist/
4. npm run build
5. npm publish

## OGC API Features Validation

API Features validation can be checked using the OGC Team Engine

1. When you have SOFP running, start the team engine test suite in docker: `docker run --network=host ogccite/ets-ogcapi-features10`
2. Access the team engine via a browser http://localhost:8081/teamengine/
3. Log in to teamengine (login `ogctest`/`ogctest`)
4. Create new test session, select: organisation = OGC, specification = OGC API - Features 1.0, click "start new test session"
5. Enter location of landing page (for example http://localhost:3000/sofp)
6. Click "start"


## Building a docker image of the sofp-core (deprecated)

To build a local version of the docker image:

  docker build --no-cache -t sofp/core .

To start the local image (removing the container when stopped):

  docker run --rm -p 127.0.0.1:8080:3000/tcp sofp/core

## CI

This project is using Semaphore CI: https://semaphoreci.com/sampov2/sofp-core-2

## OGC API Features Validation

API Features validation can be checked using the OGC Team Engine

1. When you have SOFP running, start the team engine test suite in docker: `docker run --network=host ogccite/ets-ogcapi-features10`
2. Access the team engine via a browser http://localhost:8081/teamengine/
3. Log in to teamengine (login `ogctest`/`ogctest`)
4. Create new test session, select: organisation = OGC, specification = OGC API - Features 1.0, click "start new test session"
5. Enter location of landing page (for example http://localhost:3000/sofp)
6. Click "start"