# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
WORKDIR /app
COPY --from=builder /app/dist /app/dist
RUN cp -r /app/dist/* /usr/share/nginx/html/
EXPOSE 80
