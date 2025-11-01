import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Course, Activity, EmployeeProgress } from '../lib/types';
import { CourseCard } from '../components/CourseCard';
import { ActivityCard } from '../components/ActivityCard';
import { logout, getStoredSession, isAdmin } from '../lib/auth';
import { BookOpen, Search, LogOut, Trophy, Clock, TrendingUp, Settings, Home, GraduationCap, BarChart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [progress, setProgress] = useState<Map<string, EmployeeProgress>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'courses' | 'progress'>('overview');
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalTimeSpent: 0,
  });

  const session = getStoredSession();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!session?.token) return;

    try {
      const response = await fetch('/api/employee/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend API failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const { courses, recentActivities, progress, stats } = result.data;
        
        setCourses(courses);
        setRecentActivities(recentActivities);
        setStats(stats);
        
        const progressMap = new Map();
        Object.entries(progress).forEach(([key, value]) => {
          progressMap.set(key, value);
        });
        setProgress(progressMap);
      }

    } catch (error) {
      console.error('Backend API failed, using fallback:', error);
      
      try {
        const [coursesData, progressData] = await Promise.all([
          supabase
            .from('courses')
            .select('*')
            .eq('is_published', true)
            .order('display_order'),
          supabase
            .from('employee_progress')
            .select('*')
            .eq('employee_id', session.employee.id),
        ]);

        if (coursesData.data) {
          setCourses(coursesData.data);
        }

        if (progressData.data) {
          const progressMap = new Map();
          let completedCount = 0;
          let inProgressCount = 0;
          let totalTime = 0;

          progressData.data.forEach((p: EmployeeProgress) => {
            const key = `${p.course_id}-${p.activity_id || 'course'}`;
            progressMap.set(key, p);

            if (p.status === 'completed' && !p.activity_id) completedCount++;
            if (p.status === 'in_progress' && !p.activity_id) inProgressCount++;
            totalTime += p.time_spent_seconds;
          });

          setProgress(progressMap);
          setStats({
            totalCourses: coursesData.data?.length || 0,
            completedCourses: completedCount,
            inProgressCourses: inProgressCount,
            totalTimeSpent: Math.floor(totalTime / 60),
          });
        }

        const recentActivitiesData = await supabase
          .from('activities')
          .select('*, courses!inner(*)')
          .eq('courses.is_published', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (recentActivitiesData.data) {
          setRecentActivities(recentActivitiesData.data);
        }
      } catch (fallbackError) {
        console.error('Fallback data loading also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCourseProgress = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course && (course as any).progress) {
      return (course as any).progress;
    }

    const courseActivities = recentActivities.filter(a => a.course_id === courseId);
    const total = courseActivities.length;
    const completed = courseActivities.filter(a => {
      const key = `${courseId}-${a.id}`;
      return progress.get(key)?.status === 'completed';
    }).length;

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <p className="text-muted-foreground">Loading your courses...</p>
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
                <BookOpen className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Act University</span>
                <span className="text-xs text-muted-foreground">LMS</span>
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
                      onClick={() => setActiveView('overview')}
                      isActive={activeView === 'overview'}
                    >
                      <Home className="size-4" />
                      <span>Overview</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setActiveView('courses')}
                      isActive={activeView === 'courses'}
                    >
                      <GraduationCap className="size-4" />
                      <span>My Courses</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setActiveView('progress')}
                      isActive={activeView === 'progress'}
                    >
                      <BarChart className="size-4" />
                      <span>Progress</span>
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
                          {getInitials(session?.employee.full_name || 'User')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {session?.employee.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {session?.employee.emp_id}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin(session) && (
                      <>
                        <DropdownMenuItem onClick={() => {
                          const event = new CustomEvent('navigateToAdmin');
                          window.dispatchEvent(event);
                        }}>
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
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
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <div className="p-6 space-y-6">
            {activeView === 'overview' && (
              <>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Welcome back, {session?.employee.full_name?.split(' ')[0]}</h1>
                  <p className="text-muted-foreground">Track your learning progress and continue your courses</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalCourses}</div>
                      <p className="text-xs text-muted-foreground">Available to you</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.completedCourses}</div>
                      <p className="text-xs text-muted-foreground">Courses finished</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.inProgressCourses}</div>
                      <p className="text-xs text-muted-foreground">Currently learning</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Learning Time</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalTimeSpent}</div>
                      <p className="text-xs text-muted-foreground">Minutes spent</p>
                    </CardContent>
                  </Card>
                </div>

                {recentActivities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activities</CardTitle>
                      <CardDescription>Continue where you left off</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {recentActivities.slice(0, 3).map((activity) => {
                        const key = `${activity.course_id}-${activity.id}`;
                        return (
                          <ActivityCard
                            key={activity.id}
                            activity={activity}
                            progress={progress.get(key)}
                            onClick={() => {
                              const event = new CustomEvent('navigateToActivity', { 
                                detail: { activityId: activity.id } 
                              });
                              window.dispatchEvent(event);
                            }}
                          />
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {(activeView === 'courses' || activeView === 'overview') && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {activeView === 'courses' ? 'All Courses' : 'Available Courses'}
                </h2>
                {filteredCourses.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        {searchQuery ? 'No courses found matching your search' : 'No courses available yet'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.slice(0, activeView === 'overview' ? 6 : undefined).map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        progress={getCourseProgress(course.id)}
                        onClick={() => {
                          console.log('Course selected:', course.id);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeView === 'progress' && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">Your Progress</h2>
                <div className="grid gap-6">
                  {courses.map((course) => {
                    const courseProgress = getCourseProgress(course.id);
                    return (
                      <Card key={course.id}>
                        <CardHeader>
                          <CardTitle>{course.title}</CardTitle>
                          <CardDescription>{course.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{courseProgress.percentage}%</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all"
                                style={{ width: `${courseProgress.percentage}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{courseProgress.completed} of {courseProgress.total} activities completed</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
