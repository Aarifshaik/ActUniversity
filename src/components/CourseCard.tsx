import { Course } from '../lib/types';
import { Card } from './Card';
import { Badge } from './Badge';
import { Clock, BookOpen } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
  onClick?: () => void;
}

export function CourseCard({ course, progress, onClick }: CourseCardProps) {
  const difficultyColors = {
    beginner: 'success' as const,
    intermediate: 'warning' as const,
    advanced: 'error' as const,
  };

  return (
    <Card hover onClick={onClick} className="group overflow-hidden">
      <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-[#F7FAFC]">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0B63D6] to-[#00A3A3]">
            <BookOpen className="w-16 h-16 text-white opacity-50" />
          </div>
        )}

        {course.category && (
          <div className="absolute top-3 left-3">
            <Badge variant="primary" size="sm">{course.category}</Badge>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <Badge variant={difficultyColors[course.difficulty_level]} size="sm">
            {course.difficulty_level.charAt(0).toUpperCase() + course.difficulty_level.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-[#0F1724] group-hover:text-[#0B63D6] transition-colors line-clamp-2">
          {course.title}
        </h3>

        <p className="text-sm text-[#64748B] line-clamp-3">
          {course.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-[#64748B]">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {course.estimated_duration_minutes} min
          </span>
        </div>

        {progress && (
          <div className="pt-3 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
              <span>{progress.completed} of {progress.total} activities completed</span>
              <span className="font-medium">{progress.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10B981] transition-all duration-300 rounded-full"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
