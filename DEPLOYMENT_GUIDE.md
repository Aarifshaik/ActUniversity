# Act University - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (already configured)
- Backend API server (Node.js/NestJS/Express)
- AWS account (for S3/CloudFront) OR Azure account (for Media Services)
- Domain name with SSL certificate

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The `.env` file is already configured with Supabase credentials. Add additional variables as needed:

```env
VITE_SUPABASE_URL=<already-configured>
VITE_SUPABASE_ANON_KEY=<already-configured>
VITE_API_URL=https://api.actu.yourdomain.com
```

### 3. Database Setup

The database schema is already deployed to Supabase. To verify:

```bash
# Check Supabase dashboard for these tables:
- employees
- courses
- activities
- employee_progress
- sessions
- audit_logs
- content_access_logs
- quiz_questions
- quiz_attempts
- declarations
- employee_declarations
```

### 4. Create Admin User

Connect to your Supabase database and run:

```sql
INSERT INTO employees (
  emp_id,
  email,
  password_hash,
  full_name,
  role,
  is_active
) VALUES (
  'ADMIN001',
  'admin@actu.com',
  '$2a$10$your_bcrypt_hash_here',  -- Use bcrypt to hash a secure password
  'System Administrator',
  'admin',
  true
);
```

To generate a bcrypt hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('YourSecurePassword', 10))"
```

### 5. Development Server

```bash
npm run dev
```

Access at: http://localhost:5173

### 6. Build for Production

```bash
npm run build
```

Output in `dist/` folder.

## Backend API Setup

### Required Endpoints

Create a Node.js backend with these endpoints:

#### 1. Authentication Endpoints

**`POST /api/auth/login`**

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './supabase';

app.post('/api/auth/login', async (req, res) => {
  const { emp_id, password } = req.body;

  // Find employee
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('emp_id', emp_id)
    .eq('is_active', true)
    .single();

  if (!employee) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Verify password
  const valid = await bcrypt.compare(password, employee.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Create session
  const token = jwt.sign(
    { employee_id: employee.id },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  const { data: session } = await supabase
    .from('sessions')
    .insert({
      employee_id: employee.id,
      session_token: token,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select()
    .single();

  // Update last login
  await supabase
    .from('employees')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', employee.id);

  // Log audit event
  await supabase.from('audit_logs').insert({
    employee_id: employee.id,
    session_id: session.id,
    event_type: 'login',
    event_category: 'authentication',
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    severity: 'info',
  });

  res.json({
    employee: {
      id: employee.id,
      emp_id: employee.emp_id,
      email: employee.email,
      full_name: employee.full_name,
      department: employee.department,
      role: employee.role,
      is_active: employee.is_active,
      last_login_at: employee.last_login_at,
      created_at: employee.created_at,
      updated_at: employee.updated_at,
    },
    sessionId: session.id,
    token,
    expiresAt: expiresAt.toISOString(),
    lastActivityAt: new Date().toISOString(),
  });
});
```

**`POST /api/auth/logout`**

```typescript
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  const { reason } = req.body;
  const sessionToken = req.headers.authorization.replace('Bearer ', '');

  await supabase
    .from('sessions')
    .update({
      is_active: false,
      logout_reason: reason,
    })
    .eq('session_token', sessionToken);

  res.json({ success: true });
});
```

**`GET /api/auth/validate`**

```typescript
app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  const sessionToken = req.headers.authorization.replace('Bearer ', '');

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .eq('is_active', true)
    .single();

  if (!session) {
    return res.status(401).json({ valid: false });
  }

  const now = new Date();
  const expiresAt = new Date(session.expires_at);
  const lastActivity = new Date(session.last_activity_at);
  const idleTimeout = 30 * 60 * 1000; // 30 minutes

  if (now > expiresAt || now.getTime() - lastActivity.getTime() > idleTimeout) {
    await supabase
      .from('sessions')
      .update({ is_active: false, logout_reason: 'timeout' })
      .eq('id', session.id);

    return res.status(401).json({ valid: false });
  }

  res.json({ valid: true });
});
```

#### 2. Content Delivery Endpoints

**`GET /api/content/stream?token=<signed_token>`**

```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront.Signer(
  process.env.AWS_CLOUDFRONT_KEY_PAIR_ID,
  process.env.AWS_CLOUDFRONT_PRIVATE_KEY
);

app.get('/api/content/stream', authenticateToken, async (req, res) => {
  const { token } = req.query;

  // Validate signed token
  const { valid, url } = validateSignedUrl(token);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Generate CloudFront signed URL
  const signedUrl = cloudfront.getSignedUrl({
    url: `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${url}`,
    expires: Math.floor(Date.now() / 1000) + 300, // 5 minutes
  });

  res.json({ url: signedUrl });
});
```

### Middleware

**`authenticateToken` middleware:**

```typescript
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.employeeId = payload.employee_id;
    next();
  });
}
```

## DRM Configuration

### Option 1: AWS Media Services

1. **Upload content to S3:**

```bash
aws s3 cp video.mp4 s3://your-bucket/content/videos/
```

2. **Configure MediaConvert for HLS with encryption:**

```json
{
  "OutputGroups": [
    {
      "OutputGroupSettings": {
        "Type": "HLS_GROUP_SETTINGS",
        "HlsGroupSettings": {
          "Encryption": {
            "Type": "SPEKE",
            "SpekeKeyProvider": {
              "Url": "https://your-license-server.com/speke"
            }
          }
        }
      }
    }
  ]
}
```

3. **Set up CloudFront distribution with signed URLs**

### Option 2: Azure Media Services

1. **Upload content to Azure Storage**
2. **Configure streaming endpoint with DRM**
3. **Set up license delivery service**

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in Vercel dashboard.

### Option 2: AWS (Complete Stack)

**Frontend (S3 + CloudFront):**

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-frontend-bucket/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

**Backend (EC2/ECS/Lambda):**

Deploy Node.js API using:
- AWS Elastic Beanstalk
- ECS with Fargate
- Lambda with API Gateway

### Option 3: Azure (Complete Stack)

**Frontend:** Azure Static Web Apps
**Backend:** Azure App Service
**Media:** Azure Media Services

### Option 4: Docker

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - VITE_API_URL=${VITE_API_URL}

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
```

## Security Configuration

### 1. HTTPS Only

Configure HSTS headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 2. CSP Headers (Server-side)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co;
  media-src 'self' blob:;
  object-src 'none';
  frame-ancestors 'none';
```

### 3. CORS Configuration

```typescript
app.use(cors({
  origin: 'https://actu.yourdomain.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 4. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

## Monitoring Setup

### 1. Sentry (Error Tracking)

```bash
npm install @sentry/react
```

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: 'production',
  tracesSampleRate: 1.0,
});
```

### 2. CloudWatch/Azure Monitor

Configure logging for:
- API requests/responses
- Error rates
- Performance metrics
- Session activity

### 3. Database Monitoring

Monitor Supabase:
- Query performance
- Connection pool usage
- Storage usage
- RLS policy performance

## Backup Strategy

### Database Backups

Supabase provides automatic backups. For additional safety:

```bash
# Manual backup
pg_dump -h your-supabase-host -U postgres -d postgres > backup.sql

# Restore
psql -h your-supabase-host -U postgres -d postgres < backup.sql
```

### Content Backups

Configure S3/Azure Storage:
- Versioning enabled
- Cross-region replication
- Lifecycle policies

## Testing Production

### Pre-launch Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Sample courses uploaded
- [ ] DRM working correctly
- [ ] Session timeout functioning
- [ ] Audit logs recording
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Error tracking enabled
- [ ] Monitoring dashboards set up
- [ ] Backup procedures tested
- [ ] Load testing completed
- [ ] Security scan performed

### Smoke Tests

```bash
# Test login
curl -X POST https://api.actu.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emp_id":"ADMIN001","password":"YourPassword"}'

# Test session validation
curl https://api.actu.yourdomain.com/api/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Common Issues

**Build fails:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Environment variables not loading:**
- Verify `.env` file exists
- Check variable naming (must start with `VITE_`)
- Restart dev server

**Database connection issues:**
- Verify Supabase URL and key
- Check RLS policies
- Review network connectivity

**DRM not working:**
- Verify license server configuration
- Check browser DRM support
- Review CORS settings

## Support

For issues or questions:
- Technical documentation: `TECHNICAL_DOCUMENTATION.md`
- Database schema: Check Supabase dashboard
- Security concerns: Review security audit logs

---

**Version:** 1.0.0
**Last Updated:** 2025-10-13
