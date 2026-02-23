FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package*.json ./
COPY packages/config/package*.json ./packages/config/
COPY packages/database/package*.json ./packages/database/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY services/cgm-service/package*.json ./services/cgm-service/

RUN npm ci --include=dev

COPY packages/config ./packages/config
COPY packages/database ./packages/database
COPY packages/shared-types ./packages/shared-types
COPY services/cgm-service ./services/cgm-service

RUN npm run build --workspace=@bb/shared-types
RUN npm run build --workspace=@bb/config
RUN npm run build --workspace=@bb/database
RUN npm run build --workspace=@bb/cgm-service

FROM node:20-alpine AS production

WORKDIR /app

COPY --from=base /app/services/cgm-service/dist ./dist
COPY --from=base /app/services/cgm-service/package*.json ./
COPY --from=base /app/node_modules ./node_modules

ENV NODE_ENV=production

EXPOSE 3002

CMD ["node", "dist/index.js"]