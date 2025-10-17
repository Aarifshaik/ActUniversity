import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity } from '../lib/types';
import { getStoredSession } from '../lib/auth';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ArrowLeft, CheckCircle, AlertCircle, FileText, PlayCircle } from 'lucide-react';

interface ActivityPlayerProps {
  activityId: string;
  onBack: () => void;
}

export function ActivityPlayer({ activityId, onBack }: ActivityPlayerProps) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [watermark, setWatermark] = useState('');

  const session = getStoredSession();

  useEffect(() => {
    loadActivity();
    generateWatermark();
  }, [activityId]);

  const loadActivity = async () => {
    try {
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (data) {
        setActivity(data);
        await logContentAccess(data);
      }
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWatermark = () => {
    if (!session) return;

    const timestamp = new Date().toISOString();
    const watermarkText = `${session.employee.emp_id} | ${timestamp} | ${session.sessionId.slice(0, 8)}`;
    setWatermark(watermarkText);
  };

  const logContentAccess = async (activity: Activity) => {
    if (!session) return;

    try {
      await supabase.from('content_access_logs').insert({
        employee_id: session.employee.id,
        activity_id: activity.id,
        session_id: session.sessionId,
        access_type: activity.activity_type === 'video' ? 'stream_start' : 'slide_view',
        watermark_data: watermark,
        ip_address: '',
      });

      await supabase.from('audit_logs').insert({
        employee_id: session.employee.id,
        session_id: session.sessionId,
        event_type: 'content_view',
        event_category: 'content',
        resource_type: 'activity',
        resource_id: activity.id,
        action_details: { activity_type: activity.activity_type },
        ip_address: '',
        user_agent: navigator.userAgent,
        severity: 'info',
      });
    } catch (error) {
      console.error('Failed to log content access:', error);
    }
  };

  const updateProgress = async (percentage: number, status: string = 'in_progress') => {
    if (!session || !activity) return;

    try {
      await supabase.from('employee_progress').upsert({
        employee_id: session.employee.id,
        course_id: activity.course_id,
        activity_id: activity.id,
        status,
        progress_percentage: percentage,
        last_accessed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleComplete = async () => {
    await updateProgress(100, 'completed');
    onBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B63D6] mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <Card className="text-center max-w-md p-8">
          <AlertCircle className="w-16 h-16 text-[#EF4444] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#0F1724] mb-2">Content Not Found</h2>
          <p className="text-[#64748B] mb-6">The requested content could not be loaded.</p>
          <Button onClick={onBack}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
            <Badge variant="info" className="text-xs font-mono">
              {watermark}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0F1724] mb-2">{activity.title}</h1>
          <p className="text-[#64748B]">{activity.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card padding="none" className="overflow-hidden">
              {activity.activity_type === 'video' && (
                <VideoPlayer activity={activity} watermark={watermark} onProgress={updateProgress} />
              )}
              {activity.activity_type === 'ppt' && (
                <PresentationViewer activity={activity} watermark={watermark} onProgress={updateProgress} />
              )}
              {activity.activity_type === 'article' && (
                <ArticleViewer activity={activity} onProgress={updateProgress} />
              )}
              {activity.activity_type === 'declaration' && (
                <DeclarationViewer activity={activity} onComplete={handleComplete} />
              )}
              {activity.activity_type === 'quiz' && (
                <QuizViewer activityId={activity.id} onComplete={handleComplete} />
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-[#0F1724] mb-4">Activity Details</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[#64748B]">Type</dt>
                  <dd className="text-[#0F1724] font-medium capitalize">{activity.activity_type}</dd>
                </div>
                <div>
                  <dt className="text-[#64748B]">Duration</dt>
                  <dd className="text-[#0F1724] font-medium">{activity.duration_minutes} minutes</dd>
                </div>
                {activity.is_mandatory && (
                  <div>
                    <dt className="text-[#64748B]">Status</dt>
                    <dd><Badge variant="error">Required</Badge></dd>
                  </div>
                )}
              </dl>
            </Card>

            <Card className="bg-[#F7FAFC]">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-[#0F1724] mb-1">Security Notice</p>
                  <p className="text-[#64748B]">
                    This content is protected and monitored. All access is logged for security purposes.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function VideoPlayer({ activity, watermark, onProgress }: { activity: Activity; watermark: string; onProgress: (p: number) => void }) {
  return (
    <div className="relative bg-black aspect-video">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Secure Video Player</p>
          <p className="text-sm opacity-75">
            DRM-protected streaming will be initialized here
          </p>
          <p className="text-xs opacity-50 mt-4 font-mono">{watermark}</p>
        </div>
      </div>
    </div>
  );
}

function PresentationViewer({ activity, watermark, onProgress }: { activity: Activity; watermark: string; onProgress: (p: number) => void }) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = activity.metadata?.slides_count || 10;

  const handleNext = () => {
    const next = Math.min(currentSlide + 1, totalSlides);
    setCurrentSlide(next);
    onProgress(Math.round((next / totalSlides) * 100));
  };

  const handlePrev = () => {
    setCurrentSlide(Math.max(currentSlide - 1, 1));
  };

  return (
    <div className="bg-[#F7FAFC] aspect-video relative">
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
        <FileText className="w-16 h-16 text-[#0B63D6] mb-4 opacity-50" />
        <p className="text-lg font-medium text-[#0F1724] mb-2">Presentation Slide {currentSlide} of {totalSlides}</p>
        <p className="text-sm text-[#64748B] mb-8">
          Server-rendered slides with watermarking will appear here
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handlePrev} disabled={currentSlide === 1}>
            Previous
          </Button>
          <Button onClick={handleNext} disabled={currentSlide === totalSlides}>
            Next
          </Button>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 text-xs text-[#64748B] font-mono bg-white/90 px-2 py-1 rounded">
        {watermark}
      </div>
    </div>
  );
}

function ArticleViewer({ activity, onProgress }: { activity: Activity; onProgress: (p: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onProgress(100), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-8">
      <div className="prose max-w-none">
        <h2 className="text-2xl font-bold text-[#0F1724] mb-4">Article Content</h2>
        <p className="text-[#64748B]">
          Rich article content with text, images, and embedded media will be displayed here.
          Content is securely delivered and monitored.
        </p>
      </div>
    </div>
  );
}

function DeclarationViewer({ activity, onComplete }: { activity: Activity; onComplete: () => void }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#0F1724] mb-4">Declaration</h2>
        <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-lg p-6">
          <p className="text-[#0F1724]">
            I acknowledge that I have read and understood the content presented in this activity.
            I agree to comply with all policies and procedures outlined.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <input
          type="checkbox"
          id="agree"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 w-5 h-5 text-[#0B63D6] rounded focus:ring-[#0B63D6]"
        />
        <label htmlFor="agree" className="text-[#0F1724] cursor-pointer">
          I have read and agree to the above declaration
        </label>
      </div>

      <Button onClick={onComplete} disabled={!agreed} size="lg">
        <CheckCircle className="w-5 h-5 mr-2" />
        Submit Declaration
      </Button>
    </div>
  );
}

function QuizViewer({ activityId, onComplete }: { activityId: string; onComplete: () => void }) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-[#0F1724] mb-6">Quiz</h2>
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-[#0B63D6] mx-auto mb-4 opacity-50" />
        <p className="text-[#64748B] mb-6">
          Interactive quiz interface with questions, options, and instant feedback will be displayed here
        </p>
        <Button onClick={onComplete}>Complete Quiz</Button>
      </div>
    </div>
  );
}
