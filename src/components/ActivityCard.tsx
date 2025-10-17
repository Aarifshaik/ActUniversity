import { Activity, EmployeeProgress } from '../lib/types';
import { Card } from './Card';
import { Badge } from './Badge';
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

  return (
    <Card hover onClick={onClick} className="group">
      <div className="flex gap-4">
        <div className="relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-[#F7FAFC]">
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
            <div className="absolute top-2 right-2">
              <Badge variant="error" size="sm">Required</Badge>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-semibold text-[#0F1724] group-hover:text-[#0B63D6] transition-colors line-clamp-1">
              {activity.title}
            </h3>
            <Badge
              variant={
                status === 'completed' ? 'success' :
                status === 'in_progress' ? 'info' :
                status === 'failed' ? 'error' : 'neutral'
              }
              size="sm"
            >
              {STATUS_LABELS[status]}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge
              size="sm"
              style={{
                backgroundColor: ACTIVITY_TYPE_COLORS[activity.activity_type] + '20',
                color: ACTIVITY_TYPE_COLORS[activity.activity_type]
              }}
            >
              {ACTIVITY_TYPE_LABELS[activity.activity_type]}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-[#64748B]">
              <Clock className="w-4 h-4" />
              {activity.duration_minutes} min
            </span>
          </div>

          <p className="text-sm text-[#64748B] line-clamp-3 mb-3">
            {activity.description}
          </p>

          {status !== 'not_started' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Progress</span>
                <span>{percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
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
    </Card>
  );
}
