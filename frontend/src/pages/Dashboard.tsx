import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import TaskBoard from '../components/TaskBoard';
import CreateTaskModal from '../components/CreateTaskModal';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [familyInfo, setFamilyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (user?.family_id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [tasksRes, familyRes] = await Promise.all([
        axios.get('/api/tasks'),
        axios.get('/api/family')
      ]);
      setTasks(tasksRes.data.tasks);
      setFamilyInfo(familyRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    loadData();
  };

  const handleTaskUpdate = () => {
    loadData();
  };

  if (!user?.family_id) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">{t('tasks.redirectingToFamilySetup')}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tasks.title')}</h1>
          <p className="text-gray-600 mt-1">{familyInfo?.family?.name}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span>+ {t('tasks.newTask')}</span>
        </button>
      </div>

      <TaskBoard tasks={tasks} userId={user?.id!} onTaskUpdate={handleTaskUpdate} />

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}

