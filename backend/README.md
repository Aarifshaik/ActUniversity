# Act University Backend API

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Update `backend/.env` with your Supabase credentials:

```env
# Get these from your Supabase project dashboard
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Generate a secure JWT secret
JWT_SECRET=your-super-secret-jwt-key-here

# Server port
PORT=4000
```

**Where to find your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy **Project URL** → use as `SUPABASE_URL`
4. Copy **service_role secret** → use as `SUPABASE_SERVICE_KEY` (NOT the anon key!)

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on http://localhost:4000

### 4. Test the API

**Health check:**
```bash
curl http://localhost:4000/api/health
```

**Test login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emp_id":"ADMIN001","password":"password"}'
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - Employee login
- `POST /api/auth/logout` - Session logout
- `GET /api/auth/validate` - Validate session token

## Architecture

**Frontend (React)** ↔ **Backend (Express)** ↔ **Supabase (Database)**

- **Frontend**: Handles UI, reads data directly from Supabase
- **Backend**: Handles authentication, session management, secure operations
- **Supabase**: Database with Row Level Security (RLS) policies

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Session management with timeout
- Row Level Security (RLS) enforcement
- Comprehensive audit logging
- CORS protection

## Troubleshooting

**"Network Error" on login:**
- Make sure backend is running on port 4000
- Check that CORS is configured for your frontend URL
- Verify Supabase credentials are correct

**"Invalid credentials":**
- Make sure you've run the database migration
- Check that the admin user exists in the employees table
- Verify password is "password" (from sample data)

**Database connection issues:**
- Verify SUPABASE_URL and SUPABASE_SERVICE_KEY
- Make sure you're using the service_role key, not anon key
- Check that RLS policies are properly configured