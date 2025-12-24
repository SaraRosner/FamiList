import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import DebugPanel from '../debug/DebugPanel';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.family_id) {
      navigate('/family-setup');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-reverse space-x-8">
              <Link to="/" className="text-xl font-bold text-primary-600">
                FamiList 💙
              </Link>
              {user?.family_id && (
                <>
                  <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
                    לוח משימות
                  </Link>
                  <Link to="/reports" className="text-gray-700 hover:text-primary-600 transition-colors">
                    דוחות
                  </Link>
                  <Link to="/events" className="text-gray-700 hover:text-primary-600 transition-colors">
                    רשומות
                  </Link>
                  <Link to="/chat" className="text-gray-700 hover:text-primary-600 transition-colors">
                    צ'אטים
                  </Link>
                  <Link to="/family-events" className="text-gray-700 hover:text-primary-600 transition-colors">
                    אירועים משפחתיים
                  </Link>
                  <Link to="/calendar" className="text-gray-700 hover:text-primary-600 transition-colors">
                    יומן
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <span className="text-gray-700">שלום, {user?.name}</span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                יציאה
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <DebugPanel />
    </div>
  );
}

