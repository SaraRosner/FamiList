import { useState } from 'react';
import axios from 'axios';

interface CreateTaskModalProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

export default function CreateTaskModal({ onClose, onTaskCreated }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/tasks', {
        title,
        description: description || null,
        priority,
        dueDate: dueDate || null,
      });
      onTaskCreated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה ביצירת משימה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">משימה חדשה</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">כותרת *</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder='לדוגמה: "ביקור אצל הרופא"'
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">תיאור</label>
            <textarea
              className="input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פרטים נוספים על המשימה..."
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">עדיפות</label>
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">נמוכה</option>
              <option value="medium">בינונית</option>
              <option value="high">דחופה</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">תאריך יעד (אופציונלי)</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'יוצר...' : 'צור משימה'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

