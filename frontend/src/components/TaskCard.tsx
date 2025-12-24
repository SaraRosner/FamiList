import { useState } from 'react';
import axios from 'axios';
import EditTaskModal from './EditTaskModal';
import { useLanguage } from '../context/LanguageContext';

interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  volunteer_id: number | null;
  volunteer_name: string | null;
  creator_name: string;
  due_date: string | null;
  created_at?: string;
}

interface TaskCardProps {
  task: Task;
  userId: number;
  onUpdate: () => void;
  readonly?: boolean;
}

export default function TaskCard({ task, userId, onUpdate, readonly = false }: TaskCardProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const getPriorityLabel = (priority: string) => {
    return t(`taskCard.priority.${priority}`) || priority;
  };


  const handleVolunteer = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/tasks/${task.id}/volunteer`);
      onUpdate();
    } catch (error) {
      console.error('Failed to volunteer:', error);
      alert('שגיאה בהתנדבות למשימה');
    } finally {
      setLoading(false);
    }
  };

  const handleUnvolunteer = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/tasks/${task.id}/unvolunteer`);
      onUpdate();
    } catch (error) {
      console.error('Failed to unvolunteer:', error);
      alert('שגיאה בביטול התנדבות');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/tasks/${task.id}/complete`);
      onUpdate();
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('שגיאה בסיום משימה');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">{task.title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="text-xs text-gray-600 hover:text-primary-700 underline"
          >
            {t('common.edit')}
          </button>
          <span className={`text-xs px-2 py-1 rounded ${priorityColors[task.priority]}`}>
            {getPriorityLabel(task.priority)}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
      )}

      <div className="text-xs text-gray-500 space-y-1 mb-3">
        <div>
          {t('taskCard.createdBy')} {task.creator_name}
          {task.created_at ? ` ${t('taskCard.onDate')} ${formatDate(task.created_at)}` : ''}
        </div>
        {task.volunteer_name && (
          <div>{t('taskCard.volunteer')}: {task.volunteer_name}</div>
        )}
        {task.due_date && (
          <div>{t('taskCard.dueDate')}: {formatDate(task.due_date)}</div>
        )}
      </div>

      {!readonly && (
        <div className="flex gap-2">
          {task.status === 'unclaimed' && (
              <button
                onClick={handleVolunteer}
                disabled={loading}
                className="btn-primary text-sm flex-1"
              >
                {t('taskCard.takeTask')} 💪
              </button>
          )}

          {task.status === 'in_progress' && task.volunteer_id === userId && (
            <>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="btn-primary text-sm flex-1"
              >
                ✓ {t('taskCard.completed')}
              </button>
              <button
                onClick={handleUnvolunteer}
                disabled={loading}
                className="btn-secondary text-sm"
              >
                {t('taskCard.cancel')}
              </button>
            </>
          )}
        </div>
      )}

      {readonly && task.volunteer_name && (
        <div
          className={`text-sm font-medium ${
            task.status === 'completed' ? 'text-green-700' : 'text-purple-700'
          }`}
        >
          {task.status === 'completed'
            ? `✓ ${t('taskCard.completedBy')} ${task.volunteer_name}`
            : `${t('taskCard.handledBy')} ${task.volunteer_name}`}
        </div>
      )}

      {showEdit && (
        <EditTaskModal
          task={task}
          onClose={() => setShowEdit(false)}
          onTaskUpdated={onUpdate}
        />
      )}
    </div>
  );
}

