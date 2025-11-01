import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Employee, Course, Session, AuditLog } from '../lib/types';
import { getStoredSession, isAdmin } from '../lib/auth';
import { formatAuditLogTime, formatSessionTime, formatLastLoginDate, formatForCSV } from '../lib/dateUtils';
import {
  Users, BookOpen, Activity, AlertTriangle, BarChart3, Download, Power, Clock,
  Plus, Edit, Trash2, Search, Filter, ArrowLeft, Shield, TrendingUp, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';

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

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseDifficultyFilter, setCourseDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const session = getStoredSession();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
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
      const response = await fetch(`/api/admin/sessions/${sessionId}/force-logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'SELF_SESSION_LOGOUT_DENIED') {
          alert('⚠️ You cannot force logout your own current session. Use the regular logout button instead.');
          return;
        }
        throw new Error(error.message || 'Failed to force logout');
      }

      const result = await response.json();
      console.log('Force logout successful:', result);

      // Reload admin data to reflect the changes
      loadAdminData();
    } catch (error) {
      console.error('Failed to force logout:', error);
      alert('Failed to force logout: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
        loadAdminData();
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
        loadAdminData();
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
        loadAdminData();
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
        setEmployees(employees.map(e =>
          e.id === employeeId
            ? { ...e, is_active: false, updated_at: new Date().toISOString() }
            : e
        ));
        loadAdminData();
      }
    } catch (error) {
      console.error('Failed to deactivate employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate employee. Please try again.';
      alert(errorMessage);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const searchMatch = employeeSearch === '' ||
      employee.emp_id.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      employee.full_name.toLowerCase().includes(employeeSearch.toLowerCase());

    const roleMatch = employeeRoleFilter === 'all' || employee.role === employeeRoleFilter;

    return searchMatch && roleMatch;
  });

  const filteredCourses = courses.filter(course => {
    const searchMatch = courseSearch === '' ||
      course.title.toLowerCase().includes(courseSearch.toLowerCase());

    const difficultyMatch = courseDifficultyFilter === 'all' || course.difficulty_level === courseDifficultyFilter;

    return searchMatch && difficultyMatch;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                <Shield className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Admin Panel</span>
                <span className="text-xs text-muted-foreground">Management</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveTab('overview')}
                      isActive={activeTab === 'overview'}
                    >
                      <BarChart3 className="size-4" />
                      <span>Overview</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveTab('courses')}
                      isActive={activeTab === 'courses'}
                    >
                      <BookOpen className="size-4" />
                      <span>Courses</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveTab('employees')}
                      isActive={activeTab === 'employees'}
                    >
                      <Users className="size-4" />
                      <span>Employees</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(session?.employee.full_name || 'Admin')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {session?.employee.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Administrator
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      const event = new CustomEvent('navigateToDashboard');
                      window.dispatchEvent(event);
                    }}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Dashboard
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">System monitoring and management</p>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <div className="p-6 space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="employees">Employees</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-l-4 border-accent-blue">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                      <div className="bg-accent-blue/10 p-2 rounded-lg">
                        <Users className="h-4 w-4 text-accent-blue" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-accent-green">{stats.activeEmployees} active</span>
                        <span className="text-muted-foreground">{stats.inactiveEmployees} inactive</span>
                      </div>
                      {stats.newEmployeesThisMonth > 0 && (
                        <p className="text-xs text-accent-blue mt-1">+{stats.newEmployeesThisMonth} this month</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-accent-purple">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                      <div className="bg-accent-purple/10 p-2 rounded-lg">
                        <BookOpen className="h-4 w-4 text-accent-purple" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalCourses}</div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-accent-green">{stats.publishedCourses} published</span>
                        <span className="text-accent-orange">{stats.draftCourses} drafts</span>
                      </div>
                      {stats.newCoursesThisMonth > 0 && (
                        <p className="text-xs text-accent-purple mt-1">+{stats.newCoursesThisMonth} this month</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-accent-green">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                      <div className="bg-accent-green/10 p-2 rounded-lg">
                        <Activity className="h-4 w-4 text-accent-green" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.activeSessions}</div>
                      <p className="text-xs text-accent-green mt-1">{stats.uniqueActiveUsers} unique users online</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-accent-cyan">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Learning Time</CardTitle>
                      <div className="bg-accent-cyan/10 p-2 rounded-lg">
                        <Clock className="h-4 w-4 text-accent-cyan" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalLearningTimeMinutes}</div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-accent-green">{stats.totalCompletions} completed</span>
                        <span className="text-accent-blue">{stats.totalInProgress} in progress</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-l-4 border-accent-red">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
                      <div className="bg-accent-red/10 p-2 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-accent-red" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.criticalEventsToday}</div>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-accent-indigo">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">System Events</CardTitle>
                      <div className="bg-accent-indigo/10 p-2 rounded-lg">
                        <Activity className="h-4 w-4 text-accent-indigo" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.recentEventsCount}</div>
                      <p className="text-xs text-muted-foreground">Recent</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-accent-teal">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Activity Rate</CardTitle>
                      <div className="bg-accent-teal/10 p-2 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-accent-teal" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.totalEmployees > 0 ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Employee engagement</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Active Sessions</CardTitle>
                        <Badge className="bg-accent-green text-accent-green-foreground">{activeSessions.length} online</Badge>
                      </div>
                      <CardDescription>Currently logged in users</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {activeSessions.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No active sessions</p>
                        ) : (
                          activeSessions.map((sessionData) => (
                            <div
                              key={sessionData.id}
                              className="flex items-center justify-between p-3 rounded-lg border"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(sessionData.employee?.full_name || 'U')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">
                                      {sessionData.employee?.full_name || 'Unknown'}
                                    </p>
                                    {sessionData.id === session?.sessionId && (
                                      <Badge className="bg-accent-blue text-accent-blue-foreground text-xs">
                                        Current
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {sessionData.employee?.emp_id}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {formatSessionTime(sessionData.last_activity_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={sessionData.id === session?.sessionId}
                                onClick={() => forceLogout(sessionData.id)}
                                title={
                                  sessionData.id === session?.sessionId
                                    ? "Cannot force logout your current session"
                                    : "Force logout this session"
                                }
                              >
                                <Power className="w-4 h-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Audit Logs</CardTitle>
                        <Button variant="outline" size="sm" onClick={exportAuditLogs}>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                      <CardDescription>Recent system events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {recentLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-3 rounded-lg border text-sm"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-medium">{log.event_type}</span>
                              <Badge
                                className={`text-xs ${
                                  log.severity === 'critical' ? 'bg-accent-red text-accent-red-foreground' :
                                    log.severity === 'warning' ? 'bg-accent-orange text-accent-orange-foreground' : 
                                    'bg-accent-blue text-accent-blue-foreground'
                                }`}
                              >
                                {log.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {log.event_category} • {formatAuditLogTime(log.created_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="courses" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Course Management</h2>
                    <p className="text-muted-foreground">Manage and organize learning content</p>
                  </div>
                  <Button className="bg-accent-purple text-accent-purple-foreground hover:bg-accent-purple/90" onClick={() => setShowCourseForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search courses by title..."
                      className="pl-9"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                    />
                  </div>
                  <Select value={courseDifficultyFilter} onValueChange={(v) => setCourseDifficultyFilter(v as any)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Total: {filteredCourses.length}</span>
                    <span className="text-accent-green">Published: {filteredCourses.filter(c => c.is_published).length}</span>
                    <span className="text-accent-orange">Drafts: {filteredCourses.filter(c => !c.is_published).length}</span>
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

                {filteredCourses.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        {courseSearch || courseDifficultyFilter !== 'all'
                          ? 'No courses match your search criteria.'
                          : 'No courses available.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCourses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{course.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {course.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20">{course.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                course.difficulty_level === 'beginner' ? 'bg-accent-green text-accent-green-foreground' :
                                  course.difficulty_level === 'intermediate' ? 'bg-accent-orange text-accent-orange-foreground' :
                                    'bg-accent-red text-accent-red-foreground'
                              }>
                                {course.difficulty_level}
                              </Badge>
                            </TableCell>
                            <TableCell>{course.estimated_duration_minutes} min</TableCell>
                            <TableCell>
                              {course.is_published ? (
                                <Badge className="bg-accent-green text-accent-green-foreground">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Published
                                </Badge>
                              ) : (
                                <Badge className="bg-accent-orange text-accent-orange-foreground">Draft</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCourse(course);
                                    setShowCourseForm(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCourse(course.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="employees" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Employee Management</h2>
                    <p className="text-muted-foreground">Manage user accounts and permissions</p>
                  </div>
                  <Button className="bg-accent-blue text-accent-blue-foreground hover:bg-accent-blue/90" onClick={() => setShowEmployeeForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employee
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by name or employee ID..."
                      className="pl-9"
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                    />
                  </div>
                  <Select value={employeeRoleFilter} onValueChange={(v) => setEmployeeRoleFilter(v as any)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Total: {filteredEmployees.length}</span>
                    <span className="text-accent-green">Active: {filteredEmployees.filter(e => e.is_active).length}</span>
                    <span className="text-accent-red">Inactive: {filteredEmployees.filter(e => !e.is_active).length}</span>
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

                {filteredEmployees.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        {employeeSearch || employeeRoleFilter !== 'all'
                          ? 'No employees match your search criteria.'
                          : 'No employees available.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(employee.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{employee.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-sm">{employee.emp_id}</code>
                            </TableCell>
                            <TableCell>
                              <Badge className={employee.role === 'admin' ? 'bg-accent-purple text-accent-purple-foreground' : 'bg-accent-indigo text-accent-indigo-foreground'}>
                                {employee.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {employee.last_login_at ? formatLastLoginDate(employee.last_login_at) : 'Never'}
                            </TableCell>
                            <TableCell>
                              {employee.is_active ? (
                                <Badge className="bg-accent-green text-accent-green-foreground">Active</Badge>
                              ) : (
                                <Badge className="bg-accent-red text-accent-red-foreground">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingEmployee(employee);
                                    setShowEmployeeForm(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteEmployee(employee.id, employee.full_name)}
                                  disabled={employee.id === session?.employee.id}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Course Form Dialog */}
      <CourseFormDialog
        open={showCourseForm}
        onOpenChange={setShowCourseForm}
        course={editingCourse}
        onSubmit={(data) => {
          if (editingCourse) {
            updateCourse(editingCourse.id, data);
          } else {
            createCourse(data);
          }
        }}
        onCancel={() => {
          setShowCourseForm(false);
          setEditingCourse(null);
        }}
      />

      {/* Employee Form Dialog */}
      <EmployeeFormDialog
        open={showEmployeeForm}
        onOpenChange={setShowEmployeeForm}
        employee={editingEmployee}
        onSubmit={(data) => {
          if (editingEmployee) {
            updateEmployee(editingEmployee.id, data);
          } else {
            createEmployee(data as any);
          }
        }}
        onCancel={() => {
          setShowEmployeeForm(false);
          setEditingEmployee(null);
        }}
      />
    </SidebarProvider>
  );
}

// Course Form Dialog Component
function CourseFormDialog({
  open,
  onOpenChange,
  course,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onSubmit: (data: Partial<Course>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Course>>({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner',
    estimated_duration_minutes: 0,
    is_published: false,
    display_order: 0,
  });

  useEffect(() => {
    if (course) {
      setFormData(course);
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        difficulty_level: 'beginner',
        estimated_duration_minutes: 0,
        is_published: false,
        display_order: 0,
      });
    }
  }, [course, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course ? 'Edit Course' : 'Add New Course'}</DialogTitle>
          <DialogDescription>
            {course ? 'Update course information' : 'Create a new course for the learning platform'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level *</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData({ ...formData, difficulty_level: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.estimated_duration_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="published" className="cursor-pointer">Publish course immediately</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {course ? 'Update Course' : 'Create Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Employee Form Dialog Component
function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSubmit: (data: Partial<Employee> & { password?: string }) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Employee> & { password?: string }>({
    emp_id: '',
    full_name: '',
    email: '',
    role: 'employee',
    is_active: true,
    password: '',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        emp_id: employee.emp_id,
        full_name: employee.full_name,
        email: employee.email,
        role: employee.role,
        is_active: employee.is_active,
      });
    } else {
      setFormData({
        emp_id: '',
        full_name: '',
        email: '',
        role: 'employee',
        is_active: true,
        password: '',
      });
    }
  }, [employee, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {employee ? 'Update employee information' : 'Create a new employee account'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emp_id">Employee ID *</Label>
            <Input
              id="emp_id"
              value={formData.emp_id}
              onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
              disabled={!!employee}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {!employee && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="is_active" className="cursor-pointer">Active account</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {employee ? 'Update Employee' : 'Create Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
