# Act University - Technical Documentation

## Project Overview

Act University is a secure, enterprise-grade Learning Management System (LMS) designed for corporate employee training with comprehensive DRM, session management, and audit logging capabilities.

## Architecture

### Tech Stack

**Frontend:**
- React 18.3 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons

**Backend:**
- Supabase (PostgreSQL + Authentication + Storage)
- Row Level Security (RLS) for data protection
- Real-time subscriptions for session monitoring

**Security:**
- Content Security Policy (CSP)
- Client-side anti-scraping measures
- Session-based authentication with 30-minute idle timeout
- Forensic watermarking on all content
- Rate limiting and bot detection

### Database Schema

#### Core Tables

**employees** - User accounts and authentication
- Stores employee credentials (bcrypt hashed passwords)
- Role-based access control (employee/admin)
- Account status tracking

**courses** - Top-level learning programs
- Course metadata and categorization
- Publication status control
- Display ordering

**activities** - Individual learning units
- Multiple types: PPT, Video, Quiz, Declaration, Article
- Content URL references (encrypted)
- Duration and difficulty tracking

**employee_progress** - Learning analytics
- Per-employee, per-activity tracking
- Status, completion percentage, scores
- Time spent tracking

**sessions** - Active user sessions
- JWT token management
- Idle timeout tracking (30 minutes)
- Maximum session duration (8 hours)
- Force logout capability for admins

**audit_logs** - Comprehensive audit trail
- All authentication events
- Content access logging
- Admin actions
- Security events
- Exportable for compliance

**content_access_logs** - Forensic content tracking
- Stream starts, slide views
- Watermark data for each access
- IP and session tracking

#### Security Features

**Row Level Security (RLS):**
- Employees can only access their own data
- Admins have elevated privileges via role checks
- Content requires active session validation
- Audit logs are append-only

**Indexes:**
- Optimized queries on foreign keys
- Session lookup performance
- Audit log search capabilities

## Authentication System

### Session Management

**Login Flow:**
1. Employee submits EMP_ID and password
2. Backend validates credentials (bcrypt)
3. JWT token generated with 8-hour expiration
4. Session record created with metadata
5. Client stores session in localStorage
6. Idle timer activated

**Session Validation:**
- Automatic validation on page load
- 30-minute idle timeout
- 8-hour maximum session duration
- Activity tracking on user interactions

**Logout:**
- Manual logout by user
- Automatic timeout (idle or max duration)
- Admin-forced logout
- Logout reason logged for audit

### Security Measures

**Client-Side Protection:**
- CSP headers prevent XSS attacks
- DevTools detection and monitoring
- Context menu disabled
- Print/screenshot prevention
- Text selection disabled (except inputs)
- Automation detection (webdriver, etc.)

**Rate Limiting:**
- Configurable request limits
- Time-window based throttling
- Per-user tracking

## Frontend Components

### Design System

**Color Palette:**
- Primary: #0B63D6 (Deep Blue)
- Accent: #00A3A3 (Teal)
- Background: #F7FAFC
- Card Background: #FFFFFF
- Text: #0F1724
- Text Secondary: #64748B

**Typography:**
- Font family: System fonts (optimized for performance)
- Line height: 150% for body, 120% for headings
- Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Spacing:**
- 8px base unit
- Consistent margin/padding scale

### Core Components

**Button** - Primary interaction component
- Variants: primary, secondary, ghost, danger
- Sizes: sm, md, lg
- Hover effects with scale animation
- Focus ring for accessibility

**Input** - Form input with validation
- Label support
- Error state handling
- Helper text
- Accessibility features

**Card** - Container component
- Hover effects (optional)
- Configurable padding
- Border and shadow styling

**Badge** - Status indicators
- Multiple variants with semantic colors
- Size options
- Icon support

**CourseCard** - Course display
- Thumbnail with fallback
- Progress tracking
- Category and difficulty badges
- Duration display

**ActivityCard** - Activity display
- Type-specific icons and colors
- Progress bar
- Status badges
- 3-line description limit

## Pages

### Login Page
- Clean, centered design
- Form validation
- Error handling
- Security notice
- Brand identity

### Dashboard (Employee)
- Statistics overview (4 KPI cards)
- Search functionality
- Course grid with progress
- Recent activities feed
- Responsive layout

### Activity Player
- Type-specific renderers
- Watermark display
- Progress tracking
- Security notices
- DRM integration points

### Admin Dashboard
- System statistics
- Active session monitoring
- Force logout capability
- Audit log viewer
- CSV export functionality
- Real-time updates (30s interval)

## Content Protection

### DRM Integration Points

**Video Streaming:**
- Placeholder for Shaka Player/HLS.js integration
- DRM configuration hooks (Widevine/FairPlay/PlayReady)
- Watermark overlay
- Quality adaptation
- Playback tracking

**Presentation Viewing:**
- Server-side image rendering
- Sequential slide navigation
- Watermark embedding
- Progress tracking
- No download capability

**Signed URLs:**
- Short-lived tokens (configurable TTL)
- Base64 encoding with expiration
- Validation on backend
- Automatic expiration

**Watermarking:**
- Format: `EMP_ID | ISO_TIMESTAMP | SESSION_ID`
- Visible overlay on all content
- Logged in content_access_logs
- Forensic tracking capability

## API Endpoints (Backend Implementation Required)

### Authentication
```
POST /api/auth/login
Body: { emp_id: string, password: string }
Response: { employee, sessionId, token, expiresAt, lastActivityAt }

POST /api/auth/logout
Headers: Authorization: Bearer <token>
Body: { reason: string }
Response: { success: boolean }

GET /api/auth/validate
Headers: Authorization: Bearer <token>
Response: { valid: boolean }
```

### Content Delivery
```
GET /api/content/stream?token=<signed_token>
Response: Content stream with security headers

GET /api/content/slide/:activityId/:slideNumber?token=<signed_token>
Response: Watermarked slide image
```

### Progress Tracking
```
POST /api/progress/update
Headers: Authorization: Bearer <token>
Body: { activity_id, progress_percentage, status }
Response: { success: boolean }
```

## Backend Implementation Guide

### Required Technologies

**Node.js Backend (NestJS/Express):**
- JWT authentication middleware
- Bcrypt for password hashing
- Session management
- Rate limiting (express-rate-limit)
- CORS configuration

**Media Services:**
- AWS S3 + CloudFront + MediaPackage, OR
- Azure Media Services
- DRM license server integration

### Security Implementation

**Content Delivery:**
1. Store content in encrypted form on S3
2. Generate signed CloudFront URLs with short TTL
3. Apply watermarking on server-side
4. Stream through DRM-enabled player
5. Log all access attempts

**Session Validation Middleware:**
```typescript
async function validateSession(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  // Verify JWT
  const payload = jwt.verify(token, SECRET);

  // Check session in database
  const session = await db.sessions.findOne({
    session_token: token,
    is_active: true,
  });

  // Validate expiration and idle timeout
  if (!session || isExpired(session)) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  // Update last activity
  await db.sessions.update({
    id: session.id,
    last_activity_at: new Date(),
  });

  req.session = session;
  next();
}
```

**Rate Limiting:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

## Deployment

### Environment Variables

```env
# Supabase (Already configured)
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Backend API (Required)
VITE_API_URL=https://api.actu.example.com

# DRM Configuration (Backend)
DRM_LICENSE_SERVER_URL=<license-server-url>
DRM_CERTIFICATE_URL=<certificate-url>
AWS_S3_BUCKET=<content-bucket>
AWS_CLOUDFRONT_DOMAIN=<cloudfront-domain>
AWS_CLOUDFRONT_KEY_PAIR_ID=<key-pair-id>
AWS_CLOUDFRONT_PRIVATE_KEY=<private-key>

# Session Configuration
JWT_SECRET=<strong-random-secret>
SESSION_IDLE_TIMEOUT_MS=1800000
SESSION_MAX_DURATION_MS=28800000
```

### CI/CD Pipeline

**GitHub Actions Example:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Type check
        run: npm run typecheck

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          VITE_API_URL: ${{ secrets.API_URL }}

      - name: Deploy to production
        run: npm run deploy
```

### Security Hardening Checklist

- [ ] Enable HTTPS only (HSTS headers)
- [ ] Configure CSP headers on server
- [ ] Implement rate limiting on all endpoints
- [ ] Enable DRM on video content
- [ ] Set up CloudWatch/ELK for monitoring
- [ ] Configure Sentry for error tracking
- [ ] Enable database encryption at rest
- [ ] Set up automated backups
- [ ] Implement IP whitelisting (if required)
- [ ] Enable 2FA for admin accounts (future)
- [ ] Regular security audits
- [ ] Penetration testing

### Monitoring

**Key Metrics:**
- Active sessions count
- Content access patterns
- Failed login attempts
- Session timeout rates
- API response times
- Error rates
- Database query performance

**Logging:**
- All authentication events
- Content access (with watermark data)
- Admin actions
- Security incidents
- System errors

**Alerting:**
- Multiple failed login attempts
- Unusual content access patterns
- DRM license failures
- High error rates
- Performance degradation

## Testing Strategy

### Unit Tests
- Component rendering
- Authentication logic
- Session management
- Security utilities
- Rate limiting

### Integration Tests
- Login flow
- Content access
- Progress tracking
- Admin operations
- Audit logging

### Security Tests
- XSS prevention
- CSRF protection
- Session hijacking attempts
- Rate limit enforcement
- DRM compliance

### Performance Tests
- Load testing (concurrent users)
- Content streaming performance
- Database query optimization
- CDN cache effectiveness

## Future Enhancements

1. **Mobile Apps** - Native iOS/Android apps with offline capabilities
2. **Advanced Analytics** - ML-based learning recommendations
3. **Live Sessions** - Real-time webinars and virtual classrooms
4. **Gamification** - Badges, leaderboards, achievements
5. **Multi-language** - i18n support
6. **Accessibility** - WCAG AAA compliance
7. **Advanced DRM** - Hardware-backed security
8. **Biometric Auth** - Fingerprint/Face ID for mobile
9. **API Gateway** - GraphQL for flexible queries
10. **Microservices** - Scale components independently

## Support & Maintenance

### Regular Tasks
- Weekly security updates
- Monthly performance reviews
- Quarterly audit log exports
- Annual penetration testing
- Continuous monitoring

### Troubleshooting

**Common Issues:**

1. **Session expires too quickly**
   - Check idle timeout configuration
   - Verify activity tracking is working
   - Review browser console for errors

2. **Content won't load**
   - Verify signed URL generation
   - Check CDN configuration
   - Review CORS settings

3. **DRM errors**
   - Validate license server connectivity
   - Check DRM certificates
   - Review browser DRM support

4. **Performance issues**
   - Review database indexes
   - Check CDN cache hit rates
   - Optimize queries with EXPLAIN

## Compliance

**Data Protection:**
- GDPR compliant data handling
- Right to erasure implementation
- Data export capabilities
- Audit trail for 7 years

**Security Standards:**
- ISO 27001 alignment
- SOC 2 Type II compliance path
- Regular security assessments
- Incident response procedures

---

**Version:** 1.0.0
**Last Updated:** 2025-10-13
**Contact:** Technical Team
