import { useState, FormEvent } from 'react';
import { login } from '../lib/auth';
import { BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

interface LoginProps {
  onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!empId || !password) {
      setError('Please enter both Employee ID and password');
      return;
    }

    setLoading(true);

    const result = await login(empId, password);

    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-between items-center">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <BookOpen className="size-5" />
            </div>
            <span className="text-xl font-bold">Act University</span>
          </a>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Login to your account</CardTitle>
                <CardDescription>
                  Enter your Employee ID and password to access the learning platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="empId">Employee ID</Label>
                    <Input
                      id="empId"
                      type="text"
                      placeholder="e.g., EMP001"
                      value={empId}
                      onChange={(e) => setEmpId(e.target.value)}
                      disabled={loading}
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    Secure authentication with automatic session timeout after 30 minutes of inactivity
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block bg-muted">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        <div className="relative h-full flex flex-col items-center justify-center p-10 text-center">
          <BookOpen className="w-24 h-24 text-primary mb-6" />
          <h2 className="text-3xl font-bold mb-4">Enterprise Learning Management System</h2>
          <p className="text-lg text-muted-foreground max-w-md">
            Access your personalized learning journey and track your progress across all courses
          </p>
          <div className="mt-8 text-sm text-muted-foreground">
            Protected by enterprise-grade security measures
          </div>
        </div>
      </div>
    </div>
  );
}
