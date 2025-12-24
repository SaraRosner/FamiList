import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

interface Stats {
  user_id: number;
  user_name: string;
  completed_count: number;
}

export default function Reports() {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLoading, setOpenLoading] = useState(true);
  const [unclaimed, setUnclaimed] = useState<any[]>([]);
  const [inProgress, setInProgress] = useState<any[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [period]);

  useEffect(() => {
    loadOpen();
  }, []);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/reports/fairness?period=${period}`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    setTasksLoading(true);
    try {
      const response = await axios.get('/api/tasks');
      const all = response.data.tasks || [];
      const completed = all
        .filter((t: any) => t.status === 'completed')
        .sort((a: any, b: any) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
        .slice(0, 10);
      setRecentCompleted(completed);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadOpen = async () => {
    setOpenLoading(true);
    try {
      const response = await axios.get('/api/reports/open');
      setUnclaimed(response.data.unclaimed);
      setInProgress(response.data.in_progress);
    } catch (error) {
      console.error('Failed to load open tasks:', error);
    } finally {
      setOpenLoading(false);
    }
  };

  const periodLabels: Record<string, string> = {
    week: 'שבוע אחרון',
    month: 'חודש אחרון',
    all: 'כל הזמן',
  };

  const maxTasks = Math.max(...stats.map(s => s.completed_count), 0);

  return (
    <div dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('reports.title')}</h1>
        <p className="text-gray-600">{t('reports.subtitle')}</p>
      </div>

      {/* הוסר מקטע ההשוואות/גביעים לפי בקשה */}

      {/* Open tasks */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">{t('reports.openTasks')}</h2>
        {openLoading ? (
          <div className="text-center py-8">{t('common.loading')}</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="bg-orange-100 text-orange-800 rounded-t-lg px-4 py-2 font-bold">
                {t('reports.unclaimed')} ({unclaimed.length})
              </div>
              <div className="bg-orange-50 rounded-b-lg p-4 space-y-2">
                {unclaimed.length === 0 ? (
                  <div className="text-gray-500 text-sm">{t('reports.noUnclaimed')}</div>
                ) : (
                  unclaimed.map((task) => (
                    <div key={task.id} className="p-3 rounded bg-white border">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-gray-600">
                        {t('reports.createdBy')} {task.creator_name}
                        {task.created_at ? ` ${t('reports.onDate')} ${new Date(task.created_at).toLocaleDateString('he-IL')}` : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="bg-purple-100 text-purple-800 rounded-t-lg px-4 py-2 font-bold">
                {t('reports.inProgress')} ({inProgress.length})
              </div>
              <div className="bg-purple-50 rounded-b-lg p-4 space-y-2">
                {inProgress.length === 0 ? (
                  <div className="text-gray-500 text-sm">{t('reports.noInProgress')}</div>
                ) : (
                  inProgress.map((task) => (
                    <div key={task.id} className="p-3 rounded bg-white border">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-gray-600">{t('reports.handledBy')} {task.volunteer_name || '—'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent completed moved up for prominence */}
      <div className="card mt-6 order-first">
        <h2 className="text-2xl font-bold mb-4">{t('reports.recentCompleted')}</h2>
        {tasksLoading ? (
          <div className="text-center py-8">{t('common.loading')}</div>
        ) : recentCompleted.length === 0 ? (
          <div className="text-gray-500">{t('reports.noRecentCompleted')}</div>
        ) : (
          <div className="space-y-2">
            {recentCompleted.map((task: any) => (
              <div key={task.id} className="p-3 rounded bg-green-50 border border-green-200">
                <div className="font-medium">{task.title}</div>
                <div className="text-xs text-green-800">{task.completed_at ? new Date(task.completed_at).toLocaleDateString('he-IL') : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-sm text-green-800">
          {t('reports.thankYouMessage')}
        </p>
      </div>
    </div>
  );
}

