# Scattergories

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
