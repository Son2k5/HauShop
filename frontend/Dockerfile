FROM node:22-alpine AS build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
ARG VITE_API_BASE_URL=https://localhost:7288/api
ARG VITE_SIGNALR_URL=https://localhost:7288/hubs/chat
ARG VITE_NOTIFICATION_HUB_URL=https://localhost:7288/hubs/notifications
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SIGNALR_URL=$VITE_SIGNALR_URL
ENV VITE_NOTIFICATION_HUB_URL=$VITE_NOTIFICATION_HUB_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
