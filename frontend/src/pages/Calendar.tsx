import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface CalendarTask {
  id: number;
  type: 'task';
  title: string;
  description: string | null;
  due_date: string;
  priority: string;
  status: string;
  creator_name: string;
  volunteer_name: string | null;
}

interface CalendarEvent {
  id: number;
  type: 'event';
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  creator_name: string;
}

type CalendarItem = CalendarTask | CalendarEvent;

export default function Calendar() {
  const { user } = useAuth();
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  useEffect(() => {
    loadCalendarItems();
  }, [currentDate, view]);

  const loadCalendarItems = async () => {
    setLoading(true);
    try {
      const start = getViewStartDate();
      const end = getViewEndDate();
      
      const res = await axios.get('/api/calendar', {
        params: {
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0],
        },
      });
      
      const allItems: CalendarItem[] = [
        ...res.data.tasks,
        ...res.data.events,
      ];
      
      // Sort by date
      allItems.sort((a, b) => {
        const dateA = a.type === 'task' ? a.due_date : a.start_date;
        const dateB = b.type === 'task' ? b.due_date : b.start_date;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
      
      setItems(allItems);
    } catch (error) {
      console.error('Failed to load calendar items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      // Get first day of week (Sunday = 0)
      const dayOfWeek = date.getDay();
      date.setDate(date.getDate() - dayOfWeek);
    } else {
      // Week view - get Monday of current week
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      date.setDate(diff);
      date.setHours(0, 0, 0, 0);
    }
    return date;
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      // Get last day of month
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      // Get last day of week
      const dayOfWeek = date.getDay();
      date.setDate(date.getDate() + (6 - dayOfWeek));
      date.setHours(23, 59, 59, 999);
    } else {
      // Week view - get Sunday of current week
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
      date.setDate(diff);
      date.setHours(23, 59, 59, 999);
    }
    return date;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInView = () => {
    const days: Date[] = [];
    const start = getViewStartDate();
    const end = getViewEndDate();
    const current = new Date(start);
    
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getItemsForDate = (date: Date) => {
    return items.filter((item) => {
      const itemDate = new Date(item.type === 'task' ? item.due_date : item.start_date);
      return (
        itemDate.getDate() === date.getDate() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
    });
  };

  const formatWeekRange = () => {
    const start = getViewStartDate();
    const end = getViewEndDate();
    return `${start.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">טוען...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">יומן משפחתי 📅</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded ${view === 'month' ? 'btn-primary' : 'btn-secondary'}`}
          >
            חודש
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`}
          >
            שבוע
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => view === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
              className="btn-secondary"
            >
              ←
            </button>
            <h2 className="text-xl font-bold">
              {view === 'month' ? formatDate(currentDate) : formatWeekRange()}
            </h2>
            <button
              onClick={() => view === 'month' ? navigateMonth(1) : navigateWeek(1)}
              className="btn-secondary"
            >
              →
            </button>
            <button onClick={navigateToday} className="btn-secondary text-sm">
              היום
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, idx) => (
            <div key={idx} className="text-center font-bold text-gray-700 p-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {getDaysInView().map((date, idx) => {
            const dayItems = getItemsForDate(date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDay = isToday(date);

            return (
              <div
                key={idx}
                className={`min-h-[100px] border rounded p-2 ${
                  !isCurrentMonthDay ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${isTodayDay ? 'border-primary-500 border-2' : 'border-gray-200'}`}
              >
                <div className={`text-sm font-medium mb-1 ${isTodayDay ? 'text-primary-600' : ''}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full text-left text-xs p-1 rounded truncate border ${
                        item.type === 'task'
                          ? getPriorityColor(item.priority)
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}
                      title={item.title}
                    >
                      {item.type === 'task' ? '✓' : '📅'} {item.title}
                    </button>
                  ))}
                  {dayItems.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayItems.length - 3} עוד
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">
                {selectedItem.type === 'task' ? '✓ משימה' : '📅 אירוע משפחתי'}
              </h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {selectedItem.type === 'task' ? (
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{selectedItem.title}</h3>
                  {selectedItem.description && (
                    <p className="text-gray-700 mt-1">{selectedItem.description}</p>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">תאריך יעד:</span>{' '}
                    {new Date(selectedItem.due_date).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p>
                    <span className="font-medium">עדיפות:</span>{' '}
                    {selectedItem.priority === 'high' ? 'גבוהה' : selectedItem.priority === 'medium' ? 'בינונית' : 'נמוכה'}
                  </p>
                  <p>
                    <span className="font-medium">סטטוס:</span>{' '}
                    {selectedItem.status === 'unclaimed' ? 'ללא בעלים' :
                     selectedItem.status === 'in_progress' ? 'בביצוע' :
                     selectedItem.status === 'completed' ? 'הושלם' : selectedItem.status}
                  </p>
                  <p>
                    <span className="font-medium">נוצר על ידי:</span> {selectedItem.creator_name}
                  </p>
                  {selectedItem.volunteer_name && (
                    <p>
                      <span className="font-medium">מתנדב:</span> {selectedItem.volunteer_name}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{selectedItem.title}</h3>
                  {selectedItem.description && (
                    <p className="text-gray-700 mt-1">{selectedItem.description}</p>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">תאריך התחלה:</span>{' '}
                    {new Date(selectedItem.start_date).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {selectedItem.end_date && (
                    <p>
                      <span className="font-medium">תאריך סיום:</span>{' '}
                      {new Date(selectedItem.end_date).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">נוצר על ידי:</span> {selectedItem.creator_name}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="btn-primary"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

