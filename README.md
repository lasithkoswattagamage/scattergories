# Scattergories

## Local Development

`.env.test` contains default values for various Mongo related environmental variables.
Change accordingly for development and production environments

```
# Run Locally
docker compose \
    --env-file .env.test \
    -f docker-compose.test.yaml \
    up

# Rebuild
#   --renew-anon-volumes neccessary if any adjustments are made to the
#   mongo init script
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
