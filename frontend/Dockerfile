FROM node:22-alpine AS base
# Create a user group 'appuser'
RUN addgroup -S appuser
# Create a user 'appuser' and create 'appuser' group in process
RUN adduser -S -D -g appuser -h /usr/app appuser

FROM base AS dependencies
WORKDIR /tmp/
COPY package*.json .
ARG NODE_ENV=testing
RUN npm ci

FROM base AS server
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

