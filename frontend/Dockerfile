FROM node:16.14.2-alpine3.15 as base
# Create a user group 'appuser'
RUN addgroup -S appuser
# Create a user 'appuser' and create 'appuser' group in process
RUN adduser -S -D -g appuser -h /usr/app appuser

# FROM base as dependencies
FROM base as dependencies
WORKDIR /tmp/
COPY package*.json .
RUN apk add --no-cache python3 make g++
RUN npm ci

FROM base as server
WORKDIR /usr/app/src
# Copy node modules from dependency stage to base layer
COPY --from=dependencies /tmp/node_modules ./node_modules
# Copy sourse code to base layer
COPY . .

# Chown all the files to the app user.
RUN chown -R appuser:appuser /usr/app/src
USER appuser

EXPOSE 3000
CMD ["npm", "start"]

