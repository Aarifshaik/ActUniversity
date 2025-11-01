import { Course } from '../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const difficultyVariant = {
    beginner: 'default' as const,
    intermediate: 'secondary' as const,
    advanced: 'destructive' as const,
  };

  return (
    <Card 
      className="group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" 
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden bg-muted">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/60">
            <BookOpen className="w-16 h-16 text-primary-foreground opacity-50" />
          </div>
        )}

        {course.category && (
          <div className="absolute top-3 left-3">
            <Badge variant="default">{course.category}</Badge>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <Badge variant={difficultyVariant[course.difficulty_level]}>
            {course.difficulty_level.charAt(0).toUpperCase() + course.difficulty_level.slice(1)}
          </Badge>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-3">
          {course.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{course.estimated_duration_minutes} min</span>
        </div>

        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.completed} of {progress.total} activities</span>
              <span className="font-medium">{progress.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
