# build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG GIT_SHA=dev
ARG APP_VERSION=dev
ENV VITE_APP_VERSION=$APP_VERSION
# Optional build-time fallbacks for standalone `docker build`; Compose injects these at runtime.
ARG VITE_DISCORD_CLIENT_ID=
ENV VITE_DISCORD_CLIENT_ID=$VITE_DISCORD_CLIENT_ID
ARG VITE_DISCORD_SERVER_INVITE_URL=
ENV VITE_DISCORD_SERVER_INVITE_URL=$VITE_DISCORD_SERVER_INVITE_URL
ARG VITE_DISCORD_BOT_INVITE_URL=
ENV VITE_DISCORD_BOT_INVITE_URL=$VITE_DISCORD_BOT_INVITE_URL
RUN npm run build

# serve
FROM nginxinc/nginx-unprivileged:alpine
ARG GIT_SHA=dev
ARG APP_VERSION=dev
ENV GIT_SHA=$GIT_SHA \
    APP_VERSION=$APP_VERSION
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --chmod=0755 docker-entrypoint.d/40-env-config.sh /docker-entrypoint.d/40-env-config.sh
EXPOSE 8080
