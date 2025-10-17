import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Course, Activity, EmployeeProgress } from '../lib/types';
import { CourseCard } from '../components/CourseCard';
import { ActivityCard } from '../components/ActivityCard';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

import { logout, getStoredSession, isAdmin } from '../lib/auth';
import { BookOpen, Search, LogOut, User, Trophy, Clock, TrendingUp, Settings } from 'lucide-react';
// import { DebugPanel } from '../components/DebugPanel';

export function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [progress, setProgress] = useState<Map<string, EmployeeProgress>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
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

    console.log('🔄 Loading dashboard data...');

    try {
      // Fetch dashboard data from backend API
      const response = await fetch('/api/employee/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Backend API response status:', response.status);

      if (!response.ok) {
        throw new Error(`Backend API failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 Backend API result:', result);

      if (result.success) {
        const { courses, recentActivities, progress, stats } = result.data;
        
        console.log('📚 Courses from backend:', courses.length);
        console.log('🎯 Activities from backend:', recentActivities.length);
        
        setCourses(courses);
        setRecentActivities(recentActivities);
        setStats(stats);
        
        // Convert progress object back to Map
        const progressMap = new Map();
        Object.entries(progress).forEach(([key, value]) => {
          progressMap.set(key, value);
        });
        setProgress(progressMap);
      }

    } catch (error) {
      console.error('❌ Backend API failed, using fallback:', error);
      
      // Fallback to direct Supabase queries if backend fails
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
          console.log('📚 Fallback courses from Supabase:', coursesData.data.length);
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
    // Find the course in our courses array (which now includes progress from backend)
    const course = courses.find(c => c.id === courseId);
    if (course && (course as any).progress) {
      return (course as any).progress;
    }

    // Fallback calculation if progress not provided by backend
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B63D6] mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-[#0B63D6] rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0F1724]">Act University</h1>
                <p className="text-sm text-[#64748B]">Learning Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-[#F7FAFC] rounded-lg">
                <User className="w-5 h-5 text-[#64748B]" />
                <div className="text-sm">
                  <p className="font-medium text-[#0F1724]">{session?.employee.full_name}</p>
                  <p className="text-[#64748B]">{session?.employee.emp_id}</p>
                </div>
              </div>
              {isAdmin(session) && (
                <Button variant="secondary" onClick={() => {
                  // Trigger navigation to admin dashboard
                  const event = new CustomEvent('navigateToAdmin');
                  window.dispatchEvent(event);
                }}>
                  <Settings className="w-5 h-5 mr-2" />
                  Admin Panel
                </Button>
              )}
              <Button variant="ghost" onClick={() => logout()}>
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-[#0B63D6]" />
            </div>
            <p className="text-3xl font-bold text-[#0F1724] mb-1">{stats.totalCourses}</p>
            <p className="text-sm text-[#64748B]">Total Courses</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 text-[#10B981]" />
            </div>
            <p className="text-3xl font-bold text-[#0F1724] mb-1">{stats.completedCourses}</p>
            <p className="text-sm text-[#64748B]">Completed</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-[#3B82F6]" />
            </div>
            <p className="text-3xl font-bold text-[#0F1724] mb-1">{stats.inProgressCourses}</p>
            <p className="text-sm text-[#64748B]">In Progress</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-[#F59E0B]" />
            </div>
            <p className="text-3xl font-bold text-[#0F1724] mb-1">{stats.totalTimeSpent}</p>
            <p className="text-sm text-[#64748B]">Minutes Learned</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
            <Input
              type="text"
              placeholder="Search courses by title, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[#0F1724] mb-6">Available Courses</h2>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
              <BookOpen className="w-16 h-16 text-[#64748B] mx-auto mb-4 opacity-50" />
              <p className="text-[#64748B]">
                {searchQuery ? 'No courses found matching your search' : 'No courses available yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  progress={getCourseProgress(course.id)}
                  onClick={() => {
                    // For now, just log the course selection
                    console.log('Course selected:', course.id);
                    // TODO: Implement course navigation
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {recentActivities.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-[#0F1724] mb-6">Recent Activities</h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
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
            </div>
          </section>
        )}
      </main>
      
      {/* Debug panel - remove in production */}
      {/* <DebugPanel /> */}
    </div>
  );
}
