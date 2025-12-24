import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

interface FamilyEvent {
  id: number;
  family_id: number;
  created_by: number;
  created_by_name: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export default function FamilyEvents() {
  const { t, language } = useLanguage();
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await axios.get('/api/family-events');
      setEvents(res.data.events);
    } catch (err: any) {
      setError(err.response?.data?.error || t('familyEvents.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const startDateTime = new Date(`${formData.start_date}T${formData.start_time || '00:00'}`);
    const endDateTime = formData.end_date
      ? new Date(`${formData.end_date}T${formData.end_time || '00:00'}`)
      : null;

    try {
      await axios.post('/api/family-events', {
        title: formData.title,
        description: formData.description || null,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime?.toISOString() || null,
      });
      setFormData({
        title: '',
        description: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
      });
      setShowCreateModal(false);
      loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || t('familyEvents.errorCreate'));
    }
  };

  const handleEditEvent = (event: FamilyEvent) => {
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : null;
    
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_date: startDate.toISOString().split('T')[0],
      start_time: startDate.toTimeString().slice(0, 5),
      end_date: endDate ? endDate.toISOString().split('T')[0] : '',
      end_time: endDate ? endDate.toTimeString().slice(0, 5) : '',
    });
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setError('');

    const startDateTime = new Date(`${formData.start_date}T${formData.start_time || '00:00'}`);
    const endDateTime = formData.end_date
      ? new Date(`${formData.end_date}T${formData.end_time || '00:00'}`)
      : null;

    try {
      await axios.put(`/api/family-events/${editingEvent.id}`, {
        title: formData.title,
        description: formData.description || null,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime?.toISOString() || null,
      });
      setShowEditModal(false);
      setEditingEvent(null);
      loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || t('familyEvents.errorUpdate'));
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm(t('familyEvents.deleteConfirm'))) return;

    try {
      await axios.delete(`/api/family-events/${id}`);
      loadEvents();
    } catch (err: any) {
      setError(err.response?.data?.error || t('familyEvents.errorDelete'));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('familyEvents.title')}</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span>+ {t('familyEvents.addEvent')}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card bg-white">
        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">{t('familyEvents.noEvents')}</p>
            <p className="text-sm">{t('familyEvents.noEventsHint')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                      <span className="text-sm text-gray-500">
                        {formatDateShort(event.start_date)}
                        {event.end_date && ` - ${formatDateShort(event.end_date)}`}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-gray-700 mb-2">{event.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {t('familyEvents.createdBy')} {event.created_by_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="text-primary-600 hover:text-primary-700 text-sm underline"
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 hover:text-red-700 text-sm underline"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('familyEvents.createModal')}</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familyEvents.titleLabel')} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familyEvents.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familyEvents.startDate')} *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familyEvents.startTime')}
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familyEvents.endDate')}
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input w-full"
                />
              </div>
              {formData.end_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('familyEvents.endTime')}
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="input w-full"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      title: '',
                      description: '',
                      start_date: '',
                      start_time: '',
                      end_date: '',
                      end_time: '',
                    });
                  }}
                  className="btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('familyEvents.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('familyEvents.editModal')}</h2>
            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familyEvents.titleLabel')} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familyEvents.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familyEvents.startDate')} *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familyEvents.startTime')}
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familyEvents.endDate')}
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input w-full"
                />
              </div>
              {formData.end_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('familyEvents.endTime')}
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="input w-full"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEvent(null);
                  }}
                  className="btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('familyEvents.update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

