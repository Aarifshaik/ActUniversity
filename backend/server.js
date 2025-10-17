const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Supabase client with service role key (for admin operations)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware
app.set('trust proxy', true); // Trust proxy headers for proper IP detection
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Helper function to get client IP address
const getClientIP = (req) => {
  let ip = req.ip ||
    req.socket.remoteAddress ||
    (req.connection && req.connection.remoteAddress) ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.headers['x-client-ip'] ||
    'unknown';

  // Normalize IPv6 localhost to IPv4 localhost for consistency
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  // Remove IPv6 prefix if present
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  return ip;
};

// Helper function to format timestamp to IST
const formatToIST = (timestamp) => {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return null;

  // Convert to IST (UTC+5:30)
  const istOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  return new Intl.DateTimeFormat('en-IN', istOptions).format(date);
};

// Helper function to add IST formatted timestamps to objects
const addISTTimestamps = (obj) => {
  if (!obj) return obj;

  const result = { ...obj };

  // Add IST versions of common timestamp fields
  if (obj.created_at) {
    result.created_at_ist = formatToIST(obj.created_at);
  }
  if (obj.updated_at) {
    result.updated_at_ist = formatToIST(obj.updated_at);
  }
  if (obj.last_login_at) {
    result.last_login_at_ist = formatToIST(obj.last_login_at);
  }
  if (obj.last_activity_at) {
    result.last_activity_at_ist = formatToIST(obj.last_activity_at);
  }
  if (obj.expires_at) {
    result.expires_at_ist = formatToIST(obj.expires_at);
  }
  if (obj.signed_at) {
    result.signed_at_ist = formatToIST(obj.signed_at);
  }
  if (obj.submitted_at) {
    result.submitted_at_ist = formatToIST(obj.submitted_at);
  }
  if (obj.accessed_at) {
    result.accessed_at_ist = formatToIST(obj.accessed_at);
  }

  return result;
};

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
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
};

// Set RLS context for Supabase queries
const setRLSContext = async (employeeId) => {
  // When using service role key, RLS is bypassed
  // We handle authorization at the API layer instead
  // This function is kept for future use if we switch to user-level auth
  return;
};

// AUTH ENDPOINTS

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('Login request received:', {
    emp_id: req.body?.emp_id,
    ip_address: getClientIP(req),
    user_agent: req.headers['user-agent']?.substring(0, 100) || 'unknown'
  });
  try {
    const { emp_id, password } = req.body;

    if (!emp_id || !password) {
      return res.status(400).json({ message: 'Employee ID and password are required' });
    }

    // Find employee
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('emp_id', emp_id)
      .eq('is_active', true)
      .single();

    if (employeeError || !employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, employee.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { employee_id: employee.id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        employee_id: employee.id,
        session_token: token,
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'] || '',
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return res.status(500).json({ message: 'Failed to create session' });
    }

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
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'] || '',
      severity: 'info',
    });

    // Return session data
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

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  console.log('Logout request received:', {
    employee_id: req.employeeId,
    reason: req.body?.reason || 'manual',
    ip_address: getClientIP(req)
  });
  try {
    const { reason = 'manual' } = req.body;
    const sessionToken = req.headers.authorization.replace('Bearer ', '');

    // Deactivate session
    await supabase
      .from('sessions')
      .update({
        is_active: false,
        logout_reason: reason,
      })
      .eq('session_token', sessionToken);


    // Log audit event
    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'logout',
      event_category: 'authentication',
      action_details: { reason },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'] || '',
      severity: 'info',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Validate session endpoint
app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  console.log('Validate session request received:', {
    employee_id: req.employeeId,
    ip_address: getClientIP(req)
  });
  try {
    const sessionToken = req.headers.authorization.replace('Bearer ', '');

    // Check if session is still active
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (error || !session) {
      return res.status(401).json({ valid: false });
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const lastActivity = new Date(session.last_activity_at);
    const idleTimeout = 30 * 60 * 1000; // 30 minutes

    // Check if session expired or idle timeout reached
    if (now > expiresAt || now.getTime() - lastActivity.getTime() > idleTimeout) {
      await supabase
        .from('sessions')
        .update({ is_active: false, logout_reason: 'timeout' })
        .eq('id', session.id);

      return res.status(401).json({ valid: false });
    }

    // Update last activity
    await supabase
      .from('sessions')
      .update({ last_activity_at: now.toISOString() })
      .eq('id', session.id);

    res.json({ valid: true });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ valid: false });
  }
});

// ADMIN ENDPOINTS

// Admin stats endpoint
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  console.log('Admin Stats request received:', {
    employee_id: req.employeeId,
    ip_address: getClientIP(req)
  });
  try {
    // Verify admin role
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('id', req.employeeId)
      .single();

    if (!employee || employee.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get all stats in parallel
    const [
      employeesResult,
      coursesResult,
      activeSessionsResult,
      recentLogsResult,
      progressResult
    ] = await Promise.all([
      supabase.from('employees').select('id, is_active, created_at'),
      supabase.from('courses').select('id, is_published, created_at'),
      supabase.from('sessions').select('id, employee_id, created_at').eq('is_active', true),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('employee_progress').select('status, time_spent_seconds')
    ]);

    const employees = employeesResult.data || [];
    const courses = coursesResult.data || [];
    const activeSessions = activeSessionsResult.data || [];
    const recentLogs = recentLogsResult.data || [];
    const progress = progressResult.data || [];

    // Calculate comprehensive stats
    const stats = {
      // Employee stats
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.is_active).length,
      inactiveEmployees: employees.filter(e => !e.is_active).length,
      newEmployeesThisMonth: employees.filter(e => {
        const created = new Date(e.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length,

      // Course stats
      totalCourses: courses.length,
      publishedCourses: courses.filter(c => c.is_published).length,
      draftCourses: courses.filter(c => !c.is_published).length,
      newCoursesThisMonth: courses.filter(c => {
        const created = new Date(c.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length,

      // Session stats
      activeSessions: activeSessions.length,
      uniqueActiveUsers: new Set(activeSessions.map(s => s.employee_id)).size,

      // Learning progress stats
      totalCompletions: progress.filter(p => p.status === 'completed').length,
      totalInProgress: progress.filter(p => p.status === 'in_progress').length,
      totalLearningTimeMinutes: Math.floor(progress.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0) / 60),

      // System activity
      recentEventsCount: recentLogs.length,
      criticalEventsToday: recentLogs.filter(log => {
        const logDate = new Date(log.created_at);
        const today = new Date();
        return logDate.toDateString() === today.toDateString() && log.severity === 'critical';
      }).length
    };

    res.json({
      success: true,
      stats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

// Admin dashboard data endpoint (sessions, logs, etc.)
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
  console.log('Admin Dashboard request received:', {
    employee_id: req.employeeId,
    timezone: req.query.timezone || 'utc',
    ip_address: getClientIP(req)
  });
  try {
    // Verify admin role
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('id', req.employeeId)
      .single();

    if (!employee || employee.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Check if client wants IST format
    const useIST = req.query.timezone === 'ist' || req.headers['x-timezone'] === 'Asia/Kolkata';

    // Get dashboard data - use IST views if requested
    const [
      activeSessionsResult,
      recentLogsResult,
      employeesResult,
      coursesResult
    ] = await Promise.all([
      supabase
        .from(useIST ? 'sessions_ist' : 'sessions')
        .select(useIST ? '*, employees(*)' : '*, employees(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from(useIST ? 'audit_logs_ist' : 'audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from(useIST ? 'employees_ist' : 'employees')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
    ]);

    const responseData = {
      activeSessions: activeSessionsResult.data || [],
      recentLogs: recentLogsResult.data || [],
      employees: employeesResult.data || [],
      courses: (coursesResult.data || []).map(addISTTimestamps)
    };

    // Add IST timestamps if not using IST views
    if (!useIST) {
      responseData.activeSessions = responseData.activeSessions.map(addISTTimestamps);
      responseData.recentLogs = responseData.recentLogs.map(addISTTimestamps);
      responseData.employees = responseData.employees.map(addISTTimestamps);
    }

    res.json({
      success: true,
      data: responseData,
      timezone: useIST ? 'Asia/Kolkata' : 'UTC',
      lastUpdated: new Date().toISOString(),
      lastUpdatedIST: formatToIST(new Date().toISOString())
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch admin dashboard data' });
  }
});

// ADMIN COURSE MANAGEMENT ENDPOINTS

// Create course endpoint
app.post('/api/admin/courses', authenticateToken, async (req, res) => {
  console.log('Course Creation request received:', {
    employee_id: req.employeeId,
    course_title: req.body?.title,
    course_category: req.body?.category,
    ip_address: getClientIP(req)
  });
  try {
    // Verify admin role
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('id', req.employeeId)
      .single();

    if (!employee || employee.role !== 'admin') {
      // Log unauthorized attempt
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'course_create_unauthorized',
        event_category: 'security',
        resource_type: 'course',
        action_details: { reason: 'Non-admin user attempted course creation' },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'warning'
      });

      return res.status(403).json({ message: 'Admin access required' });
    }

    const courseData = {
      ...req.body,
      created_by: req.employeeId,
    };

    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();

    if (error) {
      console.error('Course creation error:', error);

      // Log failed course creation
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'course_create_failed',
        event_category: 'admin',
        resource_type: 'course',
        action_details: {
          error: error.message,
          course_data: { title: courseData.title, category: courseData.category }
        },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'error'
      });

      return res.status(400).json({
        message: 'Failed to create course',
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }

    // Log successful course creation
    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'course_created',
      event_category: 'admin',
      resource_type: 'course',
      resource_id: data.id,
      action_details: {
        course_title: data.title,
        course_category: data.category,
        difficulty_level: data.difficulty_level,
        is_published: data.is_published
      },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'info'
    });

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Course creation error:', error);

    // Log system error
    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'course_create_system_error',
      event_category: 'system',
      resource_type: 'course',
      action_details: { error: error.message },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'critical'
    });

    res.status(500).json({ message: 'Failed to create course' });
  }
});

// Update course endpoint
app.put('/api/admin/courses/:courseId', authenticateToken, async (req, res) => {
  console.log('Course Update request received:', {
    employee_id: req.employeeId,
    course_id: req.params.courseId,
    updated_fields: Object.keys(req.body),
    ip_address: getClientIP(req)
  });
  try {
    // Verify admin role
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('id', req.employeeId)
      .single();

    if (!employee || employee.role !== 'admin') {
      // Log unauthorized attempt
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'course_update_unauthorized',
        event_category: 'security',
        resource_type: 'course',
        resource_id: req.params.courseId,
        action_details: { reason: 'Non-admin user attempted course update' },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'warning'
      });

      return res.status(403).json({ message: 'Admin access required' });
    }

    const { courseId } = req.params;

    // Get original course data for audit trail
    const { data: originalCourse } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    const { data, error } = await supabase
      .from('courses')
      .update(req.body)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('Course update error:', error);

      // Log failed course update
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'course_update_failed',
        event_category: 'admin',
        resource_type: 'course',
        resource_id: courseId,
        action_details: {
          error: error.message,
          attempted_changes: req.body
        },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'error'
      });

      return res.status(400).json({
        message: 'Failed to update course',
        error: error.message
      });
    }

    // Log successful course update with changes
    const changes = {};
    Object.keys(req.body).forEach(key => {
      if (originalCourse && originalCourse[key] !== req.body[key]) {
        changes[key] = {
          from: originalCourse[key],
          to: req.body[key]
        };
      }
    });

    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'course_updated',
      event_category: 'admin',
      resource_type: 'course',
      resource_id: courseId,
      action_details: {
        course_title: data.title,
        changes: changes,
        updated_fields: Object.keys(req.body)
      },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'info'
    });

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Course update error:', error);

    // Log system error
    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'course_update_system_error',
      event_category: 'system',
      resource_type: 'course',
      resource_id: req.params.courseId,
      action_details: { error: error.message },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'critical'
    });

    res.status(500).json({ message: 'Failed to update course' });
  }
});

// Delete course endpoint
app.delete('/api/admin/courses/:courseId', authenticateToken, async (req, res) => {
  console.log('Course Deletion request received:', {
    employee_id: req.employeeId,
    course_id: req.params.courseId,
    ip_address: getClientIP(req)
  });
  try {
    // Verify admin role
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('id', req.employeeId)
      .single();

    if (!employee || employee.role !== 'admin') {
      // Log unauthorized attempt
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'course_delete_unauthorized',
        event_category: 'security',
        resource_type: 'course',
        resource_id: req.params.courseId,
        action_details: { reason: 'Non-admin user attempted course deletion' },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'warning'
      });

      return res.status(403).json({ message: 'Admin access required' });
    }

    const { courseId } = req.params;

    // Get course data before deletion for audit trail
    const { data: courseToDelete } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (!courseToDelete) {
      // Log attempt to delete non-existent course
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'course_delete_not_found',
        event_category: 'admin',
        resource_type: 'course',
        resource_id: courseId,
        action_details: { reason: 'Attempted to delete non-existent course' },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'warning'
      });

      return res.status(404).json({ message: 'Course not found' });
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Course deletion error:', error);

      // Log failed course deletion
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'course_delete_failed',
        event_category: 'admin',
        resource_type: 'course',
        resource_id: courseId,
        action_details: {
          error: error.message,
          course_title: courseToDelete.title
        },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'error'
      });

      return res.status(400).json({
        message: 'Failed to delete course',
        error: error.message
      });
    }

    // Log successful course deletion
    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'course_deleted',
      event_category: 'admin',
      resource_type: 'course',
      resource_id: courseId,
      action_details: {
        deleted_course: {
          title: courseToDelete.title,
          category: courseToDelete.category,
          difficulty_level: courseToDelete.difficulty_level,
          was_published: courseToDelete.is_published,
          created_by: courseToDelete.created_by
        }
      },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'warning' // Deletion is a significant action
    });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Course deletion error:', error);

    // Log system error
    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'course_delete_system_error',
      event_category: 'system',
      resource_type: 'course',
      resource_id: req.params.courseId,
      action_details: { error: error.message },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'critical'
    });

    res.status(500).json({ message: 'Failed to delete course' });
  }
});

// ADMIN EMPLOYEE MANAGEMENT ENDPOINTS

// Create employee endpoint
app.post('/api/admin/employees', authenticateToken, async (req, res) => {
  console.log('Employee Creation request received:', {
    employee_id: req.employeeId,
    new_emp_id: req.body?.emp_id,
    new_employee_role: req.body?.role,
    request_body: { ...req.body, password: req.body.password ? '[REDACTED]' : undefined },
    ip_address: getClientIP(req)
  });
  try {
    // Verify admin role
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('id', req.employeeId)
      .single();

    if (!employee || employee.role !== 'admin') {
      // Log unauthorized attempt
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'employee_create_unauthorized',
        event_category: 'security',
        resource_type: 'employee',
        action_details: { reason: 'Non-admin user attempted employee creation' },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'warning'
      });

      return res.status(403).json({ message: 'Admin access required' });
    }

    const { password } = req.body;

    if (!password || password.trim() === '') {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Define allowed fields for employee creation (matching database schema)
    const allowedFields = [
      'emp_id', 'email', 'full_name', 'department', 'role', 'is_active'
    ];

    // Filter employee data to only include allowed fields
    const employeeData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        employeeData[field] = req.body[field];
      }
    });

    // Validate required fields
    if (!employeeData.emp_id || !employeeData.email || !employeeData.full_name) {
      return res.status(400).json({ 
        message: 'Missing required fields: emp_id, email, full_name' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Set RLS context for admin operations
    await setRLSContext(req.employeeId);

    const { data, error } = await supabase
      .from('employees')
      .insert({
        ...employeeData,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (error) {
      console.error('Employee creation error:', error);

      // Log failed employee creation
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'employee_create_failed',
        event_category: 'admin',
        resource_type: 'employee',
        action_details: {
          error: error.message,
          attempted_emp_id: employeeData.emp_id,
          attempted_email: employeeData.email
        },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'error'
      });

      return res.status(400).json({
        message: 'Failed to create employee',
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }

    // Remove password_hash from response
    const { password_hash, ...responseData } = data;

    // Log successful employee creation
    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'employee_created',
      event_category: 'admin',
      resource_type: 'employee',
      resource_id: data.id,
      action_details: {
        new_employee: {
          emp_id: data.emp_id,
          email: data.email,
          full_name: data.full_name,
          role: data.role,
          department: data.department
        }
      },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'info'
    });

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Employee creation error:', error);

    // Log system error
    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'employee_create_system_error',
      event_category: 'system',
      resource_type: 'employee',
      action_details: { error: error.message },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'critical'
    });

    res.status(500).json({ message: 'Failed to create employee' });
  }
});

// Update employee endpoint
app.put('/api/admin/employees/:employeeId', authenticateToken, async (req, res) => {
  console.log('Employee Update request received:', {
    admin_id: req.employeeId,
    target_employee_id: req.params.employeeId,
    updated_fields: Object.keys(req.body),
    request_body: req.body,
    ip_address: getClientIP(req)
  });
  try {
    // Verify admin role
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('id', req.employeeId)
      .single();

    if (!employee || employee.role !== 'admin') {
      // Log unauthorized attempt
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'employee_update_unauthorized',
        event_category: 'security',
        resource_type: 'employee',
        resource_id: req.params.employeeId,
        action_details: { reason: 'Non-admin user attempted employee update' },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'warning'
      });

      return res.status(403).json({ message: 'Admin access required' });
    }

    const { employeeId } = req.params;

    // Get original employee data for audit trail
    const { data: originalEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (!originalEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Set RLS context for admin operations
    await setRLSContext(req.employeeId);

    // Prevent emp_id changes for security and audit integrity
    if (req.body.emp_id && req.body.emp_id !== originalEmployee.emp_id) {
      // Log attempt to change emp_id
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'employee_empid_change_blocked',
        event_category: 'security',
        resource_type: 'employee',
        resource_id: employeeId,
        action_details: {
          attempted_change: {
            from: originalEmployee.emp_id,
            to: req.body.emp_id
          },
          reason: 'Employee ID changes are not allowed for security and audit integrity'
        },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'warning'
      });

      return res.status(400).json({
        message: 'Employee ID cannot be changed',
        error: 'emp_id_immutable',
        details: 'Employee IDs are immutable for security and audit trail integrity'
      });
    }

    // Define allowed fields for employee updates (matching database schema)
    const allowedFields = [
      'email', 'full_name', 'department', 'role', 'is_active'
    ];

    // Filter and prepare update data
    let updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle password update if provided
    if (req.body.password && req.body.password.trim() !== '') {
      const passwordHash = await bcrypt.hash(req.body.password, 10);
      updateData.password_hash = passwordHash;
    }

    // Ensure we have something to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: 'No valid fields to update',
        allowedFields: allowedFields
      });
    }

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', employeeId)
      .select()
      .single();

    if (error) {
      console.error('Employee update error:', error);

      // Log failed employee update
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'employee_update_failed',
        event_category: 'admin',
        resource_type: 'employee',
        resource_id: employeeId,
        action_details: {
          error: error.message,
          attempted_changes: req.body,
          target_emp_id: originalEmployee.emp_id
        },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'error'
      });

      return res.status(400).json({
        message: 'Failed to update employee',
        error: error.message
      });
    }

    // Remove password_hash from response
    const { password_hash, ...responseData } = data;

    // Log successful employee update with changes
    const changes = {};
    Object.keys(req.body).forEach(key => {
      if (key !== 'password' && originalEmployee[key] !== req.body[key]) {
        changes[key] = {
          from: originalEmployee[key],
          to: req.body[key]
        };
      }
    });

    if (req.body.password) {
      changes.password = { changed: true };
    }

    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'employee_updated',
      event_category: 'admin',
      resource_type: 'employee',
      resource_id: employeeId,
      action_details: {
        target_employee: {
          emp_id: data.emp_id,
          email: data.email,
          full_name: data.full_name
        },
        changes: changes,
        updated_fields: Object.keys(req.body)
      },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'info'
    });

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Employee update error:', error);

    // Log system error
    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'employee_update_system_error',
      event_category: 'system',
      resource_type: 'employee',
      resource_id: req.params.employeeId,
      action_details: { error: error.message },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'critical'
    });

    res.status(500).json({ message: 'Failed to update employee' });
  }
});

// Delete employee endpoint
app.delete('/api/admin/employees/:employeeId', authenticateToken, async (req, res) => {
  console.log('Employee Deletion request received:', {
    admin_id: req.employeeId,
    target_employee_id: req.params.employeeId,
    ip_address: getClientIP(req)
  });
  try {
    // Verify admin role
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('id', req.employeeId)
      .single();

    if (!employee || employee.role !== 'admin') {
      // Log unauthorized attempt
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'employee_delete_unauthorized',
        event_category: 'security',
        resource_type: 'employee',
        resource_id: req.params.employeeId,
        action_details: { reason: 'Non-admin user attempted employee deletion' },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'warning'
      });

      return res.status(403).json({ message: 'Admin access required' });
    }

    const { employeeId } = req.params;

    // Prevent self-deletion
    if (employeeId === req.employeeId) {
      // Log self-deletion attempt
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'employee_self_delete_attempt',
        event_category: 'security',
        resource_type: 'employee',
        resource_id: employeeId,
        action_details: { reason: 'Admin attempted to delete their own account' },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'warning'
      });

      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Get employee data before deletion for audit trail
    const { data: employeeToDelete } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (!employeeToDelete) {
      // Log attempt to delete non-existent employee
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'employee_delete_not_found',
        event_category: 'admin',
        resource_type: 'employee',
        resource_id: employeeId,
        action_details: { reason: 'Attempted to delete non-existent employee' },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'warning'
      });

      return res.status(404).json({ message: 'Employee not found' });
    }

    // Set RLS context for admin operations
    await setRLSContext(req.employeeId);

    // Instead of hard delete, deactivate the employee to preserve audit trail
    const { data, error } = await supabase
      .from('employees')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', employeeId)
      .select()
      .single();

    if (error) {
      console.error('Employee deactivation error:', error);

      // Log failed employee deletion
      await supabase.from('audit_logs').insert({
        employee_id: req.employeeId,
        event_type: 'employee_delete_failed',
        event_category: 'admin',
        resource_type: 'employee',
        resource_id: employeeId,
        action_details: {
          error: error.message,
          target_employee: {
            emp_id: employeeToDelete.emp_id,
            email: employeeToDelete.email,
            full_name: employeeToDelete.full_name
          }
        },
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
        severity: 'error'
      });

      return res.status(400).json({
        message: 'Failed to delete employee',
        error: error.message
      });
    }

    // Deactivate all active sessions for the deleted employee
    await supabase
      .from('sessions')
      .update({
        is_active: false,
        logout_reason: 'account_deleted'
      })
      .eq('employee_id', employeeId)
      .eq('is_active', true);

    // Log successful employee deletion
    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'employee_deleted',
      event_category: 'admin',
      resource_type: 'employee',
      resource_id: employeeId,
      action_details: {
        deleted_employee: {
          emp_id: employeeToDelete.emp_id,
          email: employeeToDelete.email,
          full_name: employeeToDelete.full_name,
          role: employeeToDelete.role,
          department: employeeToDelete.department,
          was_active: employeeToDelete.is_active
        },
        action: 'deactivated' // Note: we deactivate rather than hard delete
      },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'warning' // Deletion is a significant action
    });

    res.json({
      success: true,
      message: 'Employee deactivated successfully'
    });

  } catch (error) {
    console.error('Employee deletion error:', error);

    // Log system error
    await supabase.from('audit_logs').insert({
      employee_id: req.employeeId,
      event_type: 'employee_delete_system_error',
      event_category: 'system',
      resource_type: 'employee',
      resource_id: req.params.employeeId,
      action_details: { error: error.message },
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'],
      severity: 'critical'
    });

    res.status(500).json({ message: 'Failed to delete employee' });
  }
});

// EMPLOYEE DASHBOARD ENDPOINTS

// Employee dashboard data endpoint
app.get('/api/employee/dashboard', authenticateToken, async (req, res) => {
  console.log('Employee Dashboard request received:', {
    employee_id: req.employeeId,
    ip_address: getClientIP(req)
  });
  try {
    const employeeId = req.employeeId;

    // Get employee dashboard data
    const [
      coursesResult,
      progressResult,
      activitiesResult
    ] = await Promise.all([
      // Get published courses
      supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('display_order'),

      // Get employee's progress
      supabase
        .from('employee_progress')
        .select('*')
        .eq('employee_id', employeeId),

      // Get recent activities from published courses
      supabase
        .from('activities')
        .select('*, courses!inner(*)')
        .eq('courses.is_published', true)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const courses = coursesResult.data || [];
    const progress = progressResult.data || [];
    const activities = activitiesResult.data || [];

    // Calculate progress statistics
    const progressMap = new Map();
    let completedCourses = 0;
    let inProgressCourses = 0;
    let totalTimeSpent = 0;

    progress.forEach((p) => {
      const key = `${p.course_id}-${p.activity_id || 'course'}`;
      progressMap.set(key, p);

      if (p.status === 'completed' && !p.activity_id) completedCourses++;
      if (p.status === 'in_progress' && !p.activity_id) inProgressCourses++;
      totalTimeSpent += p.time_spent_seconds || 0;
    });

    // Calculate course progress for each course
    const coursesWithProgress = courses.map(course => {
      const courseActivities = activities.filter(a => a.course_id === course.id);
      const totalActivities = courseActivities.length;
      const completedActivities = courseActivities.filter(activity => {
        const key = `${course.id}-${activity.id}`;
        const activityProgress = progressMap.get(key);
        return activityProgress?.status === 'completed';
      }).length;

      const progressPercentage = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

      return {
        ...course,
        progress: {
          completed: completedActivities,
          total: totalActivities,
          percentage: progressPercentage
        }
      };
    });

    const stats = {
      totalCourses: courses.length,
      completedCourses,
      inProgressCourses,
      totalTimeSpent: Math.floor(totalTimeSpent / 60), // Convert to minutes
    };

    res.json({
      success: true,
      data: {
        courses: coursesWithProgress,
        recentActivities: activities.slice(0, 6), // Limit to 6 for dashboard
        progress: Object.fromEntries(progressMap), // Convert Map to object for JSON
        stats
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Employee dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// Get course details with activities
app.get('/api/employee/courses/:courseId', authenticateToken, async (req, res) => {
  console.log('Course Details request received:', {
    employee_id: req.employeeId,
    course_id: req.params.courseId,
    ip_address: getClientIP(req)
  });
  try {
    const { courseId } = req.params;
    const employeeId = req.employeeId;

    // Get course with activities
    const [courseResult, activitiesResult, progressResult] = await Promise.all([
      supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_published', true)
        .single(),

      supabase
        .from('activities')
        .select('*')
        .eq('course_id', courseId)
        .order('display_order'),

      supabase
        .from('employee_progress')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('course_id', courseId)
    ]);

    if (courseResult.error || !courseResult.data) {
      return res.status(404).json({ message: 'Course not found or not published' });
    }

    const course = courseResult.data;
    const activities = activitiesResult.data || [];
    const progress = progressResult.data || [];

    // Map progress by activity
    const progressMap = {};
    progress.forEach(p => {
      const key = p.activity_id || 'course';
      progressMap[key] = p;
    });

    res.json({
      success: true,
      data: {
        course,
        activities,
        progress: progressMap
      }
    });

  } catch (error) {
    console.error('Course details error:', error);
    res.status(500).json({ message: 'Failed to fetch course details' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health Check request received:', {
    ip_address: getClientIP(req),
    timestamp: new Date().toISOString()
  });
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Act University Backend API'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 Not Found:', {
    method: req.method,
    path: req.path,
    ip_address: getClientIP(req)
  });
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Act University Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Frontend should connect to: http://localhost:${PORT}`);
});
