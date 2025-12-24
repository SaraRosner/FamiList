import { useEffect, useState } from 'react';
import axios from 'axios';

interface EditTaskModalProps {
  task: any;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export default function EditTaskModal({ task, onClose, onTaskUpdated }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.slice(0, 10) : '');
  const [assignee, setAssignee] = useState<number | 'none'>(task.volunteer_id ?? 'none');
  const [members, setMembers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const res = await axios.get('/api/family');
      setMembers(res.data.members || []);
    } catch (e) {
      console.error('Failed to load members');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Update fields
      await axios.patch(`/api/tasks/${task.id}`, {
        title,
        description: description || null,
        priority,
        dueDate: dueDate || null,
      });

      // Reassign if changed
      const target = assignee === 'none' ? null : assignee;
      if ((task.volunteer_id ?? null) !== target) {
        await axios.post(`/api/tasks/${task.id}/reassign`, { volunteerId: target });
      }

      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בשמירת המשימה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">עריכת משימה</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">כותרת *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">תיאור</label>
            <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">עדיפות</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">נמוכה</option>
              <option value="medium">בינונית</option>
              <option value="high">דחופה</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">תאריך יעד</label>
            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">מטפל/ת</label>
            <select className="input" value={assignee as any} onChange={(e) => setAssignee(e.target.value === 'none' ? 'none' : Number(e.target.value))}>
              <option value="none">ללא (החזר למשימות ללא בעלים)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'שומר...' : 'שמור'}</button>
            <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}


