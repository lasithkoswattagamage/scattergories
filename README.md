# Scattergories

An online reimagining of the cult classic Scattergories game by Hasbro. This projects was originally intended as a way to play Scattergories, over the internet, with my mates during COVID.

The responsive CSS queries, the UI can respond to a multitude of devices so your friends can have the same great experience across mobile, tablet and laptop.

The entire application has been dockerised so that it can be seemlessly deployed using the `docker-compose` CLI tool

<img style="width: 60%; height: auto" src="assets/Showcase.png">

## Technology Stack

### Frontend

- HTML/CSS/JS
- JQuery
- Socket.io Client Library

## Builders

- Dart Sass (CSS Preprocessor)

### Backend

- MongoDB (Database)
- Express/NodeJS (API)
- Socket.io (HTTP Socket Library)

### Deployment

- Docker

## Live Deployment

You can view a live version of this application at [https://scattergories.lasithkg.au](https://scattergories.lasithkg.au)

## Local Development

### Run Locally

`.env.test` contains default values for various Mongo related environmental variables.
Change accordingly for production (`.env`) environments

```
docker compose \
    --env-file .env.test \
    -f docker-compose.test.yaml \
    up
```

### Additional Commands

```
# Rebuild
#   Run when a change is made to a Dockerfile built in the docker-compose file
#   --renew-anon-volumes neccessary if any adjustments are made to the mongo init script
docker compose \
    --env-file .env.test \
    -f docker-compose.test.yaml \
    build --no-cache

# Redeploy
docker compose \
    --env-file .env.test \
    -f docker-compose.test.yaml \
    up --force-recreate --renew-anon-volumes

# Deprovisioning
docker compose \
    --env-file .env.test \
    -f docker-compose.test.yaml \
    down
```
