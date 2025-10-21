# Simple Dockerfile for single-service Spinnergy
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
# Build client if present
RUN if [ -d "./client" ]; then cd client && npm ci && npm run build; fi

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
