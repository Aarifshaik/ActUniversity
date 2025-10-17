import { useState, FormEvent } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { login } from '../lib/auth';
import { BookOpen, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-[#0B63D6] to-[#00A3A3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <BookOpen className="w-8 h-8 text-[#0B63D6]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Act University</h1>
          <p className="text-white/80">Enterprise Learning Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-[#0F1724] mb-6">Sign In</h2>

          {error && (
            <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#EF4444]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Employee ID"
              type="text"
              placeholder="e.g., EMP001"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E2E8F0]">
            <p className="text-sm text-[#64748B] text-center">
              Secure authentication with automatic session timeout after 30 minutes of inactivity
            </p>
          </div>
        </div>

        <p className="text-center text-white/60 text-sm mt-6">
          Protected by enterprise-grade security measures
        </p>
      </div>
    </div>
  );
}
