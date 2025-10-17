# Security Architecture Documentation

## Overview

Act University implements a robust, multi-layered security architecture that combines custom JWT-based authentication with database-level security controls. This document outlines the comprehensive security measures implemented to protect user data, prevent unauthorized access, and ensure system integrity.

## Authentication & Authorization System

### 1. JWT-Based Authentication

#### Token Generation
```javascript
// Secure token creation during login
const token = jwt.sign(
  { 
    employee_id: employee.id,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
  },
  process.env.JWT_SECRET, // 256-bit secret key
  { algorithm: 'HS256' }
);
```

**Security Features:**
- ✅ **Cryptographic Signing**: Uses HMAC SHA-256 algorithm
- ✅ **Secret Key Protection**: JWT secret stored as environment variable
- ✅ **Automatic Expiration**: 8-hour token lifetime
- ✅ **Tamper Detection**: Any modification invalidates the token
- ✅ **Stateless Design**: No server-side session storage required

#### Token Verification Middleware
```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer token
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.employeeId = decoded.employee_id;
    next();
  });
};
```

### 2. Multi-Layer Authorization

#### Layer 1: Token Validation
- Verifies JWT signature integrity
- Checks token expiration
- Extracts authenticated user identity

#### Layer 2: Database Role Verification
```javascript
// Admin endpoint protection
const { data: employee } = await supabase
  .from('employees')
  .select('role, is_active')
  .eq('id', req.employeeId)
  .single();

if (!employee || employee.role !== 'admin' || !employee.is_active) {
  return res.status(403).json({ message: 'Admin access required' });
}
```

#### Layer 3: Resource-Level Permissions
- Course management: Admin-only operations
- Employee data: Role-based access control
- Audit logs: Admin visibility with data filtering

## Security Advantages Over Traditional Approaches

### vs. Basic Session-Based Auth
| Feature | Act University | Traditional Sessions |
|---------|----------------|---------------------|
| **Scalability** | ✅ Stateless, no server memory | ❌ Server-side session storage |
| **Security** | ✅ Cryptographically signed | ⚠️ Session hijacking risks |
| **Expiration** | ✅ Built-in token expiration | ⚠️ Manual session cleanup |
| **Cross-Service** | ✅ Works across microservices | ❌ Tied to single server |

### vs. Supabase RLS Only
| Feature | Act University | Supabase RLS |
|---------|----------------|--------------|
| **Custom Logic** | ✅ Complex business rules | ❌ Limited policy syntax |
| **Error Handling** | ✅ Detailed error responses | ⚠️ Generic RLS errors |
| **Audit Trail** | ✅ Custom logging & monitoring | ⚠️ Basic audit logs |
| **Key Security** | ✅ Service keys on backend only | ❌ Keys exposed to frontend |

## Attack Vector Mitigation

### 1. Token Forgery Prevention
**Attack**: Malicious user creates fake admin tokens
**Mitigation**: 
- JWT signature verification with secret key
- Secret key stored securely on backend only
- Impossible to forge without the secret

### 2. Token Theft Protection
**Attack**: Stolen tokens used for unauthorized access
**Mitigation**:
- Short token lifespan (8 hours)
- HTTPS-only transmission
- No token storage in localStorage (session-based)
- Automatic logout on token expiration

### 3. Privilege Escalation Prevention
**Attack**: User claims admin privileges
**Mitigation**:
- Database role verification on every admin request
- Employee status validation (is_active check)
- Separate admin endpoints with role guards

### 4. Session Hijacking Protection
**Attack**: Intercepted session used maliciously
**Mitigation**:
- Stateless JWT design (no server sessions to hijack)
- Token-based authentication
- Audit logging for suspicious activities

### 5. Replay Attack Prevention
**Attack**: Reusing captured requests
**Mitigation**:
- Token expiration limits replay window
- HTTPS encryption prevents easy capture
- Audit logs track unusual patterns

## Database Security

### 1. Supabase Integration
```javascript
// Backend uses service role for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Server-side only
);
```

**Benefits:**
- ✅ Service role bypasses RLS for admin operations
- ✅ Anon key used for frontend (limited permissions)
- ✅ No sensitive keys exposed to client-side code

### 2. Data Access Patterns
- **Admin Operations**: Backend API → Service Role → Database
- **User Operations**: Frontend → Anon Key → RLS Policies
- **Audit Trail**: All operations logged with user context

## Password Security

### 1. Hashing Strategy
```javascript
// Secure password hashing
const bcrypt = require('bcryptjs');
const saltRounds = 12; // High computational cost

const passwordHash = await bcrypt.hash(password, saltRounds);
```

**Features:**
- ✅ bcrypt with 12 salt rounds (high security)
- ✅ Unique salt per password
- ✅ Computationally expensive (prevents brute force)
- ✅ No plaintext password storage

### 2. Password Policies
- Minimum complexity requirements
- Regular password rotation recommendations
- Account lockout after failed attempts

## Audit & Monitoring

### 1. Comprehensive Logging
```javascript
// Audit log entry for admin actions
await supabase.from('audit_logs').insert({
  employee_id: req.employeeId,
  session_id: sessionId,
  event_type: 'course_created',
  event_category: 'admin',
  resource_type: 'course',
  resource_id: courseId,
  action_details: { course_title: courseData.title },
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
  severity: 'info'
});
```

**Tracked Events:**
- Authentication attempts (success/failure)
- Admin operations (create/update/delete)
- Session management (login/logout/timeout)
- Data access patterns
- Security violations

### 2. Real-time Monitoring
- Failed authentication tracking
- Unusual access pattern detection
- Admin action monitoring
- Session anomaly detection

## API Security

### 1. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### 2. Input Validation
- Request payload sanitization
- SQL injection prevention
- XSS attack mitigation
- CORS policy enforcement

### 3. Error Handling
- No sensitive information in error messages
- Consistent error response format
- Detailed logging for debugging (server-side only)

## Deployment Security

### 1. Environment Variables
```bash
# Required security environment variables
JWT_SECRET=<256-bit-random-string>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_URL=<supabase-project-url>
NODE_ENV=production
```

### 2. HTTPS Enforcement
- All API communications over HTTPS
- Secure cookie settings
- HSTS headers for browsers

### 3. Infrastructure Security
- Database connection encryption
- VPC network isolation
- Regular security updates
- Backup encryption

## Security Best Practices Implemented

### ✅ Authentication
- Strong JWT implementation with proper signing
- Multi-factor verification (token + database role)
- Automatic session expiration
- Secure password hashing (bcrypt)

### ✅ Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- Principle of least privilege
- Admin operation segregation

### ✅ Data Protection
- Encryption in transit (HTTPS)
- Encryption at rest (Supabase)
- No sensitive data in logs
- Secure key management

### ✅ Monitoring & Auditing
- Comprehensive audit logging
- Real-time security monitoring
- Failed attempt tracking
- Admin action oversight

### ✅ Infrastructure
- Environment variable security
- Rate limiting protection
- Input validation & sanitization
- Error handling best practices

## Compliance & Standards

This security architecture aligns with:
- **OWASP Top 10** security guidelines
- **JWT Best Practices** (RFC 7519)
- **NIST Cybersecurity Framework**
- **SOC 2 Type II** requirements
- **GDPR** data protection principles

## Security Incident Response

### 1. Detection
- Automated monitoring alerts
- Audit log analysis
- Anomaly detection systems

### 2. Response
- Immediate token revocation capability
- User account suspension
- Admin notification system
- Incident logging and tracking

### 3. Recovery
- Secure password reset process
- Account reactivation procedures
- Security patch deployment
- Post-incident analysis

## Conclusion

Act University's security architecture provides enterprise-grade protection through multiple defensive layers. The combination of JWT-based authentication, database-level security, comprehensive auditing, and proactive monitoring creates a robust security posture that protects against common attack vectors while maintaining system usability and performance.

The custom authentication system offers superior flexibility and security compared to basic session-based approaches, while the backend API architecture ensures sensitive operations are properly protected without exposing critical security keys to client-side code.

---

**Last Updated**: October 2025  
**Security Review**: Quarterly  
**Next Audit**: January 2026