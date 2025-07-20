# Insyd Notification System - System Design Document

## Executive Summary

This document outlines the design of a scalable notification system for Insyd, a social platform for the Architecture Industry. The system is designed to handle 100 current DAUs while being architected for future scaling to 1M DAUs. The notification system will handle real-time notifications for user interactions including follows, content engagement, job postings, and chat messages.

## 1. System Requirements

### 1.1 Functional Requirements
- **User Activity Notifications**: Notify users when someone follows them, likes/comments on their content, or mentions them
- **Content Discovery Notifications**: Alert users about new content from people they follow
- **Job Notifications**: Notify relevant users about new job postings matching their profile/interests
- **Chat Notifications**: Real-time messaging notifications
- **Notification Preferences**: Allow users to configure notification types and delivery methods
- **Delivery Channels**: Support for push notifications, email, and in-app notifications

### 1.2 Non-Functional Requirements
- **Current Scale**: Support 100 DAUs with room for growth
- **Target Scale**: Designed to handle 1M DAUs in steady state
- **Latency**: Real-time notifications delivered within 100ms for critical events
- **Availability**: 99.9% uptime
- **Consistency**: Eventual consistency acceptable for most notification types
- **Security**: Secure notification delivery with user privacy protection

### 1.3 Scale Estimations
**Current Scale (100 DAUs):**
- ~500 notifications/day (5 per user on average)
- ~0.006 notifications/second
- Peak: ~0.05 notifications/second

**Target Scale (1M DAUs):**
- ~10M notifications/day (10 per user on average)
- ~115 notifications/second
- Peak: ~1,150 notifications/second (10x average)

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   API Gateway    │    │  Load Balancer  │
│  (Web/Mobile)   │◄──►│  (Rate Limiting) │◄──►│                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Notification Service Layer                   │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Event Ingestion│ Notification    │  Delivery Engine            │
│     Service     │ Processing      │                             │
│                 │   Service       │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Message     │    │  Notification   │    │   User          │
│ Queue       │    │  Database       │    │ Preferences DB  │
│ (Redis)     │    │ (PostgreSQL)    │    │ (PostgreSQL)    │
└─────────────┘    └─────────────────┘    └─────────────────┘
                                │
                    ┌───────────────────────┐
                    │    Delivery Channels  │
                    ├───────┬───────┬───────┤
                    │  Push │ Email │ WebSocket│
                    │ (FCM) │(SMTP) │ (Real-time)│
                    └───────┴───────┴───────┘
```

### 2.2 Core Components

#### 2.2.1 Event Ingestion Service
**Purpose**: Captures user events from various sources and transforms them into notification events.

**Responsibilities**:
- Receive events from user actions (follows, likes, comments, posts)
- Event validation and deduplication
- Transform events into standardized notification format
- Route events to appropriate processing queues

**Implementation**: Lightweight REST API service built with Node.js/Express

#### 2.2.2 Notification Processing Service
**Purpose**: Core business logic for determining what notifications to send to whom.

**Responsibilities**:
- Process events from ingestion queue
- Apply user notification preferences
- Generate personalized notifications
- Handle notification aggregation (e.g., "5 people liked your post")
- Schedule notifications for optimal delivery times

**Implementation**: Node.js service with worker processes

#### 2.2.3 Delivery Engine
**Purpose**: Handles the actual delivery of notifications through various channels.

**Responsibilities**:
- Route notifications to appropriate delivery channels
- Handle delivery failures and retries
- Track delivery status and user engagement
- Manage rate limiting per channel

**Implementation**: Multi-threaded service with channel-specific adapters

## 3. Data Models

### 3.1 Core Entities

```sql
-- Users table (existing in main application)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    push_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification Types
CREATE TABLE notification_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- 'follow', 'like', 'comment', 'job_match', 'chat'
    description TEXT,
    default_enabled BOOLEAN DEFAULT true
);

-- User Notification Preferences
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    notification_type_id INTEGER REFERENCES notification_types(id),
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, notification_type_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID REFERENCES users(id),
    type_id INTEGER REFERENCES notification_types(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional context data
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_recipient_created (recipient_id, created_at DESC),
    INDEX idx_recipient_unread (recipient_id, read_at) WHERE read_at IS NULL
);

-- Notification Delivery Log
CREATE TABLE notification_deliveries (
    id UUID PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id),
    channel VARCHAR(20) NOT NULL, -- 'push', 'email', 'websocket'
    status VARCHAR(20) NOT NULL, -- 'pending', 'sent', 'delivered', 'failed'
    external_id VARCHAR(255), -- ID from external service (FCM, email provider)
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Events (temporary storage for processing)
CREATE TABLE events (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES users(id),
    target_id UUID, -- Could be post_id, user_id, etc.
    data JSONB,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_unprocessed (processed, created_at) WHERE NOT processed
);
```

### 3.2 Data Flow

1. **Event Creation**: User performs action → Event inserted into events table
2. **Event Processing**: Background worker processes events → Creates notifications
3. **Delivery**: Delivery engine sends notifications through appropriate channels
4. **Tracking**: Delivery status tracked in notification_deliveries table

## 4. Detailed Component Design

### 4.1 Event Ingestion Service

```javascript
// Simplified API endpoint structure
POST /api/v1/events
{
  "type": "follow",
  "actor_id": "user-123",
  "target_id": "user-456",
  "metadata": {
    "timestamp": "2025-07-19T10:30:00Z"
  }
}
```

**Processing Logic**:
1. Validate event structure and authentication
2. Deduplicate recent similar events (within 5 minutes)
3. Insert into events table
4. Publish to Redis queue for processing
5. Return 202 Accepted

### 4.2 Notification Processing Service

**Worker Process Flow**:
1. Poll Redis queue for new events
2. For each event:
   - Determine recipient(s) based on event type
   - Check user notification preferences
   - Generate notification content
   - Apply business rules (aggregation, frequency limits)
   - Insert notification into database
   - Queue for delivery

**Aggregation Logic**:
- Group similar notifications within time windows
- Example: "John and 4 others liked your post" instead of 5 separate notifications

### 4.3 Delivery Engine

**Channel-Specific Adapters**:

```javascript
// Push Notification Adapter (FCM)
class PushNotificationAdapter {
  async send(notification, userToken) {
    const message = {
      token: userToken,
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: notification.data
    };
    
    return await admin.messaging().send(message);
  }
}

// Email Adapter
class EmailAdapter {
  async send(notification, userEmail) {
    // Implementation using SendGrid/SES
  }
}

// WebSocket Adapter
class WebSocketAdapter {
  async send(notification, userId) {
    // Real-time delivery to connected clients
  }
}
```

## 5. Scalability Considerations

### 5.1 Current Scale (100 DAUs)
**Simple Architecture**:
- Single application server
- PostgreSQL database
- Redis for queuing
- Total infrastructure cost: ~$100/month

**Deployment**:
```
Single Server (4 cores, 8GB RAM):
├── Node.js Application (PM2 cluster)
├── PostgreSQL (local instance)
├── Redis (local instance)
└── Nginx (reverse proxy)
```

### 5.2 Scaling to 1M DAUs

**Horizontal Scaling Strategy**:

1. **Database Scaling**:
   - Read replicas for notification queries
   - Sharding by user_id for notifications table
   - Separate notification database from main application DB

2. **Application Scaling**:
   - Multiple instances behind load balancer
   - Separate services for different components
   - Microservices architecture

3. **Queue Scaling**:
   - Redis Cluster for high availability
   - Separate queues for different event types
   - Dead letter queues for failed processing

4. **Caching Layer**:
   - User preference caching (Redis)
   - Notification template caching
   - CDN for static assets

**Future Architecture (1M DAUs)**:
```
Load Balancer
├── API Gateway Cluster
├── Event Ingestion Service Cluster
├── Notification Processing Service Cluster
├── Delivery Engine Cluster
├── WebSocket Service Cluster
│
Database Layer:
├── PostgreSQL Primary (writes)
├── PostgreSQL Read Replicas
├── Redis Cluster (caching + queuing)
│
External Services:
├── FCM (Push notifications)
├── SendGrid (Email)
├── CloudWatch (Monitoring)
```

### 5.3 Performance Optimizations

1. **Database Optimizations**:
   - Proper indexing strategy
   - Partition notifications table by date
   - Archive old notifications

2. **Caching Strategy**:
   - Cache user notification preferences (TTL: 1 hour)
   - Cache notification templates
   - Cache user device tokens

3. **Batch Processing**:
   - Batch database inserts
   - Batch delivery for email notifications
   - Group similar notifications

## 6. Monitoring and Observability

### 6.1 Key Metrics

**Business Metrics**:
- Notification delivery rate
- User engagement with notifications
- Notification click-through rates
- Opt-out rates by notification type

**Technical Metrics**:
- Event processing latency
- Queue depth and processing rate
- Database query performance
- External service API response times

**Alerting Thresholds**:
- Queue depth > 1000 messages
- Processing latency > 5 seconds
- Delivery failure rate > 5%
- Database connections > 80% of pool

### 6.2 Monitoring Stack

For startup scale:
- **Metrics**: Prometheus + Grafana
- **Logging**: Winston + Elasticsearch/CloudWatch
- **APM**: New Relic or DataDog (free tier)
- **Uptime**: StatusPage or PingDom

## 7. Security and Privacy

### 7.1 Security Measures
- API authentication using JWT tokens
- Rate limiting to prevent spam/abuse
- Input validation and sanitization
- Encrypted data transmission (HTTPS/WSS)
- Secure storage of user tokens

### 7.2 Privacy Compliance
- User consent for notification types
- Easy opt-out mechanisms
- Data retention policies (delete old notifications)
- No sensitive data in notification content
- GDPR compliance for user data deletion

## 8. Implementation Roadmap

### Phase 1: MVP (Weeks 1-2)
- Basic event ingestion API
- Simple notification processing
- Push notifications only
- Basic user preferences
- Single server deployment

### Phase 2: Core Features (Weeks 3-4)
- Email notifications
- In-app notification list
- Notification aggregation
- WebSocket real-time delivery
- Admin dashboard

### Phase 3: Scale Preparation (Weeks 5-6)
- Database optimizations
- Caching layer
- Monitoring and alerting
- Load testing
- Documentation

### Phase 4: Production Hardening (Weeks 7-8)
- Security audit
- Performance optimization
- Disaster recovery plan
- User feedback integration

## 9. Technology Stack

### 9.1 Backend Services
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **Cache/Queue**: Redis 6+
- **Process Manager**: PM2

### 9.2 External Services
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Email**: SendGrid or AWS SES
- **Monitoring**: DataDog or New Relic
- **Infrastructure**: DigitalOcean or AWS

### 9.3 Development Tools
- **Language**: TypeScript
- **Testing**: Jest
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions
- **Documentation**: Swagger/OpenAPI

## 10. Cost Analysis

### 10.1 Current Scale (100 DAUs)
- **Server**: DigitalOcean Droplet 4GB - $24/month
- **Database**: Managed PostgreSQL - $15/month
- **Redis**: Managed Redis - $15/month
- **FCM**: Free (under quota)
- **SendGrid**: Free tier (100 emails/day)
- **Monitoring**: New Relic free tier
- **Total**: ~$54/month

### 10.2 Target Scale (1M DAUs)
- **Application Servers**: $200/month (3x instances)
- **Database**: $150/month (primary + replica)
- **Redis Cluster**: $80/month
- **FCM**: $100/month (estimated)
- **SendGrid**: $80/month (40k emails)
- **Monitoring**: $150/month
- **Load Balancer**: $20/month
- **Total**: ~$780/month

## 11. Risk Assessment and Mitigation

### 11.1 Technical Risks

**Risk**: Database becomes bottleneck
- **Mitigation**: Read replicas, proper indexing, caching

**Risk**: Third-party service outages (FCM, SendGrid)
- **Mitigation**: Multiple providers, graceful degradation

**Risk**: Message queue overflow
- **Mitigation**: Auto-scaling, dead letter queues

### 11.2 Business Risks

**Risk**: Notification spam leading to user churn
- **Mitigation**: Smart aggregation, user preferences, frequency limits

**Risk**: Privacy compliance issues
- **Mitigation**: Privacy by design, regular audits

## 12. Conclusion

This notification system design provides a solid foundation for Insyd's current needs while being architected for future scale. The modular approach allows for incremental development and deployment, making it suitable for a bootstrapped startup environment.

Key strengths of this design:
- Cost-effective for current scale
- Clear scaling path to 1M DAUs
- Modern, maintainable technology stack
- Comprehensive monitoring and security
- Flexible notification preferences

The system can be implemented incrementally, allowing for rapid iteration and user feedback incorporation while maintaining high reliability and performance standards.