# BetterBlood (BB)

**FDA-aligned diabetes management with intelligent insulin dosing and AI lifestyle coaching**

Enterprise-grade, scalable diabetes management application built with clean architecture, timeless design, and clinical-grade reliability.

---

## Core Features

### 🩸 Real-Time CGM Integration
- Multi-device support (Dexcom, FreeStyle Libre, Guardian Connect)
- Live glucose readings every 1-5 minutes
- Trend analysis and predictive alerts

### 🍽️ Intelligent Carb Management
- 5M+ food database with barcode scanning
- AI-powered meal photo analysis
- Custom carb absorption rates

### 💉 FDΛ-Cleared Insulin Calculator
- Clinical-grade dosing algorithms
- Personalized insulin-to-carb ratios
- Insulin on Board (IOB) tracking
- Safety guardrails and dose verification

### 🎯 AI Health Coach
Beyond insulin: evidence-based lifestyle recommendations
- Pre-meal optimization
- Exercise timing
- Stress management
- Sleep pattern analysis

---

## Project Structure

```
betterblood/
├── backend/                      # Backend services
│   ├── api-gateway/              # API Gateway (Kong/Nginx)
│   ├── auth-service/             # Authentication microservice
│   ├── cgm-service/              # CGM data ingestion service
│   ├── insulin-service/          # FDA-regulated dosing calculator
│   ├── lifestyle-service/          # AI coaching recommendations
│   └── notification-service/       # Push alerts & notifications
├── database/                     # Database definitions
│   ├── migrations/               # Schema migrations
│   └── seed-data/                # Test data
├── frontend/                     # Mobile applications
│   ├── mobile/                   # React Native mobile app
│   └── web-dashboard/            # Healthcare provider dashboard
├── infrastructure/               # DevOps & infrastructure
│   ├── terraform/                # Infrastructure as Code
│   ├── kubernetes/               # K8s manifests
│   └── monitoring/               # Prometheus, Grafana, etc.
├── compliance/                   # FDA & regulatory
│   ├── 510k/                     # FDA submission documents
│   ├── risk-analysis/            # ISO 14971 risk management
│   └── clinical-validation/      # Clinical study protocols
└── docs/                       # Documentation
    ├── architecture/             # System architecture diagrams
    ├── api-spec/               # OpenAPI specifications
    └── user-guides/              # End-user documentation
```

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React Native | Cross-platform, native performance, large ecosystem |
| **Backend** | Node.js + TypeScript | Strong typing, FDA-traceable, enterprise-grade |
| **Database** | PostgreSQL + TimescaleDB | ACID compliance, time-series optimization for CGM |
| **Cache** | Redis | High-speed glucose data caching |
| **Search** | Elasticsearch | Food database and pattern search |
| **Queue** | Redis Bull | Background job processing |
| **API Gateway** | Kong | Rate limiting, auth, API versioning |
| **Messaging** | WebSockets (Socket.io) | Real-time CGM data streaming |
| **Infrastructure** | AWS / Terraform | Scalable, HIPAA-compliant cloud |
| **Monitoring** | Prometheus + Grafana | Medical device-grade observability |
| **Logging** | ELK Stack (Elasticsearch) | Audit trail for FDA compliance |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Terraform 1.0+
- AWS CLI (configured)

### Local Development

```bash
# Clone repository
git clone https://github.com/iangcastill0/diabetes-app-research-pitch-cd betterblood && cd betterblood

# Install dependencies
cd frontend/mobile && npm install
cd ../../backend && npm install

# Start local infrastructure
docker-compose -f infrastructure/docker-compose.dev.yml up -d

# Run database migrations
cd backend && npm run db:migrate

# Start backend services
npm run dev:services

# Run frontend
cd frontend/mobile && npm run ios  # or npm run android
```

---

## FDA Compliance & Safety

**Current Regulatory Pathway:** 510(k) Premarket Notification (Class II)

**Quality Management System:** ISO 13485 compliant

**Risk Management:** ISO 14971 systematic risk analysis

**Software Development Lifecycle:** IEC 62304 compliant

**Clinical Validation:** Ongoing prospective studies

**Post-Market Surveillance:** Real-world evidence collection

---

## Scalability Architecture

**Horizontal Scaling:** Microservices architecture with independent scaling

**Data Partitioning:** User-based sharding for CGM time-series data

**Caching Strategy:** Multi-level cache (CDN → Redis → Database)

**Load Balancing:** Application and database levels

**Auto-scaling:** Based on CPU, memory, and queue depth metrics

**Performance Targets:**
- 95th percentile API latency < 200ms
- CGM data ingestion: 10,000 events/second
- Support for 1M+ concurrent users
- 99.9% uptime SLA

---

## Cost Structure (Estimated)

| Users | Infrastructure/Month | Notes |
|-------|---------------------|-------|
| 1,000 | $500 | Development tier |
| 10,000 | $2,500 | Growth tier |
| 100,000 | $15,000 | Scale tier |
| 1,000,000 | $80,000 | Enterprise tier |

---

## Team & Development

**Current Phase:** Pre-FDA (MVP Development)

**Core Team:**
- 2 Backend Engineers (FDA experience)
- 1 Frontend Engineer
- 1 DevOps Engineer
- 1 QA/Regulatory Specialist
- 1 Endocrinologist Advisor
- 1 Product Manager

**Timeline:**
- MVP (Non-dosing features): 3 months
- FDA 510(k) Submission: 12-18 months
- Full Launch: 18-24 months

---

## Documentation

- [System Architecture](./docs/architecture/system-architecture.md)
- [API Documentation](./docs/api-spec/openapi.yaml)
- [FDA Submission Tracker](./compliance/510k/submission-tracker.md)
- [Deployment Guide](./infrastructure/DEPLOYMENT.md)

---

## License & Disclaimer

**License:** Proprietary (commercial medical device)

**FDA Disclaimer:** This application is subject to FDA 510(k) clearance. Not yet approved for clinical use.

**Medical Disclaimer:** Information provided is for educational purposes only and does not replace professional medical advice. Always consult healthcare providers before making treatment decisions.

---

*BetterBlood - Engineering Excellence in Diabetes Management*