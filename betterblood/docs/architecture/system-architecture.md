# BetterBlood System Architecture

**Last Updated:** February 23, 2026  
**Version:** 1.0  
**Status:** Pre-FDA Design Phase

---

## Executive Summary

BetterBlood (BB) employs a **microservices architecture** designed for scalability, FDA compliance, and fault tolerance. The system separates FDA-regulated medical functions from lifestyle coaching features to enable independent scaling and regulatory management.

---

## System Architecture Overview

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Mobile[Mobile App<br/>React Native]
        Dashboard[Provider Dashboard<br/>React Web]
    end

    subgraph "Edge Layer"
        CDN[CloudFront CDN]
        WAF[WAF Shield]
    end

    subgraph "API Gateway Layer"
        APIGateway[Kong API Gateway]
        RateLimiter[Rate Limiter]
        AuthZ[Authorization
        JWT Validation]
    end

    subgraph "Core Services (Medical Grade)"
        AuthService[Auth Service<br/>OAuth 2.0<br/>HIPAA Audit]
        CGMService[CGM Ingestion Service<br/>WebSocket<br/>10K req/s]
        InsulinService[Insulin Dosing Service<br/>FDA 510(k)<br/>Class II Device]
    end

    subgraph "Lifestyle Services (Non-Medical)"
        UserService[User Profile Service]
        FoodDB[Food Database Service<br/>5M+ Items]
        AIService[AI Coaching Service
        ML Predictions]
        NotificationService[Notification Service
        Push Alerts]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL
        Transactional Data)]
        Timescale[(TimescaleDB
        CGM Time-Series)]
        Redis[(Redis Cache
        Session Store)]
        Elastic[(Elasticsearch
        Food Search)]
    end

    subgraph "Infrastructure"
        S3[S3 Buckets
        Encrypted Storage]
        KMS[KMS Key Management
        HIPAA Compliance]
        CloudWatch[CloudWatch
        Monitoring]
    end

    Mobile --> CDN
    Dashboard --> CDN
    CDN --> WAF
    WAF --> APIGateway
    
    APIGateway --> RateLimiter
    RateLimiter --> AuthZ
    
    AuthZ --> AuthService
    AuthZ --> CGMService
    AuthZ --> InsulinService
    AuthZ --> UserService
    AuthZ --> FoodDB
    AuthZ --> AIService
    AuthZ --> NotificationService
    
    CGMService --> Timescale
    CGMService --> Redis
    InsulinService --> PostgreSQL
    InsulinService --> Timescale
    UserService --> PostgreSQL
    FoodDB --> Elastic
    AIService --> PostgreSQL
    AIService --> Timescale
    AIService --> S3
    NotificationService --> Redis
    
    PostgreSQL --> S3
    Timescale --> S3
    Redis --> CloudWatch
    Elastic --> CloudWatch
```

---

## Service Definitions

### 1. Auth Service
**Purpose:** Identity and access management
**Container:** Node.js + TypeScript
**Responsibilities:**
- User authentication (OAuth 2.0)
- JWT token generation and validation
- MFA support for healthcare providers
- HIPAA audit logging
- Patient/provider relationship management

**API Endpoints:**
```typescript
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /auth/user
POST /auth/mfa/verify
```

**Database Schema:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'patient', 'provider', 'admin'
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(32)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

**Scaling:** Stateless, horizontally scalable by adding containers

---

### 2. CGM Ingestion Service
**Purpose:** Real-time continuous glucose monitoring data ingestion
**Container:** Node.js + TypeScript + Socket.io
**Responsibilities:**
- WebSocket connections from mobile apps
- Data normalization from multiple CGM vendors
- Real-time glucose value storage
- Trend calculation (delta, rate-of-change)
- Hypoglycemia/hyperglycemia detection
- Rate limiting per user (max 1 request/5 seconds per CGM telemetry

**API Endpoints:**
```typescript
// WebSocket endpoint
ws://api.betterblood.io/cgm/stream

// Authentication via JWT token in connection
// Message format:
interface CGMLiveData {
  device_id: string;
  device_type: 'dexcom' | 'libre' | 'guardian';
  glucose_value: number; // mg/dL
  timestamp: ISO8601;
  trend: 'up' | 'down' | 'stable';
  trend_rate: number; // mg/dL per minute
}
```

**Data Processing Pipeline:**
1. Receive raw CGM data via WebSocket
2. Validate data format and device authentication
3. Normalize to standard format (mg/dL, ISO timestamps)
4. Calculate trends and predictions
5. Store in TimescaleDB (time-series optimized)
6. Cache latest value in Redis (sub-second reads)
7. Publish events to message bus for alerts

**Database Schema (TimescaleDB):**
```sql
CREATE TABLE cgm_readings (
  time TIMESTAMPTZ NOT NULL,
  user_id UUID NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  glucose_value INTEGER NOT NULL, -- mg/dL
  trend_direction VARCHAR(20),
  trend_rate DOUBLE PRECISION,
  CONSTRAINT cgm_readings_pk PRIMARY KEY (user_id, time)
);

SELECT create_hypertable('cgm_readings', 'time', 'user_id');

CREATE INDEX idx_cgm_user_time ON cgm_readings (user_id, time DESC);
```

**Performance Targets:**
- Ingest 10,000 events/second
- P99 latency < 50ms for write operations
- Support 1M+ concurrent users
- Data retention: 2 years active, 10 years archive in S3

**Scaling Strategy:**
- Read replicas for TimescaleDB
- Redis cluster for caching
- Queue-based architecture for decoupling
- Partition by user_id for horizontal scalability

---

### 3. Insulin Dosing Service
**⚠️ FDA REGULATED - Class II Medical Device**

**Purpose:** Calculate patient-specific insulin doses with clinical-grade accuracy
**Container:** Node.js + TypeScript (FDA-validated build)
**Responsibilities:**
- Carb-to-insulin ratio calculations
- Insulin sensitivity factor (ISF) corrections
- Active insulin on board (IOB) tracking
- Dose verification and safety guardrails
- Comprehensive audit logging for FDA compliance

**Regulatory Constraints:**
- **NO machine learning** in dosing algorithm (FDA requirement for Class II)
- Deterministic, mathematically provable calculations
- Separate from Lifestyle/AI services
- Immutable audit logs
- Version-controlled algorithm releases

**API Endpoints:**
```typescript
POST /insulin/calculate-bolus
Request Body:
{
  "user_id": "uuid",
  "current_glucose": 180, // mg/dL
  "target_glucose": 120,  // mg/dL
  "carbohydrates": 65,    // grams
  "carb_ratio": 10,       // 1:10
  "isf": 50,              // 1 unit drops 50 mg/dL
  "iob": 2.5             // units
}

Response:
{
  "total_dose": 4.5,
  "carb_dose": 6.5,
  "correction_dose": 1.2,
  "iob_deduction": -3.2,
  "recommendation": "Take 4.5 units",
  "safety_checks_passed": true,
  "warning": "Glucose is elevated - consider pre-bolus timing",
  "calculated_at": "2026-02-23T02:45:00Z"
}
```

**Insulin Dosing Algorithm (FDA-Documented):**
```typescript
class InsulinCalculator {
  // Carb dose: carbs / carb_ratio
  calculateCarbDose(carbs: number, carbRatio: number): number {
    return carbs / carbRatio;
  }
  
  // Correction: (currentBG - targetBG) / ISF
  calculateCorrection(currentBG: number, targetBG: number, isf: number): number {
    return (currentBG - targetBG) / isf;
  }
  
  // Total: carb dose + correction - IOB
  calculateTotalDose(carbDose: number, correction: number, iob: number): number {
    const total = carbDose + correction - iob;
    return Math.max(0, total); // Never negative
  }
  
  // Safety guardrails
  validateDose(dose: number, user: User): boolean {
    const maxDose = user.max_dose_limit || 20; // Default 20 units
    if (dose > maxDose) {
      throw new SafetyException(`Dose ${dose} exceeds max limit ${maxDose}`);
    }
    
    // Hypoglycemia prevention: check for insulin stacking
    if (user.iob > 5 && dose > 2) {
      throw new SafetyException('High IOB detected - potential stacking risk');
    }
    
    return true;
  }
}
```

**Database Schema:**
```sql
CREATE TABLE insulin_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  carb_ratio DECIMAL(5,2) NOT NULL, -- grams per unit
  isf DECIMAL(5,2) NOT NULL,          -- mg/dL per unit
  target_glucose INTEGER NOT NULL,    -- mg/dL
  max_dose_limit DECIMAL(5,2),        -- safety cap
  active BOOLEAN DEFAULT true,
  configured_at TIMESTAMP NOT NULL,
  verified_by_provider UUID           -- Link to prescribing provider
);

CREATE TABLE insulin_doses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  calculated_at TIMESTAMP NOT NULL,
  carbs DECIMAL(5,1),
  carb_ratio DECIMAL(5,2),
  isf DECIMAL(5,2),
  current_bg INTEGER,
  target_bg INTEGER,
  iob DECIMAL(5,2),
  carb_dose DECIMAL(5,2),
  correction_dose DECIMAL(5,2),
  total_dose DECIMAL(5,2),
  confirmed_by_user BOOLEAN DEFAULT false,
  injected_at TIMESTAMP,
  algorithm_version VARCHAR(20) NOT NULL  -- For FDA traceability
);

CREATE INDEX idx_insulin_user_time ON insulin_doses (user_id, calculated_at DESC);
```

**Audit Logging (FDA Requirement):**
```typescript
// Every calculation logged immutably
class AuditLog {
  logDoseCalculation(params: any, result: any, userId: string) {
    // Write to immutable audit log
    // Cannot be modified or deleted
    // Retained for 10 years per FDA requirements
  }
}
```

**Testing Requirements:**
- Unit tests: 95%+ code coverage
- Integration tests: All API endpoints
- Load tests: 1000 requests/second
- Verification & Validation documentation
- Edge case testing (glucose at 40 mg/dL, 600 mg/dL)

**Scaling:**
- Stateless design enables horizontal scaling
- Database connection pooling
- Read replicas for query offloading
- Algorithm cache (pre-calculated ratios)

---

### 4. Lifestyle & AI Coaching Service
**Purpose:** Non-medical health recommendations and pattern analysis
**Container:** Node.js + TypeScript + Python (ML models)
**Responsibilities:**
- Generate AI-powered lifestyle recommendations
- Pattern recognition from CGM data
- Meal timing optimization suggestions
- Exercise recommendations
- Stress management tips
- **NOT FDA REGULATED** - clearly separated from medical features

**API Endpoints:**
```typescript
POST /lifestyle/recommendations
Request: {
  "user_id": "uuid",
  "context": "pre_meal",
  "current_glucose": 180,
  "trend": "rising",
  "time_of_day": "breakfast"
}

Response: {
  "recommendations": [
    {
      "type": "pre_bolus",
      "message": "Consider taking insulin 15 min before eating due to elevated glucose",
      "confidence": 0.85,
      "evidence": "Glucose is 60 mg/dL above target and trending up"
    },
    {
      "type": "exercise",
      "message": "10-min walk after this meal may reduce post-meal spike by 30 mg/dL",
      "confidence": 0.76,
      "historical_basis": "3 similar meals in past showed 40% reduction with post-meal activity"
    }
  ]
}

GET /lifestyle/patterns?user_id=uuid&days=30
Response: {
  "dawn_phenomenon": {
    "detected": true,
    "magnitude": 42, // mg/dL increase
    "time_window": "04:00-06:00",
    "confidence": 0.91
  },
  "stress_impact": {
    "detected": true,
    "avg_glucose_increase": 55,
    "correlated_events": 12
  }
}
```

**Machine Learning Models:**
```python
# Pattern Detection
class GlucosePatternDetector:
  def detect_dawn_phenomenon(self, user_id, days=30):
    # Analyze CGM data from 2am-8am
    # Return magnitude, frequency, confidence
    pass
  
  def detect_stress_correlation(self, user_id, heart_rate_data, cgm_data):
    # Correlate HR variability with glucose spikes
    pass
  
  def predict_post_meal_glucose(self, meal_data, current_bg, recent_trends):
    # Predictive model for glucose curves
    pass
```

**Database Schema:**
```sql
CREATE TABLE lifestyle_recommendations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  recommendation_type VARCHAR(50), -- 'exercise', 'stress', 'meal_timing'
  message TEXT NOT NULL,
  generated_at TIMESTAMP NOT NULL,
  user_feedback INTEGER, -- 1-5 rating
  confidence DECIMAL(3,2)  -- Model confidence score
);

CREATE TABLE ml_models (
  id UUID PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(20) NOT NULL,
  trained_on_date TIMESTAMP NOT NULL,
  accuracy DECIMAL(5,4),
  deployed_at TIMESTAMP
);
```

**Scaling:**
- ML models run in separate containers
- Batch processing for pattern analysis (every 6 hours)
- Stateless recommendation API
- Feature store for model features

---

### 5. Food Database Service
**Purpose:** Carbohydrate and nutritional information lookup
**Container:** Node.js + Elasticsearch
**Responsibilities:**
- 5M+ food database with carb counts
- Barcode scanning integration
- Search and autocomplete
- Custom meal composition builder
- Integration with MyFitnessPal API

**API Endpoints:**
```typescript
GET /food/search?q=pasta&limit=10
GET /food/barcode/0123456789
GET /food/nutrition/food_id
POST /food/meal/composition
```

---

### 6. Notification Service
**Purpose:** Push notifications and alerts
**Container:** Node.js + Redis
**Responsibilities:**
- Real-time push notifications
- Hypoglycemia alerts
- Restful API
- SMS alerts as backup

**API Endpoints:**
```typescript
POST /notifications/alert
POST /notifications/push
POST /notifications/test
```

---

## Data Flow Architecture

### CGM Data Ingestion Flow
```
Mobile App → WebSocket → CGM Service → Validation → TimescaleDB
                                           ↓
                                       Redis Cache
                                           ↓
                                    Alert Subscription
                                           ↓
                               Notification Service → Push Alert
```

### Insulin Dosing Flow
```
User Initiates Calculation → Mobile App → API Gateway → Auth Service (Validate JWT)
                                                               ↓
                                                        Insulin Service
                      Receive Parameters → Load User Settings → Calculate Dose
                          ↓
                    Safety Validation → Audit Log → Return Result → User
                          ↓
                   Store Dose Log → TimescaleDB
```

### AI Recommendation Flow
```
CGM Data at REST → Pattern Detection Job (Every 6h)
   ↓
ML Model Analysis → Feature Store → Lifestyle Service
   ↓
User Context Query → Personalized Recommendations → Mobile App
```

---

## Technology Stack Justification

### Why React Native?
- Cross-platform (iOS + Android)
- Native performance vs. true native
- Large developer ecosystem
- Strong TypeScript support
- Faster development for FDA timeline

### Why Node.js + TypeScript?
- Strong typing enables FDA traceability
- Excellent library ecosystem
- Microservices-friendly
- Horizontal scaling
- V8 engine performance

### Why PostgreSQL + TimescaleDB?
- ACID compliance required for medical data
- TimescaleDB: 10-100x performance for time-series CGM
- Established, audited database engine
- Mature backup/replication

### Why Redis?
- Sub-millisecond latency for key reads
- Active glucose value caching
- Session management
- Pub/sub for real-time features

### Why AWS?
- HIPAA-eligible services
- Mature compliance programs (SOC 2, ISO 27001)
- Global infrastructure
- Cost-effective at scale

---

## Security Architecture

### HIPAA Compliance
- **Encryption at Rest:** AES-256 (S3, RDS)
- **Encryption in Transit:** TLS 1.3
- **Key Management:** AWS KMS
- **Access Logging:** CloudTrail + application logs
- **Audit Trails:** Immutable, 10-year retention

### Authentication & Authorization
- OAuth 2.0 with JWT tokens
- Refresh token rotation
- 2FA for healthcare providers
- Device-level authentication for CGM integration
- Time-based token expiration (15 minutes)

### Network Security
- VPC isolation per service tier
- Security groups with least privilege
- WAF at edge (SQL injection, XSS protection)
- DDoS mitigation (AWS Shield)
- Private subnets for databases

### Compliance Monitoring
- Automated compliance scanning
- Quarterly penetration testing
- Annual security audits
- Bug bounty program (post-launch)

---

## Scalability Strategy

### Horizontal Scaling
- All services stateless
- Auto-scaling groups based on CPU/memory
- Container orchestration via ECS/EKS
- Database read replicas

### Database Partitioning
- CGM data: Partitioned by time (1 week per partition)
- User data: Logical shards by user_id
- Archival: Move >2 year old data to S3 Glacier

### Caching Strategy
- L1: Mobile app cache (5 minutes)
- L2: Redis cluster (1 minute TTL)
- L3: Database query cache
- L4: CDN for static assets

### Performance Optimization
- Connection pooling (PgBouncer)
- Query optimization with proper indexing
- Async processing for non-critical paths
- Queue-based decoupling

---

## Disaster Recovery

### RTO (Recovery Time Objective)
- Critical services: < 1 hour
- Full system: < 4 hours

### RPO (Recovery Point Objective)
- CGM/Insulin data: < 5 minutes (mission critical)
- User data: < 1 hour
- Analytics: < 24 hours

### Multi-Region Strategy
- Primary: us-east-1
- Secondary: us-west-2
- Database: Cross-region replication (read replica)
- Failover: Automated via Route 53 health checks

---

## Monitoring & Observability

### Metrics (Prometheus)
- API latency (p50, p95, p99)
- Error rates per endpoint
- CGM ingestion rate
- Database query times
- Cache hit/miss rates
- Queue depths

### Logs (ELK Stack)
- Application logs (structured JSON)
- Audit logs (immutability-focused)
- Security events
- Access logs

### Dashboards (Grafana)
- Medical device reliability dashboard
- User engagement metrics
- FDA compliance monitoring
- Cost monitoring by service

### Alerting (PagerDuty)
- Critical: CGM ingestion failure, API downtime
- High: Error rate >5%, latency >500ms
- Medium: Queue backlog, cache hit rate <70%

---

## Cost Estimates

### Monthly Infrastructure Costs (AWS)

| Component | 10K Users | 100K Users | 1M Users |
|-----------|-----------|------------|----------|
| **Compute (ECS)** | $800 | $3,500 | $18,000 |
| **Databases (RDS)** | $300 | $1,500 | $8,000 |
| **Cache (ElastiCache)** | $200 | $800 | $3,500 |
| **Search (OpenSearch)** | $150 | $600 | $2,500 |
| **Storage (S3)** | $50 | $200 | $1,000 |
| **CDN (CloudFront)** | $100 | $400 | $2,000 |
| **Monitoring** | $100 | $300 | $1,000 |
| **Data Transfer** | $150 | $600 | $3,000 |
| **TOTAL** | **$1,850** | **$7,900** | **$39,000** |

**Assumptions:**
- Average user: 100 CGM readings/day
- API requests: ~500/user/day
- Storage: 5KB/user/day
- Multi-AZ deployment for high availability

---

## Implementation Roadmap

### Phase 1: MVP Foundation (Months 1-3)
**Priority:** High  
**FDA Required:** No  
**Focus:** Non-medical features

**Services to Build:**
- Auth Service
- CGM Ingestion (basic storage only)
- Food Database Service
- Mobile app skeleton
- User profile management

**No Insulin Dosing Yet** - This remains Phase 2 for FDA reasons

---

### Phase 2: FDA Medical Device (Months 4-15)
**Priority:** Critical  
**FDA Required:** **YES - 510(k) Submission**  
**Focus:** Medical device features

**Services to Build:**
- Insulin Dosing Service
- FDA-required audit logging
- Clinical validation study infrastructure
- QMS documentation system
- Risk management database

**Timeline:**
- Algorithm development: 2 months
- Clinical study: 6 months
- 510(k) preparation: 3 months
- FDA review: 4-6 months

**Cost:** $350K-450K

---

### Phase 3: AI Coaching (Months 16-18)
**Priority:** Medium  
**FDA Required:** No  
**Focus:** Lifestyle differentiation

**Services to Build:**
- AI/ML Pattern Detection Service
- Lifestyle Recommendation Engine
- Feature store for ML
- Model training pipeline

**Constraint:** Must NOT influence insulin dosing (FDA separation)

---

### Phase 4: Scale & Optimize (Months 19-24)
**Priority:** Medium  
**Focus:** Market launch preparation

**Activities:**
- Multi-region deployment
- Load testing at 100K simulated users
- Security audit and penetration testing
- Healthcare provider integration APIs
- Insurance reimbursement integration

---

## Key Architectural Decisions

### Decision 1: Microservices Over Monolith
**Justification:**
- Pros: Independent scaling, fault isolation, team autonomy, technology flexibility
- Cons: Operational complexity, inter-service communication overhead
- **Decision:** Adopt microservices for production (separate medical from lifestyle)
- **Rationale:** Medical device service (InsulinService) must be independently deployable for FDA change control

### Decision 2: TimescaleDB for CGM Data
**Justification:**
- Pros: 10-100x faster time-series queries, PostgreSQL-compatible, mature
- Cons: Additional extension to manage
- **Decision:** Use TimescaleDB extension on PostgreSQL
- **Rationale:** CGM data is inherently time-series; performance at scale is critical

### Decision 3: Separate Containers for FDA/Non-FDA
**Justification:**
- Pros: Simplified FDA validation, independent release cycles
- Cons: Duplicate some code, complex orchestration
- **Decision:** Separate containers for InsulinService vs. AIService
- **Rationale:** FDA change control requirements; AIService can iterate faster without re-validation

### Decision 4: Kong API Gateway
**Justification:**
- Pros: Open source, plugin ecosystem, rate limiting, auth
- Cons: Additional component to manage
- **Decision:** Use Kong over AWS API Gateway (cost at scale)
- **Rationale:** ~$3/user/year savings at 1M users

---

## Open Questions & Risks

### Technical Risks
1. **CGM API Rate Limits:** Dexcom/Libre may impose usage limits
   - **Mitigation:** Caching, user-level throttling, commercial API partnerships

2. **Algorithm Accuracy:** Insulin dosing must achieve clinical validation
   - **Mitigation:** Multiple algorithm versions, A/B testing framework, extensive edge case testing

3. **Database Performance:** CGM at scale is write-heavy
   - **Mitigation:** TimescaleDB benchmarking, connection pooling, sharding strategy

### Regulatory Risks
1. **FDA Timeline:** 510(k) review can exceed 12 months
   - **Mitigation:** Early FDA pre-submission meetings, robust clinical validation data

2. **Algorithm Changes:** Any dosing change requires re-validation
   - **Mitigation:** Separate lifestyle recommendations (non-FDA) for rapid iteration

### Business Risks
1. **Competition:** Established players (Medtronic, Tandem)
   - **Mitigation:** Focus on Lifestyle AI differentiation, cross-platform CGM support

2. **Adoption:** Patients resistant to app-based therapy
   - **Mitigation:** Provider education, clinical study evidence, user-friendly design

---

## Appendix: API Specification

See `/docs/api-spec/openapi.yaml` for complete OpenAPI 3.0 specification

**Authentication:** Bearer JWT tokens required for all endpoints

**Base URL:** `https://api.betterblood.io/v1`

**Response Format:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any
  };
  timestamp: ISO8601;
}
```

**Error Codes:**
- `INSULIN_001`: Dose exceeds maximum limit
- `INSULIN_002`: High IOB detected - stacking risk
- `CGM_001`: Device not authenticated
- `AUTH_001`: Invalid or expired token
- `VALIDATION_001`: Request parameter validation failed

---

**Document Version:** 1.0  
**Next Review:** Upon Phase 2 completion  
**Owner:** System Architecture Team  
**Approved By:** [CTO, Head of Regulatory Affairs]