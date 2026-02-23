# Quick Start - BetterBlood

## Run Everything in 5 Commands

```bash
# 1. Clone (if not already)
git clone https://github.com/iangcastill0/diabetes-app-research-pitch.git betterblood
cd betterblood

# 2. Start infrastructure
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# 3. Install dependencies and migrate
npm install
npm run db:migrate

# 4. Start all backend services
npm run dev:services

# 5. In new terminal, start mobile app
cd apps/mobile && npm install && npm run android
```

## Requirements

- Node.js 20+
- Docker Desktop
- Android Studio (for virtual device)

## Architecture

- **Mobile**: React Native (apps/mobile/)
- **Backend**: Node.js microservices (services/)
- **Database**: PostgreSQL + TimescaleDB
- **Cache**: Redis
- **Gateway**: Kong

## Services

| Service | Port | URL |
|---------|------|-----|
| Kong Gateway | 8000 | http://localhost:8000 |
| Auth Service | 3001 | http://localhost:3001 |
| CGM Service | 3002 | http://localhost:3002 |
| Food Service | 3003 | http://localhost:3003 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

## Testing API

```bash
# Health check
curl http://localhost:8000/health

# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123!"}'
```

## Full Documentation

- [Setup Guide](./docs/guides/SETUP.md)
- [Virtual Device Setup](./docs/guides/VIRTUAL_DEVICE_SETUP.md)
- [Architecture](./docs/architecture/system-architecture.md)

## Support

Open an issue at: https://github.com/iangcastill0/diabetes-app-research-pitch/issues