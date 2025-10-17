# 📘 Project Best Practices

## 1. Project Purpose
A secure, enterprise-grade Learning Management System (LMS) for corporate training. The system provides employee learning (courses and activities), strong session management (JWT + idle/max timeouts), strict auditing, and content protection (watermarking, DRM integration points). The stack is React + TypeScript (frontend), Express (backend), and Supabase Postgres with RLS (database).

## 2. Project Structure
- Root (Vite + React + TS)
  - src/
    - components/ — Reusable UI primitives (Card, Button, Input, Badge, etc.) and domain components (CourseCard, ActivityCard)
    - lib/ — Core utilities and configs (auth, supabase client, date utils for IST, security helpers, type declarations)
    - pages/ — Feature screens (Login, Dashboard, ActivityPlayer, AdminDashboard)
    - App.tsx — App entry/route-like controller using simple event-based navigation
    - main.tsx, index.css — Bootstrap and global styles
  - vite.config.ts — Dev server and proxy to backend on /api
  - eslint.config.js, tsconfig*.json — Linting and TypeScript configuration
- backend/ (Express API)
  - server.js — Auth, admin, and employee endpoints; integrates with Supabase via service role key; JWT auth
  - package.json — Scripts: start/dev
- supabase/
  - migrations/ — SQL schema and policies (core schema, IST views, triggers like prevent_empid_updates.sql)
- scripts/
  - ensure-sample-data.sql, sample-data.sql, check-data.js — Data seeding/verification helpers

Key separation-of-concerns:
- Frontend renders UI and calls /api for authenticated actions. It may directly query Supabase only as a fallback.
- Backend enforces authentication/authorization, session lifecycle, admin operations, and audit logging.
- Database enforces RLS and invariants (e.g., immutable emp_id) and provides IST-supporting views.

Entry points and configuration:
- Frontend dev: npm run dev (Vite). Proxy /api → http://localhost:4000.
- Backend dev: cd backend && npm run dev (nodemon on port 4000).
- Environment: Vite uses VITE_* variables; backend reads .env (dotenv). See README/TECHNICAL_DOCUMENTATION.

## 3. Test Strategy
Current repo has no test framework configured. Adopt the following:
- Frontend (recommended):
  - Vitest + @testing-library/react for unit/component tests
  - MSW for mocking /api and Supabase network calls
  - Coverage: 80% statements/branches minimum on lib/ and components/
  - Co-locate tests as *.test.ts(x) near source or use src/__tests__
- Backend (recommended):
  - Jest (or Vitest in Node mode) + supertest for HTTP endpoints
  - Unit tests for helpers (IST formatters, token middleware); integration tests for /api/auth/*, /api/admin/*
  - Use .env.test and a dedicated Supabase test project or mock @supabase/supabase-js client
  - Seed using scripts/sample-data.sql; clean up between tests
- E2E (optional):
  - Playwright or Cypress to validate login → dashboard → activity → admin flows
  - Run against local dev servers with seeded data

Testing philosophy:
- Prefer small, deterministic unit tests for utilities and components
- Integration tests for critical flows (login, session validate, admin CRUD)
- Snapshot tests only for stable, visual components
- Mock network boundaries (MSW in FE; supertest in BE) and avoid hitting production services

## 4. Code Style
- Languages:
  - Frontend: TypeScript, React 18 function components with hooks
  - Backend: Node.js (CommonJS in server.js). Keep CJS consistent in backend unless you migrate to ESM everywhere
- Typing:
  - Use strict typing. Reuse src/lib/types.ts across frontend; mirror schema changes there
  - Avoid any; model domain shapes (Employee, Course, Activity, etc.) clearly
- Async patterns:
  - Use async/await; handle errors with try/catch and return typed error responses
  - Prefer Promise.all for independent queries (as done in admin stats/dashboard)
- Naming conventions:
  - Files: React components PascalCase (Component.tsx); utilities kebab/flat lowerCamel (dateUtils.ts, security.ts)
  - Variables/functions: camelCase; constants SCREAMING_SNAKE or NamedObject maps
  - React components: PascalCase, export named where possible
- React specifics:
  - Keep state local and minimal; derive UI from props/state
  - useEffect deps exhaustive; clear intervals/timeouts (e.g., admin polling every 30s)
  - Prefer composition over prop drilling; keep components focused
- Styling:
  - Tailwind utility-first; prefer classes over inline styles
  - Keep semantic HTML and accessible focus states (components already implement focus rings)
- Error handling:
  - Backend: never leak internals. Log error server-side; return consistent JSON { message, [code], [details] }
  - Frontend: surface user-friendly messages; log technical details to console only
- Security-sensitive data:
  - Never expose SUPABASE_SERVICE_KEY to the frontend
  - Do not store passwords or secrets in localStorage; store only session token and metadata already used

## 5. Common Patterns
- Auth/session:
  - Frontend stores session in localStorage with idle (30 min) and max (8 hr) enforcement; validate via /api/auth/validate
  - Always include Authorization: Bearer <token> on /api calls; on 401, logout and redirect
- Event-driven navigation:
  - Simple event bus using CustomEvent (navigateToAdmin, navigateToDashboard, navigateToActivity)
- Supabase usage:
  - Prefer backend API for privileged/admin actions; frontend may use Supabase for read-only fallbacks
  - Upserts for progress; Map for efficient local progress lookups
- Timezone consistency:
  - Use src/lib/dateUtils.ts for IST formatting; backend also supports IST views (audit_logs_ist, sessions_ist, employees_ist)
- Security utilities:
  - setupCSP, preventDevTools, preventScreenCapture, detectAutomation from lib/security.ts
  - Watermarking helpers and signed URL helpers are present as integration points
- Admin auditing:
  - All admin mutations log to audit_logs with severity and details

## 6. Do's and Don'ts
- Do
  - Use the backend /api for authentication, admin, and dashboard data
  - Keep employee.emp_id immutable (DB trigger + API validation already enforce this)
  - Use the types in src/lib/types.ts for new UI/features
  - Handle loading/empty/error states explicitly in pages
  - Clean up intervals/timeouts and event listeners in useEffect
  - Use Promise.all for independent backend reads to optimize latency
  - Keep CSP/connect-src aligned with your deployment domains
- Don't
  - Don’t include SUPABASE_SERVICE_KEY or secrets in frontend code or Vite env
  - Don’t bypass Authorization headers for /api calls
  - Don’t mutate session storage structure; extend via new fields only if necessary
  - Don’t directly update emp_id; returns 400 and DB trigger will reject
  - Don’t add new date libraries; reuse dateUtils for IST
  - Don’t add direct DOM manipulation outside security utilities

## 7. Tools & Dependencies
- Frontend
  - React 18 + TypeScript, Vite
  - Tailwind CSS, Lucide React icons
  - Supabase JS (anon key) via src/lib/supabase.ts
  - ESLint + TypeScript ESLint; scripts: lint, typecheck, build
- Backend
  - Express, cors, dotenv, bcryptjs, jsonwebtoken, @supabase/supabase-js (service key)
  - nodemon for dev
- Database/Security
  - Supabase with RLS; migrations include core schema, IST views, and prevent_empid_updates trigger

Setup instructions (dev):
- Prereqs: Node 18+
- Frontend
  - npm install
  - Configure .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
  - npm run dev (Vite at 5173; proxy /api to 4000)
- Backend
  - cd backend && npm install
  - Create backend/.env with SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, PORT=4000
  - npm run dev
- Database
  - Apply SQL migrations in supabase/migrations to your project

## 8. Other Notes
- RLS is enabled on all tables; many policies depend on current_setting('app.current_employee_id'). With service role keys, RLS is bypassed—authorization must be enforced at API layer
- Admin features rely on audit_logs, sessions, employee_progress. Keep audit logging consistent (event_type/category/severity)
- IST formatting is a first-class requirement; use the provided views and date utilities instead of ad-hoc formatting
- Follow existing REST paths and semantics:
  - /api/auth/* for session lifecycle
  - /api/admin/* for admin CRUD and dashboards (admin-only)
  - /api/employee/* for user dashboards
- When adding new features:
  - Extend src/lib/types.ts first; then wire UI and API
  - Add DB migrations rather than altering existing files in place
  - Ensure 401/403 are handled in UI with clean fallback to logout or messaging
  - Add audit logging for any admin or security-sensitive mutation
- LLM generation constraints:
  - Use existing components and design tokens; keep Tailwind classes consistent
  - Prefer fetch with correct headers and error handling wrappers
  - Maintain file naming and directory conventions
