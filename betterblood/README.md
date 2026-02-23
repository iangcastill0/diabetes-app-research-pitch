# BetterBlood - Diabetes Management Application

BetterBlood (BB) is an FDA-aligned diabetes management platform with intelligent insulin dosing and AI lifestyle coaching. Built with enterprise-grade architecture, HIPAA compliance, and timeless design.

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (with TimescaleDB extension)
- Redis 7

### Local Development

```bash
# Clone and setup
git clone https://github.com/betterblood/betterblood.git
cd betterblood
npm install

# Start infrastructure
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Start all services
npm run dev

# In another terminal, start mobile app
cd apps/mobile
npm install
npm run ios  # or npm run android
```

## Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.73 |
| Backend | Node.js 20 + TypeScript |
| Database | PostgreSQL 16 + TimescaleDB |
| Cache | Redis 7 |
| Gateway | Kong API Gateway |
| Infrastructure | AWS EKS + Terraform |

### Services

- **Auth Service** (Port 3001) - JWT/OAuth2 authentication, MFA support
- **CGM Service** (Port 3002/3003) - Continuous glucose monitoring, WebSocket real-time
- **Food Service** (Port 3004) - Food database, meal logging
- **Insulin Service** (Phase 2) - FDA-regulated dosing calculations
- **Lifestyle Service** (Phase 2) - AI coaching and pattern detection

## Project Structure

```
betterblood/
├── apps/
│   └── mobile/              # React Native application
├── services/
│   ├── auth-service/        # Authentication microservice
│   ├── cgm-service/         # CGM data microservice
│   └── food-service/        # Food database microservice
├── packages/
│   ├── shared-types/        # Shared TypeScript types
│   ├── database/            # Database client and migrations
│   └── config/              # Environment configuration
├── infrastructure/
│   ├── terraform/           # AWS infrastructure (EKS, RDS, ElastiCache)
│   ├── kubernetes/          # K8s manifests
│   └── docker/              # Local development Docker Compose
└── .github/workflows/       # CI/CD pipelines
```

## API Documentation

### Authentication

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### CGM Data

```http
GET /api/v1/cgm/current
Authorization: Bearer {token}

GET /api/v1/cgm/history?hours=24
Authorization: Bearer {token}
```

## Database Schema

### Core Tables

- `users` - User accounts with profile and settings
- `cgm_readings` - Time-series glucose data (TimescaleDB hypertable)
- `insulin_doses` - FDA-tracked insulin calculations
- `food_items` - Nutritional food database
- `meal_logs` - User meal records
- `lifestyle_recommendations` - AI coaching suggestions
- `audit_logs` - HIPAA compliance audit trail

## Security

- End-to-end encryption (TLS 1.3)
- HIPAA-compliant infrastructure
- JWT authentication with refresh tokens
- MFA support
- Role-based access control
- Encrypted data at rest (AES-256)

## Deployment

### AWS (Production)

```bash
cd infrastructure/terraform

# Initialize
terraform init

# Plan changes
terraform plan -var-file=environments/production.tfvars

# Deploy
terraform apply -var-file=environments/production.tfvars

# Configure kubectl
aws eks update-kubeconfig --name betterblood-production

# Deploy services
kubectl apply -k infrastructure/kubernetes/
```

### Local Development

```bash
# Start all services
docker-compose up

# Individual services
cd services/auth-service && npm run dev
cd services/cgm-service && npm run dev
cd services/food-service && npm run dev
```

## Testing

```bash
# Run all tests
npm test

# Unit tests for specific service
npm test --workspace=services/auth-service

# Integration tests
npm run test:integration

# End-to-end tests
cd apps/mobile && npm run test:e2e
```

## Compliance

- **FDA 510(k)** pathway documented for insulin dosing
- **HIPAA** compliant infrastructure and data handling
- **ISO 13485** quality management system ready
- **ISO 14971** risk management documentation

## Documentation

- [System Architecture](./docs/architecture/system-architecture.md)
- [API Reference](./docs/api/openapi.yaml)
- [Deployment Guide](./infrastructure/DEPLOYMENT.md)
- [FDA Compliance](./compliance/fda/510k-requirements.md)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

Proprietary - BetterBlood Inc.

## Support

- Email: support@betterblood.io
- Documentation: https://docs.betterblood.io
- Status: https://status.betterblood.io