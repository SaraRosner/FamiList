import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Family {
  id: number;
  name: string;
}

export default function FamilySetup() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [familyName, setFamilyName] = useState('');
  const [families, setFamilies] = useState<Family[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, updateUser, updateToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.family_id) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (mode === 'join') {
      loadFamilies();
    }
  }, [mode]);

  const loadFamilies = async () => {
    try {
      const response = await axios.get('/api/family/list');
      setFamilies(response.data.families);
    } catch (err) {
      console.error('Failed to load families:', err);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/family/create', { name: familyName });
      updateUser(response.data.user);
      updateToken(response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה ביצירת משפחה');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async (familyId: number) => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`/api/family/join/${familyId}`);
      updateUser(response.data.user);
      updateToken(response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בהצטרפות למשפחה');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ברוכים הבאים ל-FamiList!</h1>
            <p className="text-gray-600">בואו נתחיל בהקמת המשפחה שלכם</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setMode('create')}
              className="card hover:shadow-lg transition-shadow text-right p-8"
            >
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h2 className="text-2xl font-bold mb-2">צור משפחה חדשה</h2>
              <p className="text-gray-600">
                אתה האדם הראשון מהמשפחה? צור משפחה חדשה והזמן אחרים להצטרף.
              </p>
            </button>

            <button
              onClick={() => setMode('join')}
              className="card hover:shadow-lg transition-shadow text-right p-8"
            >
              <div className="text-4xl mb-4">🤝</div>
              <h2 className="text-2xl font-bold mb-2">הצטרף למשפחה קיימת</h2>
              <p className="text-gray-600">
                המשפחה שלך כבר קיימת במערכת? הצטרף אליה כדי לתאם את הטיפול יחד.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <button
            onClick={() => setMode('choose')}
            className="text-primary-600 hover:text-primary-700 mb-4"
          >
            ← חזור
          </button>

          <div className="card">
            <h2 className="text-2xl font-bold text-center mb-6">צור משפחה חדשה</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">שם המשפחה</label>
                <input
                  type="text"
                  className="input"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  required
                  placeholder='לדוגמה: "משפחת כהן"'
                />
                <p className="text-sm text-gray-500 mt-1">
                  זה השם שכל בני המשפחה יראו
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'יוצר...' : 'צור משפחה'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full">
        <button
          onClick={() => setMode('choose')}
          className="text-primary-600 hover:text-primary-700 mb-4"
        >
          ← חזור
        </button>

        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-6">הצטרף למשפחה</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {families.length === 0 ? (
            <p className="text-center text-gray-600">אין משפחות זמינות להצטרפות כרגע</p>
          ) : (
            <div className="space-y-3">
              {families.map((family) => (
                <button
                  key={family.id}
                  onClick={() => handleJoinFamily(family.id)}
                  disabled={loading}
                  className="w-full text-right p-4 border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-lg">{family.name}</div>
                  <div className="text-sm text-gray-500">לחץ כדי להצטרף</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

