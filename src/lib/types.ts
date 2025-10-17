export interface Employee {
  id: string;
  emp_id: string;
  email: string;
  full_name: string;
  department: string;
  role: 'employee' | 'admin';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  is_published: boolean;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Optional progress data when fetched for employee dashboard
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export type ActivityType = 'ppt' | 'video' | 'quiz' | 'declaration' | 'article';

export interface Activity {
  id: string;
  course_id: string;
  title: string;
  description: string;
  activity_type: ActivityType;
  content_url: string;
  thumbnail_url: string;
  duration_minutes: number;
  display_order: number;
  is_mandatory: boolean;
  passing_score: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmployeeProgress {
  id: string;
  employee_id: string;
  course_id: string;
  activity_id: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progress_percentage: number;
  score: number | null;
  time_spent_seconds: number;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  employee_id: string;
  session_token: string;
  ip_address: string;
  user_agent: string;
  last_activity_at: string;
  expires_at: string;
  is_active: boolean;
  logout_reason: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  employee_id: string | null;
  session_id: string | null;
  event_type: string;
  event_category: 'authentication' | 'content' | 'security' | 'admin';
  resource_type: string | null;
  resource_id: string | null;
  action_details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  activity_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'multi_select';
  options: any[];
  correct_answer: any;
  points: number;
  display_order: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  employee_id: string;
  activity_id: string;
  session_id: string;
  answers: Record<string, any>;
  score: number;
  total_possible: number;
  passed: boolean;
  time_taken_seconds: number;
  submitted_at: string;
}
