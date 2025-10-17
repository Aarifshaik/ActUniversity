import { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ActivityPlayer } from './pages/ActivityPlayer';
import { getStoredSession, validateSession, isAdmin } from './lib/auth';
import { setupCSP, preventDevTools, preventScreenCapture, detectAutomation } from './lib/security';

type Page = 'login' | 'dashboard' | 'admin' | 'activity';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupCSP();
    preventDevTools();
    preventScreenCapture();

    if (detectAutomation()) {
      console.warn('Automated access detected and logged');
    }

    checkAuth();
  }, []);

  const checkAuth = async () => {
    const session = getStoredSession();

    if (session) {
      const valid = await validateSession();
      if (valid) {
        setIsAuthenticated(true);
        setCurrentPage('dashboard');
      }
    }

    setLoading(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const navigateTo = (page: Page, activityId?: string) => {
    if (page === 'activity' && activityId) {
      setSelectedActivityId(activityId);
    }
    setCurrentPage(page);
  };

  // Handle navigation events
  useEffect(() => {
    const handleAdminNavigation = () => {
      const session = getStoredSession();
      if (session && isAdmin(session)) {
        setCurrentPage('admin');
      }
    };

    const handleDashboardNavigation = () => {
      setCurrentPage('dashboard');
    };

    const handleActivityNavigation = (event: CustomEvent) => {
      const { activityId } = event.detail;
      navigateTo('activity', activityId);
    };

    window.addEventListener('navigateToAdmin', handleAdminNavigation);
    window.addEventListener('navigateToDashboard', handleDashboardNavigation);
    window.addEventListener('navigateToActivity', handleActivityNavigation as EventListener);
    
    return () => {
      window.removeEventListener('navigateToAdmin', handleAdminNavigation);
      window.removeEventListener('navigateToDashboard', handleDashboardNavigation);
      window.removeEventListener('navigateToActivity', handleActivityNavigation as EventListener);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B63D6] mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading Act University...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPage === 'admin') {
    return <AdminDashboard />;
  }

  if (currentPage === 'activity' && selectedActivityId) {
    return (
      <ActivityPlayer
        activityId={selectedActivityId}
        onBack={() => navigateTo('dashboard')}
      />
    );
  }

  return <Dashboard />;
}

export default App;
