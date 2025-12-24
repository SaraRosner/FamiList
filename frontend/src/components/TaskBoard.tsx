import TaskCard from './TaskCard';
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
  created_at: string;
}

interface TaskBoardProps {
  tasks: Task[];
  userId: number;
  onTaskUpdate: () => void;
}

export default function TaskBoard({ tasks, userId, onTaskUpdate }: TaskBoardProps) {
  const { t } = useLanguage();
  const unclaimedTasks = tasks.filter(t => t.status === 'unclaimed');
  const myTasks = tasks.filter(t => t.status === 'in_progress' && t.volunteer_id === userId);
  const othersInProgress = tasks.filter(t => t.status === 'in_progress' && t.volunteer_id !== null && t.volunteer_id !== userId);
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* Unclaimed Tasks */}
      <div>
        <div className="bg-orange-100 text-orange-800 rounded-t-lg px-4 py-3 font-bold text-lg">
          {t('tasks.unclaimed')} ({unclaimedTasks.length})
        </div>
        <div className="bg-orange-50 rounded-b-lg p-4 min-h-[400px] space-y-3">
          {unclaimedTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t('tasks.noUnclaimed')}</p>
          ) : (
            unclaimedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userId={userId}
                onUpdate={onTaskUpdate}
              />
            ))
          )}
        </div>
      </div>

      {/* My Tasks */}
      <div>
        <div className="bg-blue-100 text-blue-800 rounded-t-lg px-4 py-3 font-bold text-lg">
          {t('tasks.myTasks')} ({myTasks.length})
        </div>
        <div className="bg-blue-50 rounded-b-lg p-4 min-h-[400px] space-y-3">
          {myTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {t('tasks.noMyTasks')}<br />
              {t('tasks.noMyTasksHint')}
            </p>
          ) : (
            myTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userId={userId}
                onUpdate={onTaskUpdate}
              />
            ))
          )}
        </div>
      </div>

      {/* In Progress by Others */}
      <div>
        <div className="bg-purple-100 text-purple-800 rounded-t-lg px-4 py-3 font-bold text-lg">
          {t('tasks.inProgressOthers')} ({othersInProgress.length})
        </div>
        <div className="bg-purple-50 rounded-b-lg p-4 min-h-[400px] space-y-3">
          {othersInProgress.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t('tasks.noInProgress')}</p>
          ) : (
            othersInProgress.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userId={userId}
                onUpdate={onTaskUpdate}
                readonly
              />
            ))
          )}
        </div>
      </div>

      {/* Completed Tasks */}
      <div>
        <div className="bg-green-100 text-green-800 rounded-t-lg px-4 py-3 font-bold text-lg">
          {t('tasks.completed')} ({completedTasks.length})
        </div>
        <div className="bg-green-50 rounded-b-lg p-4 min-h-[400px] space-y-3">
          {completedTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t('tasks.noCompleted')}</p>
          ) : (
            completedTasks.slice(0, 10).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userId={userId}
                onUpdate={onTaskUpdate}
                readonly
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

