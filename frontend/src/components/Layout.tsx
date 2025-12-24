import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import DebugPanel from '../debug/DebugPanel';
import { useLanguage } from '../context/LanguageContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();

  useEffect(() => {
    if (user && !user.family_id) {
      navigate('/family-setup');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-primary-600">
                FamiList 💙
              </Link>
              {user?.family_id && (
                <>
                  <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {t('nav.taskBoard')}
                  </Link>
                  <Link to="/reports" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {t('nav.reports')}
                  </Link>
                  <Link to="/events" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {t('nav.records')}
                  </Link>
                  <Link to="/chat" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {t('nav.chat')}
                  </Link>
                  <Link to="/family-events" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {t('nav.familyEvents')}
                  </Link>
                  <Link to="/calendar" className="text-gray-700 hover:text-primary-600 transition-colors">
                    {t('nav.calendar')}
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="he">עברית</option>
                <option value="en">English</option>
              </select>
              <span className="text-gray-700">{t('common.hello')}, {user?.name}</span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                {t('nav.logout')}
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

