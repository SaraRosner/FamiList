import { useEffect, useState } from 'react';
import axios from 'axios';

interface Event {
  id: number;
  subject: string;
  occurred_at: string;
  severity: string;
  category?: string | null;
  description: string;
  recorder_name: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  grandfather: 'סבא',
  grandmother: 'סבתא',
};

const SUBJECT_ICONS: Record<string, string> = {
  grandfather: '👴🏻',
  grandmother: '👵🏻',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: 'קל',
  medium: 'בינוני',
  high: 'גבוה',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [months, setMonths] = useState(1);
  const [subject, setSubject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    subject: '',
    occurred_at: '',
    severity: 'medium',
    category: '',
    description: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [months, subject]);

  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { months };
      if (subject) params.subject = subject;
      const res = await axios.get('/api/events', { params });
      setEvents(res.data.events);
    } catch (err: any) {
      setError(err.response?.data?.error || 'תקלה בטעינת הרשומות');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await axios.post('/api/events', {
        subject: formData.subject,
        occurred_at: formData.occurred_at,
        severity: formData.severity,
        category: formData.category || null,
        description: formData.description,
      });
      setFormData({
        subject: '',
        occurred_at: '',
        severity: 'medium',
        category: '',
        description: '',
      });
      loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'תקלה בשמירת הרשומה');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 rounded-2xl p-8 shadow-inner border border-white/60">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">רשומות עם סבא וסבתא 💜</h1>
        <p className="text-gray-700 text-sm md:text-base">
          תיעוד רשומות עדין עוזר לנו לשים לב לשינויים קטנים בזמן. אפשר לתעד זיכרון מבולבל, רגע מתוק,
          או כל דבר שרוצים לזכור או לעקוב אחריו.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="card lg:col-span-2 bg-white/90 border border-purple-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            ✍️ תעדו רשומה חדשה
          </h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-gray-700 mb-1">על מי מדובר *</label>
              <select
                className="input"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              >
                <option value="">בחרו</option>
                <option value="grandfather">סבא</option>
                <option value="grandmother">סבתא</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">מתי קרה *</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.occurred_at}
                onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">רמת חשיבות *</label>
              <select
                className="input"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                <option value="low">נמוכה</option>
                <option value="medium">בינונית</option>
                <option value="high">גבוהה</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">קטגוריה (אופציונלי)</label>
              <input
                type="text"
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="לדוגמה: בלבול, שכחה, נפילה..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">תיאור *</label>
              <textarea
                className="input"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full shadow hover:shadow-md" disabled={saving}>
              {saving ? 'שומר...' : 'שמור רשומה'}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-3 bg-white/90 border border-orange-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🎯 סינון רשומות
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">כמה זמן אחורה?</label>
              <select className="input" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                <option value={1}>חודש אחרון</option>
                <option value={3}>3 חודשים</option>
                <option value={6}>6 חודשים</option>
                <option value={12}>שנה</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">על מי?</label>
              <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">כולם</option>
                <option value="grandfather">סבא</option>
                <option value="grandmother">סבתא</option>
              </select>
            </div>

            <button onClick={loadEvents} className="btn-secondary w-full">
              רענן רשימה
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-white/95 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">רשומות אחרונות</h2>
            <p className="text-sm text-gray-500">מסודרים לפי סדר כרונולוגי יורד</p>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8">טוען רשומות...</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500 text-center py-8">אין רשומות בטווח הזמן שנבחר.</div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="border rounded-xl p-4 bg-gradient-to-r from-white to-gray-50">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{SUBJECT_ICONS[event.subject] || '👨‍👩‍👧'}</span>
                    {SUBJECT_LABELS[event.subject] || event.subject} · {formatDate(event.occurred_at)}
                  </span>
                  <span className={`text-xs px-3 py-0.5 rounded-full border ${SEVERITY_COLORS[event.severity] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {SEVERITY_LABELS[event.severity] || event.severity}
                  </span>
                </div>
                <div className="font-semibold text-purple-700 text-sm mb-1">{event.category || 'רשומה כללית'}</div>
                <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{event.description}</p>
                <div className="text-xs text-gray-400 mt-3 border-t pt-2">
                  תועד על ידי {event.recorder_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


