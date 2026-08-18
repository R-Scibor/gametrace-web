# build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Baked into the SPA at build time (Vite only exposes VITE_*).
ARG VITE_DISCORD_CLIENT_ID=
ENV VITE_DISCORD_CLIENT_ID=$VITE_DISCORD_CLIENT_ID
ARG VITE_DISCORD_SERVER_INVITE_URL=
ENV VITE_DISCORD_SERVER_INVITE_URL=$VITE_DISCORD_SERVER_INVITE_URL
ARG VITE_DISCORD_BOT_INVITE_URL=
ENV VITE_DISCORD_BOT_INVITE_URL=$VITE_DISCORD_BOT_INVITE_URL
RUN npm run build

# serve
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
