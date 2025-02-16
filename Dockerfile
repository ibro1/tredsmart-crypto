# Dockerfile
FROM node:20-bullseye-slim AS base

# Install Python and build tools FIRST
RUN apt-get update && apt-get install -y python3 g++ make redis-server

# Install pnpm
RUN npm install -g corepack@0.24.1 && corepack enable

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store/v3 \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# After COPY . /app but before build step
RUN pnpm db:gen

# After installing dependencies but before starting the app
RUN pnpm prod:db:deploy

# Only if you need initial data
# RUN pnpm prod:db:seed

# Build application
RUN pnpm build

# Production stage
FROM base AS production

ENV NODE_ENV=production

# Copy built assets and dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/build ./build
COPY --from=base /app/public ./public

# Add Redis configuration
COPY redis.conf /etc/redis/redis.conf
RUN mkdir -p /data/redis
RUN chown -R node:node /data/redis

# Start Redis and the app
EXPOSE 3000 6379
CMD redis-server /etc/redis/redis.conf --daemonize yes && pnpm start