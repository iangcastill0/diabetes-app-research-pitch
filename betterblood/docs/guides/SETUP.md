# BetterBlood Setup Guide

## Local Development Environment

### 1. Install Prerequisites

**macOS/Linux:**

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required packages
brew install node@20 docker docker-compose postgresql@16 redis
```

**Windows:**

- Install [Node.js 20](https://nodejs.org/)
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Install [Git](https://git-scm.com/)

### 2. Project Setup

```bash
# Clone repository
git clone https://github.com/betterblood/betterblood.git
cd betterblood

# Install root dependencies
npm install

# Install all workspace dependencies
npm run bootstrap
```

### 3. Environment Configuration

Create `.env` file in project root:

```env
# Environment
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=betterblood
DB_USER=betterblood
DB_PASSWORD=betterblood

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Log Level
LOG_LEVEL=debug
```

### 4. Start Infrastructure

```bash
# Start PostgreSQL, Redis, and Kong
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Verify services are running
docker-compose ps
```

### 5. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

### 6. Start Services

**Option 1 - All services:**

```bash
npm run dev:services
```

**Option 2 - Individual services:**

```bash
# Terminal 1: Auth Service
cd services/auth-service && npm run dev

# Terminal 2: CGM Service
cd services/cgm-service && npm run dev

# Terminal 3: Food Service
cd services/food-service && npm run dev
```

Verify services:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

### 7. Mobile App

```bash
cd apps/mobile

# Install dependencies
npm install

# iOS (requires macOS and Xcode)
npm run ios

# Android (requires Android Studio)
npm run android
```

## API Testing

Use the Kong gateway URL for all API calls:

```bash
# Register a user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Get current CGM reading (replace TOKEN)
curl http://localhost:8000/api/v1/cgm/current \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

### Database Connection Issues

```bash
# Reset PostgreSQL container
docker-compose -f infrastructure/docker/docker-compose.yml restart postgres

# Reset database
docker-compose -f infrastructure/docker/docker-compose.yml down -v
docker-compose -f infrastructure/docker/docker-compose.yml up -d
npm run db:migrate
```

### Redis Connection Errors

```bash
# Restart Redis
docker-compose -f infrastructure/docker/docker-compose.yml restart redis
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules */node_modules
npm install
npm run build
```

## Development Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and write tests
3. Run lint: `npm run lint`
4. Run tests: `npm test`
5. Commit: `git commit -m "Add feature"`
6. Push: `git push origin feature/my-feature`
7. Create Pull Request

## Useful Commands

```bash
# View logs
docker-compose logs -f <service-name>

# SSH into container
docker-compose exec <service-name> sh

# Reset everything
docker-compose down -v
npm run clean
npm install
npm run bootstrap

# Database console
docker-compose exec postgres psql -U betterblood -d betterblood
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for AWS production deployment instructions.