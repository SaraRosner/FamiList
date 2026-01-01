import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface Event {
  id: number;
  subject: string;
  occurred_at: string;
  severity: string;
  category?: string | null;
  description: string;
  recorder_name: string;
}

const SUBJECT_ICONS: Record<string, string> = {
  grandfather: '👴🏻',
  grandmother: '👵🏻',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

export default function Events() {
  const { t, language } = useLanguage();
  const { loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [months, setMonths] = useState(1);
  const [subject, setSubject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getSubjectLabel = (subject: string) => {
    return t(`events.${subject}`) || subject;
  };

  const getSeverityLabel = (severity: string) => {
    const key = severity === 'low' ? 'severityLow' : severity === 'medium' ? 'severityMedium' : 'severityHigh';
    return t(`events.${key}`) || severity;
  };

  const [formData, setFormData] = useState({
    subject: '',
    occurred_at: '',
    severity: 'medium',
    category: '',
    description: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      loadEvents();
    }
  }, [months, subject, authLoading]);

  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { months };
      if (subject) params.subject = subject;
      const res = await axios.get('/api/events', { params });
      setEvents(res.data.events);
    } catch (err: any) {
      setError(err.response?.data?.error || t('events.errorLoading'));
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
      setError(err.response?.data?.error || t('events.errorSaving'));
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
    <div className="space-y-6" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 rounded-2xl p-8 shadow-inner border border-white/60">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('events.title')}</h1>
        <p className="text-gray-700 text-sm md:text-base">
          {t('events.subtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="card lg:col-span-2 bg-white/90 border border-purple-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            ✍️ {t('events.createRecord')}
          </h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('events.aboutWho')} *</label>
              <select
                className="input"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              >
                <option value="">{t('events.select')}</option>
                <option value="grandfather">{t('events.grandfather')}</option>
                <option value="grandmother">{t('events.grandmother')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('events.whenOccurred')} *</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.occurred_at}
                onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('events.severity')} *</label>
              <select
                className="input"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                <option value="low">{t('events.severityLow')}</option>
                <option value="medium">{t('events.severityMedium')}</option>
                <option value="high">{t('events.severityHigh')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('events.category')}</label>
              <input
                type="text"
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder={t('events.categoryPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('events.description')} *</label>
              <textarea
                className="input"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full shadow hover:shadow-md" disabled={saving}>
              {saving ? t('events.saving') : t('events.save')}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-3 bg-white/90 border border-orange-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🎯 {t('events.filter')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('events.howLongAgo')}</label>
              <select className="input" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                <option value={1}>{t('events.lastMonth')}</option>
                <option value={3}>{t('events.threeMonths')}</option>
                <option value={6}>{t('events.sixMonths')}</option>
                <option value={12}>{t('events.year')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('events.who')}</label>
              <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">{t('events.all')}</option>
                <option value="grandfather">{t('events.grandfather')}</option>
                <option value="grandmother">{t('events.grandmother')}</option>
              </select>
            </div>

            <button onClick={loadEvents} className="btn-secondary w-full">
              {t('events.refresh')}
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-white/95 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{t('events.recentRecords')}</h2>
            <p className="text-sm text-gray-500">{t('events.sortedChronological')}</p>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8">{t('events.loading')}</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500 text-center py-8">{t('events.noRecords')}</div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="border rounded-xl p-4 bg-gradient-to-r from-white to-gray-50">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{SUBJECT_ICONS[event.subject] || '👨‍👩‍👧'}</span>
                    {getSubjectLabel(event.subject)} · {formatDate(event.occurred_at)}
                  </span>
                  <span className={`text-xs px-3 py-0.5 rounded-full border ${SEVERITY_COLORS[event.severity] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {getSeverityLabel(event.severity)}
                  </span>
                </div>
                <div className="font-semibold text-purple-700 text-sm mb-1">{event.category || t('events.generalRecord')}</div>
                <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{event.description}</p>
                <div className="text-xs text-gray-400 mt-3 border-t pt-2">
                  {t('events.recordedBy')} {event.recorder_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


