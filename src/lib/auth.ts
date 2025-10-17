import { supabase } from './supabase';
import type { Employee } from './types';

const SESSION_STORAGE_KEY = 'act_university_session';
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_SESSION_MS = 8 * 60 * 60 * 1000;

export interface AuthSession {
  employee: Employee;
  sessionId: string;
  token: string;
  expiresAt: string;
  lastActivityAt: string;
}

let idleTimer: number | null = null;

export async function login(empId: string, password: string): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emp_id: empId, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Login failed' };
    }

    const session: AuthSession = await response.json();

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    startIdleTimer();

    await logAuditEvent('login', 'authentication', session.employee.id, session.sessionId);

    return { success: true, session };
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
    return { success: false, error: errorMessage };
  }
}

export async function logout( reason: 'manual' | 'timeout' | 'admin_forced' = 'manual'): Promise<void> {
  const session = getStoredSession();

  if (session) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({ reason }),
      });

      await logAuditEvent('logout', 'authentication', session.employee.id, session.sessionId, { reason });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  stopIdleTimer();
  localStorage.removeItem(SESSION_STORAGE_KEY);

  window.location.href = '/login';
}

export function getStoredSession(): AuthSession | null {
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;

  try {
    const session: AuthSession = JSON.parse(stored);

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    const lastActivity = new Date(session.lastActivityAt);

    if (now > expiresAt) {
      logout('timeout');
      return null;
    }

    if (now.getTime() - lastActivity.getTime() > IDLE_TIMEOUT_MS) {
      logout('timeout');
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function updateActivity(): void {
  const session = getStoredSession();
  if (!session) return;

  session.lastActivityAt = new Date().toISOString();
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

  resetIdleTimer();
}

function startIdleTimer(): void {
  resetIdleTimer();

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, updateActivity);
  });
}

function stopIdleTimer(): void {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.removeEventListener(event, updateActivity);
  });
}

function resetIdleTimer(): void {
  if (idleTimer) {
    clearTimeout(idleTimer);
  }

  idleTimer = window.setTimeout(() => {
    logout('timeout');
  }, IDLE_TIMEOUT_MS);
}

export async function validateSession(): Promise<boolean> {
  const session = getStoredSession();
  if (!session) return false;

  try {
    const response = await fetch('/api/auth/validate', {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
    });

    if (!response.ok) {
      logout('timeout');
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function logAuditEvent(
  eventType: string,
  category: 'authentication' | 'content' | 'security' | 'admin',
  employeeId: string,
  sessionId: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      employee_id: employeeId,
      session_id: sessionId,
      event_type: eventType,
      event_category: category,
      action_details: details,
      ip_address: '',
      user_agent: navigator.userAgent,
      severity: 'info',
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export function isAdmin(session: AuthSession | null): boolean {
  return session?.employee.role === 'admin';
}
