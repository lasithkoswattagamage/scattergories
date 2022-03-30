# Scattergories

## Live Deployment

Visit a live version of this application at [scattergories.lasithkg.au](http://scattergories.lasithkg.au)

## Local Development

`.env.test` contains default values for various Mongo related environmental variables.
Change accordingly for production environments (`.env`)

```
# Run Locally
docker compose --env-file .env.test up

# Rebuild
#   --renew-anon-volumes neccessary if any adjustments are made to the
#   mongo config options
docker compose --env-file .env.test up --force-recreate --renew-anon-volumes

# Deprovisioning
docker compose down
```
