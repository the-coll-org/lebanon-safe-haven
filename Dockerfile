FROM node:20-alpine

# Native module build tools (required for better-sqlite3)
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Persistent data directory for SQLite
RUN mkdir -p /data

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
