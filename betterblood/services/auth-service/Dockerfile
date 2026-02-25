FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/config/package*.json ./packages/config/
COPY packages/database/package*.json ./packages/database/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY services/auth-service/package*.json ./services/auth-service/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/config ./packages/config
COPY packages/database ./packages/database
COPY packages/shared-types ./packages/shared-types
COPY services/auth-service ./services/auth-service

# Build packages first (dependencies)
RUN npm run build --workspace=@bb/shared-types
RUN npm run build --workspace=@bb/config
RUN npm run build --workspace=@bb/database

# Build auth service
RUN npm run build --workspace=@bb/auth-service

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy only necessary files
COPY --from=base /app/services/auth-service/dist ./dist
COPY --from=base /app/services/auth-service/package*.json ./
COPY --from=base /app/node_modules ./node_modules

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/index.js"]