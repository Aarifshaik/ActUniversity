import { Activity, EmployeeProgress } from '../lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS, STATUS_COLORS, STATUS_LABELS } from '../lib/constants';
import { Clock, PlayCircle, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  progress?: EmployeeProgress;
  onClick?: () => void;
}

export function ActivityCard({ activity, progress, onClick }: ActivityCardProps) {
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'video':
        return <PlayCircle className="w-5 h-5" />;
      case 'ppt':
      case 'article':
        return <FileText className="w-5 h-5" />;
      case 'quiz':
        return <AlertCircle className="w-5 h-5" />;
      case 'declaration':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const status = progress?.status || 'not_started';
  const percentage = progress?.progress_percentage || 0;

  const statusVariant = {
    completed: 'default' as const,
    in_progress: 'secondary' as const,
    failed: 'destructive' as const,
    not_started: 'outline' as const,
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-md transition-shadow" 
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
            {activity.thumbnail_url ? (
              <img
                src={activity.thumbnail_url}
                alt={activity.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: ACTIVITY_TYPE_COLORS[activity.activity_type] + '20' }}
              >
                <div style={{ color: ACTIVITY_TYPE_COLORS[activity.activity_type] }}>
                  {getActivityIcon()}
                </div>
              </div>
            )}

            {activity.is_mandatory && (
              <div className="absolute top-1 right-1">
                <Badge variant="destructive" className="text-xs">Required</Badge>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-1">
                {activity.title}
              </h3>
              <Badge variant={statusVariant[status]} className="text-xs">
                {STATUS_LABELS[status]}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  backgroundColor: ACTIVITY_TYPE_COLORS[activity.activity_type] + '20',
                  color: ACTIVITY_TYPE_COLORS[activity.activity_type],
                  borderColor: ACTIVITY_TYPE_COLORS[activity.activity_type] + '40'
                }}
              >
                {ACTIVITY_TYPE_LABELS[activity.activity_type]}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {activity.duration_minutes} min
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {activity.description}
            </p>

            {status !== 'not_started' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: STATUS_COLORS[status]
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
