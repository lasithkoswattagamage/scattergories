FROM node:14.19.1-alpine3.15 as base
EXPOSE 3000
WORKDIR /usr/app/

# Create a user group 'appuser'
RUN addgroup -S appuser
# Create a user 'appuser' and create 'appuser' group in process
RUN adduser -S -D -g appuser -h /usr/app/src appuser

# FROM base as dependencies
FROM base as dependencies
WORKDIR /tmp/
COPY package*.json .
RUN apk add --no-cache python2 make g++
RUN npm ci

FROM base as server
# Copy node modules from dependency stage to base image
WORKDIR /usr/app/src
COPY --from=dependencies /tmp/node_modules ./node_modules
COPY . .

# Chown all the files to the app user.
RUN chown -R appuser:appuser /usr/app
USER appuser

CMD ["npm", "start"]

