# Postmetric Clone - Architecture & Engineering Plan

## Overview

This document outlines the complete architecture for building a Postmetric clone - a web analytics platform that tracks visitors, revenue attribution, custom goals, and provides comprehensive marketing analytics.

## Core Features (Based on Postmetric Documentation)

### 1. Visitor Tracking

- Track page views, sessions, and unique visitors
- Capture referrer, UTM parameters, campaign data
- Device/browser/OS detection
- Geographic location tracking (country, region, city)
- Real-time visitor count
- Cross-domain and subdomain tracking

### 2. Revenue Attribution

- Integration with payment providers:
  - Stripe (Checkout API, PaymentIntent API, Payment Links)
  - LemonSqueezy (Checkout API, Payment Links)
  - Polar, Paddle, Podia, Kajabi, Ghost, etc.
- Link revenue to specific visitors/sessions
- Track new vs recurring revenue
- Handle refunds

### 3. Custom Goals

- Track custom user actions (button clicks, form submissions, etc.)
- Conversion funnels
- User journey tracking

### 4. Advanced Features

- X (Twitter) mentions tracking
- GitHub integration
- Google Search Console integration
- Scroll event tracking
- User identification
- Hashed page paths
- Exclude visits (IPs, countries, hostnames, paths)

### 5. API & Proxy

- RESTful API for data retrieval
- Proxy endpoint for privacy-focused tracking
- Visitor API endpoint
- Goal tracking endpoint
- Payment tracking endpoint

---

## Database Schema

### 1. User Model

```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  name: string,
  avatarUrl?: string,
  createdAt: Date,
  updatedAt: Date,
  subscription?: {
    plan: 'free' | 'starter' | 'pro' | 'enterprise',
    status: 'trial' | 'active' | 'cancelled',
    trialEndsAt: Date,
    currentPeriodEnd: Date
  }
}
```

### 2. Website Model

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  domain: string (indexed),
  name: string,
  iconUrl?: string,
  trackingCode: string (unique, indexed), // Unique tracking ID
  settings: {
    excludeIps: string[],
    excludeCountries: string[],
    excludeHostnames: string[],
    excludePaths: string[],
    hashPaths: boolean,
    trackScroll: boolean,
    trackUserIdentification: boolean
  },
  paymentProviders: {
    stripe?: { webhookSecret: string },
    lemonSqueezy?: { webhookSecret: string },
    // ... other providers
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Session Model

```typescript
{
  _id: ObjectId,
  websiteId: ObjectId (ref: Website, indexed),
  sessionId: string (indexed), // Unique session identifier
  visitorId: string (indexed), // Persistent visitor identifier
  userId?: string, // If user identification is enabled

  // First visit data
  firstVisitAt: Date (indexed),
  referrer?: string,
  referrerDomain?: string,
  utmSource?: string,
  utmMedium?: string,
  utmCampaign?: string,
  utmTerm?: string,
  utmContent?: string,

  // Device & Location
  device: 'desktop' | 'mobile' | 'tablet',
  browser: string,
  browserVersion?: string,
  os: string,
  osVersion?: string,
  country: string,
  region?: string,
  city?: string,

  // Tracking
  pageViews: number,
  duration: number, // seconds
  bounce: boolean,
  lastSeenAt: Date (indexed),

  createdAt: Date (indexed),
  updatedAt: Date
}
```

### 4. PageView Model

```typescript
{
  _id: ObjectId,
  websiteId: ObjectId (ref: Website, indexed),
  sessionId: string (indexed),
  visitorId: string (indexed),

  path: string (indexed),
  hostname: string,
  title?: string,
  referrer?: string,
  referrerPath?: string,

  // UTM parameters
  utmSource?: string,
  utmMedium?: string,
  utmCampaign?: string,
  utmTerm?: string,
  utmContent?: string,

  // Device info
  device: 'desktop' | 'mobile' | 'tablet',
  browser: string,
  os: string,
  country: string,
  region?: string,
  city?: string,

  timestamp: Date (indexed),
  createdAt: Date
}
```

### 5. Goal Model

```typescript
{
  _id: ObjectId,
  websiteId: ObjectId (ref: Website, indexed),
  name: string,
  event: string, // Event identifier (e.g., 'button_click', 'form_submit')
  description?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 6. GoalEvent Model

```typescript
{
  _id: ObjectId,
  websiteId: ObjectId (ref: Website, indexed),
  goalId: ObjectId (ref: Goal, indexed),
  sessionId: string (indexed),
  visitorId: string (indexed),
  path: string,
  value?: number, // Optional monetary value
  timestamp: Date (indexed),
  createdAt: Date
}
```

### 7. Payment Model

```typescript
{
  _id: ObjectId,
  websiteId: ObjectId (ref: Website, indexed),
  sessionId?: string (indexed),
  visitorId?: string (indexed),

  // Payment details
  provider: 'stripe' | 'lemonsqueezy' | 'polar' | 'paddle' | 'other',
  providerPaymentId: string (indexed), // Payment ID from provider
  amount: number, // In cents
  currency: string,
  status: 'completed' | 'refunded' | 'failed',

  // Customer info
  customerEmail?: string,
  customerId?: string,

  // Metadata
  metadata?: Record<string, any>,

  timestamp: Date (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

### 8. Funnel Model

```typescript
{
  _id: ObjectId,
  websiteId: ObjectId (ref: Website, indexed),
  name: string,
  steps: Array<{
    name: string,
    path?: string, // URL pattern
    goalId?: ObjectId, // Or goal event
    order: number
  }>,
  createdAt: Date,
  updatedAt: Date
}
```

### 9. FunnelEvent Model

```typescript
{
  _id: ObjectId,
  websiteId: ObjectId (ref: Website, indexed),
  funnelId: ObjectId (ref: Funnel, indexed),
  sessionId: string (indexed),
  visitorId: string (indexed),
  step: number,
  completed: boolean,
  timestamp: Date (indexed),
  createdAt: Date
}
```

---

## API Routes Structure

### Tracking Endpoint (Proxy)

```
POST /api/track
GET /api/track (for image pixel tracking)

Purpose: Collect analytics data from client websites
Privacy: Can be proxied through user's domain
```

### Data Retrieval APIs

```
GET /api/websites - List user's websites
POST /api/websites - Create new website
GET /api/websites/[id] - Get website details
PUT /api/websites/[id] - Update website
DELETE /api/websites/[id] - Delete website

GET /api/websites/[id]/analytics - Get analytics data
GET /api/websites/[id]/visitors - Get visitor data
GET /api/websites/[id]/revenue - Get revenue data
GET /api/websites/[id]/goals - Get goals data
GET /api/websites/[id]/funnels - Get funnel data

POST /api/goals - Create custom goal
POST /api/payments - Record payment (webhook)
GET /api/visitor/[visitorId] - Get visitor data (API)
```

---

## Frontend Architecture

### Pages Structure

```
/app
  /dashboard
    page.tsx - Website list
    /new
      page.tsx - Add new website
    /[websiteId]
      page.tsx - Analytics dashboard
      /settings
        page.tsx - Website settings
      /goals
        page.tsx - Custom goals management
      /funnels
        page.tsx - Funnel configuration
      /revenue
        page.tsx - Revenue settings & webhooks
  /login
    page.tsx - Authentication
  /signup
    page.tsx - Registration
  /api
    /track - Tracking endpoint
    /websites - Website CRUD
    /analytics - Analytics data
    /goals - Goals management
    /payments - Payment webhooks
    /visitor - Visitor API
```

### Components Structure

```
/components
  /analytics
    - Chart.tsx (already exists)
    - MetricsCard.tsx
    - SourceChart.tsx
    - LocationChart.tsx
    - SystemChart.tsx
    - GoalChart.tsx
    - FunnelChart.tsx
  /tracking
    - TrackingScript.tsx - Script to embed on websites
  /settings
    - WebsiteSettings.tsx
    - PaymentProviderSettings.tsx
    - ExclusionSettings.tsx
  /ui - (already exists)
```

---

## Implementation Phases

### Phase 1: Core Tracking Infrastructure

1. **Database Models**

   - Create all MongoDB models
   - Set up indexes for performance
   - Create database query utilities

2. **Tracking Endpoint**

   - Build `/api/track` endpoint
   - Handle GET (pixel) and POST requests
   - Generate unique visitor/session IDs
   - Store cookies for visitor persistence
   - Parse UTM parameters
   - Detect device, browser, OS
   - Get geolocation data (using service like MaxMind or IP API)

3. **Tracking Script**
   - Generate embeddable JavaScript snippet
   - Auto-track page views
   - Support custom goals
   - Handle SPA navigation (Next.js, React Router, etc.)

### Phase 2: Analytics Dashboard

1. **Data Aggregation**

   - Build aggregation queries for:
     - Visitors over time
     - Revenue over time
     - Source/channel breakdown
     - Page views
     - Location data
     - Device/browser data

2. **Dashboard UI**

   - Main analytics chart (visitors + revenue)
   - Metrics cards (visitors, revenue, conversion rate, etc.)
   - Source charts (channel, referrer, campaign, keyword)
   - Path charts (hostname, page, entry, exit)
   - Location charts (map, country, region, city)
   - System charts (browser, OS, device)

3. **Real-time Updates**
   - WebSocket or Server-Sent Events for live visitor count
   - Polling for data updates

### Phase 3: Revenue Attribution

1. **Payment Provider Webhooks**

   - Stripe webhook handler
   - LemonSqueezy webhook handler
   - Other providers as needed

2. **Revenue Linking**

   - Match payments to visitors using:
     - Session/visitor IDs in payment metadata
     - Customer email matching
     - Timestamp correlation

3. **Revenue Dashboard**
   - Revenue charts
   - Revenue per visitor
   - Revenue by source/channel
   - Refund tracking

### Phase 4: Custom Goals & Funnels

1. **Goal Tracking**

   - API endpoint for goal events
   - JavaScript SDK method for tracking goals
   - Goal management UI

2. **Funnel Tracking**
   - Funnel configuration UI
   - Step completion tracking
   - Funnel visualization

### Phase 5: Advanced Features

1. **X Mentions Integration**

   - Twitter/X API integration
   - Track mentions and link to traffic spikes
   - Display mentions on chart

2. **GitHub Integration**

   - GitHub API integration
   - Link commits to traffic/revenue

3. **Google Search Console**

   - GSC API integration
   - Import search data

4. **User Identification**
   - Allow websites to identify users
   - Link multiple sessions to same user

### Phase 6: Proxy & Privacy

1. **Proxy Setup**

   - Next.js API route proxy
   - Instructions for various platforms
   - Domain verification

2. **Privacy Features**
   - IP exclusion
   - Country exclusion
   - Path exclusion
   - Hostname exclusion

---

## Technical Stack

### Backend

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB with Mongoose
- **API**: Next.js API Routes
- **Authentication**: NextAuth.js or Clerk (recommended)
- **Real-time**: Server-Sent Events or WebSockets

### Frontend

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts (already in use)
- **UI Components**: shadcn/ui (already set up)

### External Services

- **Geolocation**: MaxMind GeoIP2 or IPStack
- **Payment Providers**: Stripe, LemonSqueezy APIs
- **Social APIs**: Twitter/X API, GitHub API
- **Search Console**: Google Search Console API

---

## Key Implementation Details

### 1. Visitor Tracking Script

```javascript
// Generated script for each website
(function () {
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://yourdomain.com/api/track.js?site=TRACKING_CODE";
  document.head.appendChild(script);
})();
```

### 2. Tracking Endpoint Logic

- Accept tracking requests
- Generate/retrieve visitor ID (from cookie or generate)
- Generate/retrieve session ID
- Parse request headers for device/browser info
- Get IP address for geolocation
- Store page view
- Update session
- Return 1x1 pixel or 204 No Content

### 3. Revenue Attribution Flow

1. Payment provider sends webhook
2. Extract visitor/session ID from payment metadata
3. If not found, try email matching
4. Create Payment record linked to visitor/session
5. Update analytics aggregations

### 4. Data Aggregation Strategy

- Use MongoDB aggregation pipelines
- Cache aggregated data for performance
- Update aggregations:
  - Real-time for current day
  - Batch for historical data
- Consider time-series database for scale (InfluxDB, TimescaleDB)

### 5. Privacy & GDPR Compliance

- Hash IP addresses before storage
- Allow data deletion requests
- Cookie consent handling
- Data retention policies

---

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://...

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# External APIs
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
LEMONSQUEEZY_API_KEY=...
TWITTER_API_KEY=...
GITHUB_TOKEN=...

# Geolocation
MAXMIND_LICENSE_KEY=...
# or
IPSTACK_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Performance Considerations

1. **Database Indexing**

   - Index on websiteId + timestamp for queries
   - Index on sessionId, visitorId
   - Compound indexes for common query patterns

2. **Caching**

   - Cache aggregated analytics data
   - Use Redis for session data
   - Cache geolocation lookups

3. **Rate Limiting**

   - Limit tracking requests per IP
   - Prevent abuse

4. **Data Retention**

   - Archive old data
   - Aggregate historical data

5. **Scalability**
   - Consider message queue for tracking events (RabbitMQ, AWS SQS)
   - Batch process events
   - Use CDN for tracking script delivery

---

## Security Considerations

1. **API Authentication**

   - Protect admin APIs with authentication
   - Use API keys for tracking endpoints (optional, for rate limiting)

2. **Webhook Security**

   - Verify webhook signatures
   - Validate payment provider webhooks

3. **Data Privacy**

   - Hash sensitive data
   - Encrypt payment information
   - Implement data deletion

4. **CORS**
   - Configure CORS for tracking endpoint
   - Allow tracking from any domain (or whitelist)

---

## Next Steps

1. Set up authentication system
2. Create database models
3. Build tracking endpoint
4. Create tracking script generator
5. Build analytics aggregation queries
6. Implement dashboard UI with real data
7. Add payment provider integrations
8. Implement custom goals
9. Add advanced features

---

## References

- [Postmetric Documentation](https://postmetric.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Aggregation](https://www.mongodb.com/docs/manual/aggregation/)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [LemonSqueezy Webhooks](https://docs.lemonsqueezy.com/help/webhooks)
