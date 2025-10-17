import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Employee, Course, Session, AuditLog } from '../lib/types';
import { getStoredSession, isAdmin } from '../lib/auth';
import { formatAuditLogTime, formatSessionTime, formatLastLoginDate, formatForCSV } from '../lib/dateUtils';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import {
  Users, BookOpen, Activity, AlertTriangle,
  BarChart3, Download, Power, Clock, Plus, Edit, Trash2, UserPlus, Search, Filter
} from 'lucide-react';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'employees'>('overview');
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    newEmployeesThisMonth: 0,
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    newCoursesThisMonth: 0,
    activeSessions: 0,
    uniqueActiveUsers: 0,
    totalCompletions: 0,
    totalInProgress: 0,
    totalLearningTimeMinutes: 0,
    recentEventsCount: 0,
    criticalEventsToday: 0,
  });
  const [activeSessions, setActiveSessions] = useState<(Session & { employee: Employee })[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Search and filter states
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseDifficultyFilter, setCourseDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const session = getStoredSession();

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Escape to clear search
      if (e.key === 'Escape') {
        if (activeTab === 'courses') {
          setCourseSearch('');
          setCourseDifficultyFilter('all');
        } else if (activeTab === 'employees') {
          setEmployeeSearch('');
          setEmployeeRoleFilter('all');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  useEffect(() => {
    if (!session || !isAdmin(session)) {
      const event = new CustomEvent('navigateToDashboard');
      window.dispatchEvent(event);
      return;
    }

    loadAdminData();
    const interval = setInterval(loadAdminData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    if (!session?.token) return;

    try {
      // Fetch stats and dashboard data from backend API
      const [statsResponse, dashboardResponse] = await Promise.all([
        fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/admin/dashboard?timezone=ist', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json',
            'X-Timezone': 'Asia/Kolkata',
          },
        })
      ]);

      if (!statsResponse.ok || !dashboardResponse.ok) {
        throw new Error('Failed to fetch admin data from server');
      }

      const statsData = await statsResponse.json();
      const dashboardData = await dashboardResponse.json();

      if (statsData.success) {
        setStats(statsData.stats);
      }

      if (dashboardData.success) {
        const { activeSessions, recentLogs, employees, courses } = dashboardData.data;
        setActiveSessions(activeSessions);
        setRecentLogs(recentLogs);
        setEmployees(employees);
        setCourses(courses);
      }

    } catch (error) {
      console.error('Failed to load admin data:', error);
      // Fallback to direct Supabase queries if backend fails
      try {
        const [employeesData, coursesData, sessionsData, logsData] = await Promise.all([
          supabase.from('employees').select('*').order('created_at', { ascending: false }),
          supabase.from('courses').select('*').order('created_at', { ascending: false }),
          supabase
            .from('sessions')
            .select('*, employees(*)')
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

        // Basic stats calculation as fallback
        setStats({
          totalEmployees: employeesData.data?.length || 0,
          activeEmployees: employeesData.data?.filter(e => e.is_active).length || 0,
          inactiveEmployees: employeesData.data?.filter(e => !e.is_active).length || 0,
          newEmployeesThisMonth: 0,
          totalCourses: coursesData.data?.length || 0,
          publishedCourses: coursesData.data?.filter(c => c.is_published).length || 0,
          draftCourses: coursesData.data?.filter(c => !c.is_published).length || 0,
          newCoursesThisMonth: 0,
          activeSessions: sessionsData.data?.length || 0,
          uniqueActiveUsers: 0,
          totalCompletions: 0,
          totalInProgress: 0,
          totalLearningTimeMinutes: 0,
          recentEventsCount: logsData.data?.length || 0,
          criticalEventsToday: 0,
        });

        if (employeesData.data) setEmployees(employeesData.data);
        if (coursesData.data) setCourses(coursesData.data);
        if (sessionsData.data) setActiveSessions(sessionsData.data as any);
        if (logsData.data) setRecentLogs(logsData.data);
      } catch (fallbackError) {
        console.error('Fallback data loading also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const forceLogout = async (sessionId: string) => {
    try {
      await supabase
        .from('sessions')
        .update({ is_active: false, logout_reason: 'admin_forced' })
        .eq('id', sessionId);

      await supabase.from('audit_logs').insert({
        employee_id: session?.employee.id,
        session_id: session?.sessionId,
        event_type: 'force_logout',
        event_category: 'admin',
        resource_type: 'session',
        resource_id: sessionId,
        action_details: { reason: 'Forced by admin' },
        ip_address: '',
        user_agent: navigator.userAgent,
        severity: 'warning',
      });

      loadAdminData();
      // alert("Loaded")
    } catch (error) {
      console.error('Failed to force logout:', error);
    }
  };

  const exportAuditLogs = async () => {
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!data) return;

      const csv = [
        ['Timestamp (IST)', 'Employee ID', 'Event Type', 'Category', 'Resource', 'Severity'],
        ...data.map(log => [
          formatForCSV(log.created_at),
          log.employee_id || 'System',
          log.event_type,
          log.event_category,
          log.resource_type || '-',
          log.severity,
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const createCourse = async (courseData: Partial<Course>) => {
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create course');
      }

      if (result.success) {
        setCourses([result.data, ...courses]);
        setShowCourseForm(false);
        setEditingCourse(null);
        loadAdminData(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create course. Please try again.';
      alert(errorMessage);
    }
  };

  const updateCourse = async (courseId: string, courseData: Partial<Course>) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update course');
      }

      if (result.success) {
        setCourses(courses.map(c => c.id === courseId ? result.data : c));
        setShowCourseForm(false);
        setEditingCourse(null);
      }
    } catch (error) {
      console.error('Failed to update course:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update course. Please try again.';
      alert(errorMessage);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete course');
      }

      if (result.success) {
        setCourses(courses.filter(c => c.id !== courseId));
        loadAdminData(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete course. Please try again.';
      alert(errorMessage);
    }
  };

  const createEmployee = async (employeeData: Partial<Employee> & { password: string }) => {
    try {
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create employee');
      }

      if (result.success) {
        setEmployees([result.data, ...employees]);
        setShowEmployeeForm(false);
        setEditingEmployee(null);
        loadAdminData(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to create employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create employee. Please try again.';
      alert(errorMessage);
    }
  };

  const updateEmployee = async (employeeId: string, employeeData: Partial<Employee>) => {
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update employee');
      }

      if (result.success) {
        setEmployees(employees.map(e => e.id === employeeId ? result.data : e));
        setShowEmployeeForm(false);
        setEditingEmployee(null);
      }
    } catch (error) {
      console.error('Failed to update employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employee. Please try again.';
      alert(errorMessage);
    }
  };

  const deleteEmployee = async (employeeId: string, employeeName: string) => {
    // Prevent self-deactivation
    if (employeeId === session?.employee.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    if (!confirm(`Are you sure you want to deactivate ${employeeName}? This will disable their account and log them out of all sessions.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to deactivate employee');
      }

      if (result.success) {
        // Update the employee list to reflect the deactivation
        setEmployees(employees.map(e => 
          e.id === employeeId 
            ? { ...e, is_active: false, updated_at: new Date().toISOString() }
            : e
        ));
        loadAdminData(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to deactivate employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate employee. Please try again.';
      alert(errorMessage);
    }
  };

  const reactivateEmployee = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to reactivate ${employeeName}? This will enable their account.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: true }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reactivate employee');
      }

      if (result.success) {
        setEmployees(employees.map(e => e.id === employeeId ? result.data : e));
        loadAdminData(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to reactivate employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reactivate employee. Please try again.';
      alert(errorMessage);
    }
  };

  // Filter and search functions
  const filteredEmployees = employees.filter(employee => {
    // Search filter (emp_id or full_name)
    const searchMatch = employeeSearch === '' || 
      employee.emp_id.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      employee.full_name.toLowerCase().includes(employeeSearch.toLowerCase());
    
    // Role filter
    const roleMatch = employeeRoleFilter === 'all' || employee.role === employeeRoleFilter;
    
    return searchMatch && roleMatch;
  });

  const filteredCourses = courses.filter(course => {
    // Search filter (title)
    const searchMatch = courseSearch === '' || 
      course.title.toLowerCase().includes(courseSearch.toLowerCase());
    
    // Difficulty filter
    const difficultyMatch = courseDifficultyFilter === 'all' || course.difficulty_level === courseDifficultyFilter;
    
    return searchMatch && difficultyMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B63D6] mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0F1724]">Admin Dashboard</h1>
              <p className="text-sm text-[#64748B]">System monitoring and management</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => {
                const event = new CustomEvent('navigateToDashboard');
                window.dispatchEvent(event);
              }}>
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="flex gap-1 mt-4">
            <Button
              variant={activeTab === 'overview' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === 'courses' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('courses')}
            >
              Courses
            </Button>
            <Button
              variant={activeTab === 'employees' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('employees')}
            >
              Employees
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-[#0B63D6]" />
                </div>
                <p className="text-3xl font-bold text-[#0F1724] mb-1">{stats.totalEmployees}</p>
                <p className="text-sm text-[#64748B]">Total Employees</p>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-[#10B981]">{stats.activeEmployees} active</span>
                  <span className="text-[#64748B]">{stats.inactiveEmployees} inactive</span>
                </div>
                {stats.newEmployeesThisMonth > 0 && (
                  <p className="text-xs text-[#3B82F6] mt-1">+{stats.newEmployeesThisMonth} this month</p>
                )}
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-8 h-8 text-[#10B981]" />
                </div>
                <p className="text-3xl font-bold text-[#0F1724] mb-1">{stats.totalCourses}</p>
                <p className="text-sm text-[#64748B]">Total Courses</p>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-[#10B981]">{stats.publishedCourses} published</span>
                  <span className="text-[#F59E0B]">{stats.draftCourses} drafts</span>
                </div>
                {stats.newCoursesThisMonth > 0 && (
                  <p className="text-xs text-[#3B82F6] mt-1">+{stats.newCoursesThisMonth} this month</p>
                )}
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-8 h-8 text-[#3B82F6]" />
                </div>
                <p className="text-3xl font-bold text-[#0F1724] mb-1">{stats.activeSessions}</p>
                <p className="text-sm text-[#64748B]">Active Sessions</p>
                <p className="text-xs text-[#10B981] mt-1">{stats.uniqueActiveUsers} unique users online</p>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-[#F59E0B]" />
                </div>
                <p className="text-3xl font-bold text-[#0F1724] mb-1">{stats.totalLearningTimeMinutes}</p>
                <p className="text-sm text-[#64748B]">Learning Minutes</p>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-[#10B981]">{stats.totalCompletions} completed</span>
                  <span className="text-[#3B82F6]">{stats.totalInProgress} in progress</span>
                </div>
              </Card>
            </div>

            {/* Additional stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
                </div>
                <p className="text-3xl font-bold text-[#0F1724] mb-1">{stats.criticalEventsToday}</p>
                <p className="text-sm text-[#64748B]">Critical Events Today</p>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-[#8B5CF6]" />
                </div>
                <p className="text-3xl font-bold text-[#0F1724] mb-1">{stats.recentEventsCount}</p>
                <p className="text-sm text-[#64748B]">Recent System Events</p>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-8 h-8 text-[#06B6D4]" />
                </div>
                <p className="text-3xl font-bold text-[#0F1724] mb-1">
                  {stats.totalEmployees > 0 ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) : 0}%
                </p>
                <p className="text-sm text-[#64748B]">Employee Activity Rate</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#0F1724]">Active Sessions</h2>
                  <Badge variant="info">{activeSessions.length} online</Badge>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activeSessions.length === 0 ? (
                    <p className="text-center text-[#64748B] py-8">No active sessions</p>
                  ) : (
                    activeSessions.map((sessionData) => (
                      <div
                        key={sessionData.id}
                        className="flex items-center justify-between p-4 bg-[#F7FAFC] rounded-lg border border-[#E2E8F0]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#0F1724]">
                            {sessionData.employee?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-[#64748B]">
                            {sessionData.employee?.emp_id}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-[#64748B]" />
                            <span className="text-xs text-[#64748B]">
                              Last active: {formatSessionTime(sessionData.last_activity_at)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => forceLogout(sessionData.id)}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#0F1724]">Audit Logs</h2>
                  <Button variant="secondary" size="sm" onClick={exportAuditLogs}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-[#F7FAFC] rounded-lg border border-[#E2E8F0] text-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-[#0F1724]">{log.event_type}</span>
                        <Badge
                          size="sm"
                          variant={
                            log.severity === 'critical' ? 'error' :
                              log.severity === 'warning' ? 'warning' : 'info'
                          }
                        >
                          {log.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#64748B]">
                        {log.event_category} • {formatAuditLogTime(log.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0F1724]">Course Management</h2>
              <Button onClick={() => setShowCourseForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Button>
            </div>

            {/* Course Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search courses by title..."
                  className="w-full pl-10 pr-10 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0B63D6] focus:border-transparent"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                />
                {courseSearch && (
                  <button
                    onClick={() => setCourseSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B] hover:text-[#0F1724]"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="sm:w-48 relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <select
                  className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0B63D6] focus:border-transparent appearance-none bg-white"
                  value={courseDifficultyFilter}
                  onChange={(e) => setCourseDifficultyFilter(e.target.value as any)}
                >
                  <option value="all">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Course Stats and Clear Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-[#64748B]">
                <span>Total: {filteredCourses.length}</span>
                <span className="text-[#10B981]">Published: {filteredCourses.filter(c => c.is_published).length}</span>
                <span className="text-[#F59E0B]">Drafts: {filteredCourses.filter(c => !c.is_published).length}</span>
              </div>
              {(courseSearch || courseDifficultyFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCourseSearch('');
                    setCourseDifficultyFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="grid gap-4">
              {filteredCourses.length === 0 ? (
                <Card>
                  <div className="text-center py-8 text-[#64748B]">
                    {courseSearch || courseDifficultyFilter !== 'all' 
                      ? 'No courses match your search criteria.' 
                      : 'No courses available.'}
                  </div>
                </Card>
              ) : (
                filteredCourses.map((course) => (
                <Card key={course.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[#0F1724]">{course.title}</h3>
                        <Badge variant={course.is_published ? 'success' : 'warning'}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-[#64748B] mb-2">{course.description}</p>
                      <div className="flex items-center gap-4 text-sm text-[#64748B]">
                        <span>Category: {course.category || 'Uncategorized'}</span>
                        <span>Duration: {course.estimated_duration_minutes} min</span>
                        <span>Level: {course.difficulty_level}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingCourse(course);
                          setShowCourseForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteCourse(course.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0F1724]">Employee Management</h2>
              <Button onClick={() => setShowEmployeeForm(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>

            {/* Employee Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search by Employee ID or Name..."
                  className="w-full pl-10 pr-10 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0B63D6] focus:border-transparent"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                />
                {employeeSearch && (
                  <button
                    onClick={() => setEmployeeSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B] hover:text-[#0F1724]"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="sm:w-48 relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <select
                  className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0B63D6] focus:border-transparent appearance-none bg-white"
                  value={employeeRoleFilter}
                  onChange={(e) => setEmployeeRoleFilter(e.target.value as any)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            </div>

            {/* Employee Stats and Clear Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-[#64748B]">
                <span>Total: {filteredEmployees.length}</span>
                <span className="text-[#10B981]">Active: {filteredEmployees.filter(e => e.is_active).length}</span>
                <span className="text-[#EF4444]">Inactive: {filteredEmployees.filter(e => !e.is_active).length}</span>
                {employeeRoleFilter !== 'all' && (
                  <span className="text-[#3B82F6]">{employeeRoleFilter}: {filteredEmployees.filter(e => e.role === employeeRoleFilter).length}</span>
                )}
              </div>
              {(employeeSearch || employeeRoleFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEmployeeSearch('');
                    setEmployeeRoleFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="grid gap-4">
              {filteredEmployees.length === 0 ? (
                <Card>
                  <div className="text-center py-8 text-[#64748B]">
                    {employeeSearch || employeeRoleFilter !== 'all' 
                      ? 'No employees match your search criteria.' 
                      : 'No employees available.'}
                  </div>
                </Card>
              ) : (
                filteredEmployees.map((employee) => (
                <Card key={employee.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[#0F1724]">{employee.full_name}</h3>
                        <Badge variant={employee.is_active ? 'success' : 'error'}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant={employee.role === 'admin' ? 'info' : 'neutral'}>
                          {employee.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#64748B]">
                        <span>ID: {employee.emp_id}</span>
                        <span>Email: {employee.email}</span>
                        <span>Department: {employee.department || 'Not set'}</span>
                        {employee.last_login_at && (
                          <span>Last login: {formatLastLoginDate(employee.last_login_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingEmployee(employee);
                          setShowEmployeeForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {employee.is_active ? (
                        employee.id !== session?.employee.id && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => deleteEmployee(employee.id, employee.full_name)}
                            title="Deactivate Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => reactivateEmployee(employee.id, employee.full_name)}
                          title="Reactivate Employee"
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <Card className="bg-[#FEF3C7] border-[#F59E0B]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[#F59E0B] flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-[#0F1724] mb-1">Security Notice</h3>
                <p className="text-sm text-[#64748B]">
                  All administrative actions are logged and monitored. Ensure compliance with security policies
                  when managing user sessions and accessing sensitive data.
                </p>
              </div>
            </div>
          </Card>
        )}
      </main>

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-[#0F1724] mb-4">
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </h3>
            <CourseForm
              course={editingCourse}
              onSubmit={editingCourse ?
                (data) => updateCourse(editingCourse.id, data) :
                createCourse
              }
              onCancel={() => {
                setShowCourseForm(false);
                setEditingCourse(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-[#0F1724] mb-4">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h3>
            <EmployeeForm
              employee={editingEmployee}
              onSubmit={editingEmployee ?
                (data) => updateEmployee(editingEmployee.id, data) :
                createEmployee
              }
              onCancel={() => {
                setShowEmployeeForm(false);
                setEditingEmployee(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Course Form Component
function CourseForm({
  course,
  onSubmit,
  onCancel
}: {
  course?: Course | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    category: course?.category || '',
    difficulty_level: course?.difficulty_level || 'beginner',
    estimated_duration_minutes: course?.estimated_duration_minutes || 0,
    is_published: course?.is_published || false,
    display_order: course?.display_order || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Course Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-[#0F1724] mb-2">Description</label>
        <textarea
          className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0B63D6] focus:border-transparent"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <Input
        label="Category"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-[#0F1724] mb-2">Difficulty Level</label>
        <select
          className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0B63D6] focus:border-transparent"
          value={formData.difficulty_level}
          onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <Input
        label="Duration (minutes)"
        type="number"
        value={formData.estimated_duration_minutes}
        onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) || 0 })}
      />

      <Input
        label="Display Order"
        type="number"
        value={formData.display_order}
        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_published"
          checked={formData.is_published}
          onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
          className="rounded border-[#E2E8F0] text-[#0B63D6] focus:ring-[#0B63D6]"
        />
        <label htmlFor="is_published" className="text-sm font-medium text-[#0F1724]">
          Published (visible to employees)
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" fullWidth>
          {course ? 'Update Course' : 'Create Course'}
        </Button>
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Employee Form Component
function EmployeeForm({
  employee,
  onSubmit,
  onCancel
}: {
  employee?: Employee | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    emp_id: employee?.emp_id || '',
    email: employee?.email || '',
    full_name: employee?.full_name || '',
    department: employee?.department || '',
    role: employee?.role || 'employee',
    is_active: employee?.is_active ?? true,
    password: '', // Only for new employees
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee && !formData.password) {
      alert('Password is required for new employees');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Employee ID"
        value={formData.emp_id}
        onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
        required
        disabled={!!employee} // Can't change EMP_ID after creation
      />

      <Input
        label="Full Name"
        value={formData.full_name}
        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
        required
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />

      <Input
        label="Department"
        value={formData.department}
        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
      />

      {!employee && (
        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      )}

      <div>
        <label className="block text-sm font-medium text-[#0F1724] mb-2">Role</label>
        <select
          className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0B63D6] focus:border-transparent"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as 'employee' | 'admin' })}
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded border-[#E2E8F0] text-[#0B63D6] focus:ring-[#0B63D6]"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-[#0F1724]">
          Active Account
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" fullWidth>
          {employee ? 'Update Employee' : 'Create Employee'}
        </Button>
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
