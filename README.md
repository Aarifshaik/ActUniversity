# Act University - Enterprise Learning Management System

A secure, enterprise-grade Learning Management System designed for corporate employee training with comprehensive DRM protection, session management, and compliance tracking.

## Key Features

### For Employees
- Secure authentication with EMP_ID and password
- Modern card-based interface for courses and activities
- Multiple content types: Videos, Presentations, Quizzes, Declarations, Articles
- Real-time progress tracking
- Personalized dashboard with statistics
- Responsive design for all devices

### For Administrators
- Active session monitoring with force logout capability
- Comprehensive audit logs with CSV export
- Real-time analytics and reporting
- System-wide statistics dashboard
- Content management capabilities

### Security Features
- Enterprise-grade DRM protection (integration points ready)
- Dynamic watermarking on all content (EMP_ID + timestamp + session ID)
- Automatic 30-minute idle timeout
- Maximum 8-hour session duration
- Comprehensive audit logging
- Anti-scraping and anti-automation protection
- Content Security Policy (CSP) enforcement
- Rate limiting and bot detection
- Forensic content access tracking

## Technology Stack

**Frontend:**
- React 18.3 + TypeScript
- Vite for blazing-fast builds
- Tailwind CSS for modern styling
- Lucide React for beautiful icons

**Backend:**
- Supabase (PostgreSQL + Real-time + Storage)
- Row Level Security (RLS) for data protection
- Comprehensive audit logging

**Security:**
- JWT-based authentication
- Session management with Redis-ready architecture
- Client-side protection measures
- Server-side content encryption (ready for AWS/Azure)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:5173

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ActivityCard.tsx # Activity display card
│   ├── Badge.tsx        # Status badges
│   ├── Button.tsx       # Primary button component
│   ├── Card.tsx         # Container component
│   ├── CourseCard.tsx   # Course display card
│   └── Input.tsx        # Form input component
│
├── lib/                 # Core utilities and configuration
│   ├── auth.ts         # Authentication logic
│   ├── constants.ts    # Design system constants
│   ├── security.ts     # Security utilities
│   ├── supabase.ts     # Supabase client
│   └── types.ts        # TypeScript type definitions
│
├── pages/              # Main application pages
│   ├── ActivityPlayer.tsx  # Content player with DRM
│   ├── AdminDashboard.tsx  # Admin control panel
│   ├── Dashboard.tsx       # Employee dashboard
│   └── Login.tsx           # Authentication page
│
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Database Schema

The system uses 11 core tables:

1. **employees** - User accounts and roles
2. **courses** - Learning programs
3. **activities** - Individual learning units
4. **employee_progress** - Progress tracking
5. **sessions** - Active user sessions
6. **audit_logs** - Comprehensive audit trail
7. **content_access_logs** - Forensic tracking
8. **quiz_questions** - Quiz content
9. **quiz_attempts** - Quiz submissions
10. **declarations** - Compliance acknowledgments
11. **employee_declarations** - Signed declarations

All tables include Row Level Security (RLS) policies for data protection.

## Design System

### Color Palette
- **Primary:** #0B63D6 (Deep Blue) - Main brand color
- **Accent:** #00A3A3 (Teal) - Highlights and CTAs
- **Background:** #F7FAFC - Page background
- **Card Background:** #FFFFFF - Card surfaces
- **Text:** #0F1724 - Primary text
- **Text Secondary:** #64748B - Secondary text

### Typography
- Clean, modern system fonts
- 150% line height for body text
- 120% line height for headings
- Consistent font weight scale

### Components
All components follow a consistent design language with:
- Micro-interactions (<80ms)
- GPU-accelerated animations
- Hover effects with subtle scaling
- Focus states for accessibility
- Responsive breakpoints

## Security Implementation

### Client-Side Protection
```typescript
// Automatic security initialization
setupCSP();                    // Content Security Policy
preventDevTools();             // DevTools detection
preventScreenCapture();        // Screenshot prevention
detectAutomation();            // Bot detection
```

### Session Management
```typescript
// 30-minute idle timeout
// 8-hour maximum duration
// Activity tracking on all interactions
// Automatic logout on timeout
```

### Content Protection
```typescript
// Dynamic watermarking
const watermark = createWatermark(empId, sessionId);
// Format: "EMP001 | 2025-10-13T10:30:00Z | abc12345"

// Signed URLs with short TTL
const signedUrl = generateSignedUrl(contentUrl, ttlSeconds);
// URLs expire after configured time
```

## API Requirements

The frontend is ready to integrate with a backend API. Required endpoints:

### Authentication
- `POST /api/auth/login` - Employee login
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/validate` - Session validation

### Content Delivery
- `GET /api/content/stream?token=<signed_token>` - Secure content streaming

See `DEPLOYMENT_GUIDE.md` for complete implementation details.

## DRM Integration

The content player includes integration points for:

**Video Streaming:**
- Shaka Player or HLS.js ready
- DRM configuration hooks (Widevine/FairPlay/PlayReady)
- Quality adaptation
- Playback analytics

**Presentation Viewing:**
- Server-side rendering pipeline ready
- Slide navigation with progress tracking
- Watermark embedding
- Sequential access control

**Secure Delivery:**
- AWS S3 + CloudFront setup ready
- Azure Media Services integration ready
- Signed URL generation implemented
- Token-based access control

## Deployment

### Frontend Deployment

**Option 1: Vercel (Recommended)**
```bash
vercel --prod
```

**Option 2: AWS S3 + CloudFront**
```bash
npm run build
aws s3 sync dist/ s3://your-bucket/
```

**Option 3: Docker**
```bash
docker build -t act-university .
docker run -p 3000:3000 act-university
```

### Backend Deployment

Deploy Node.js backend to:
- AWS (EC2/ECS/Lambda)
- Azure (App Service)
- Google Cloud (Cloud Run)
- Heroku/Railway

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build verification
npm run build
```

## Environment Variables

```env
# Supabase (Already configured)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API (Required for production)
VITE_API_URL=https://api.actu.yourdomain.com
```

## Documentation

- **TECHNICAL_DOCUMENTATION.md** - Complete technical specifications
- **DEPLOYMENT_GUIDE.md** - Deployment and configuration guide
- **README.md** - This file

## Key Features in Detail

### Session Management
- Automatic idle timeout after 30 minutes of inactivity
- Maximum session duration of 8 hours
- Activity tracking on mouse, keyboard, scroll, touch events
- Graceful session expiration with redirect to login
- Admin force logout capability

### Audit Logging
- All authentication events logged
- Content access tracked with watermark data
- Admin actions recorded
- Security incidents captured
- Exportable compliance reports (CSV)
- 7-year retention ready

### Content Protection
- No download capability
- Screenshot detection
- Print prevention
- DevTools monitoring
- Right-click disabled
- Text selection disabled (except inputs)
- Automation detection
- Rate limiting per user

### Progress Tracking
- Real-time progress updates
- Per-activity tracking
- Course completion percentage
- Time spent analytics
- Quiz scores and attempts
- Declaration signatures

## Admin Features

### Active Session Monitoring
- Real-time session list
- Last activity timestamps
- Force logout capability
- IP address tracking
- User agent information

### Analytics Dashboard
- Total employees and active count
- Course statistics
- Active session count
- Recent audit events
- System health metrics

### Audit Log Management
- Filter by category and severity
- Search by employee or event type
- CSV export for compliance
- Automatic retention policies

## Future Enhancements

**Phase 2:**
- Native mobile apps (iOS/Android)
- Advanced analytics with ML recommendations
- Live webinar capabilities
- Gamification features
- Multi-language support

**Phase 3:**
- Advanced DRM with hardware-backed security
- Biometric authentication
- GraphQL API
- Microservices architecture
- Advanced accessibility (WCAG AAA)

## Compliance

**Security Standards:**
- ISO 27001 aligned
- SOC 2 Type II ready
- GDPR compliant data handling
- Regular security audits

**Data Retention:**
- Audit logs: 7 years
- User data: Configurable
- Content access logs: 3 years minimum

## Support

### Common Issues

**Session expires too quickly**
- Check idle timeout configuration
- Verify activity tracking is working

**Content won't load**
- Verify backend API is running
- Check signed URL generation
- Review CORS settings

**Build fails**
- Delete node_modules and reinstall
- Check Node.js version (18+)

### Getting Help

For technical issues:
1. Check TECHNICAL_DOCUMENTATION.md
2. Review DEPLOYMENT_GUIDE.md
3. Check browser console for errors
4. Review Supabase logs

## License

Proprietary - Act Corporation

## Credits

Built with modern web technologies:
- React + TypeScript
- Tailwind CSS
- Supabase
- Lucide Icons

---

**Version:** 1.0.0
**Last Updated:** 2025-10-13
**Status:** Production Ready (Backend API Required)
