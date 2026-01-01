import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface ChatThread {
  id: number;
  family_id: number;
  created_by: number;
  created_by_name: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message: ChatMessage | null;
}

interface ChatMessage {
  id: number;
  thread_id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  created_at: string;
}

export default function Chat() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading) {
      loadThreads();
    }
  }, [authLoading]);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
    }
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadThreads = async () => {
    try {
      const res = await axios.get('/api/chat/threads');
      setThreads(res.data.threads);
      if (res.data.threads.length > 0 && !selectedThread) {
        setSelectedThread(res.data.threads[0]);
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: number) => {
    try {
      const res = await axios.get(`/api/chat/threads/${threadId}`);
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim()) {
      alert(t('chat.enterTitle'));
      return;
    }
    
    try {
      const res = await axios.post('/api/chat/threads', {
        title: newThreadTitle.trim()
      });
      setNewThreadTitle('');
      setShowCreateModal(false);
      // Refresh threads list
      await loadThreads();
      // Set the newly created thread as selected
      setSelectedThread(res.data);
    } catch (error: any) {
      console.error('Failed to create thread:', error);
      console.error('Error response:', error.response);
      let errorMessage = t('chat.errorCreate');
      if (error.response) {
        errorMessage = error.response.data?.detail || error.response.data?.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || sending) return;

    setSending(true);
    try {
      await axios.post(`/api/chat/threads/${selectedThread.id}/messages`, {
        message: newMessage
      });
      setNewMessage('');
      await loadMessages(selectedThread.id);
      await loadThreads(); // Refresh threads to update last_message
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(t('chat.errorSend'));
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
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
    <div className="flex h-[calc(100vh-12rem)] gap-4" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Threads List */}
      <div className="w-64 bg-white rounded-lg shadow-md p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('chat.title')}</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-sm px-3 py-1"
          >
            + {t('chat.new')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {threads.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">{t('chat.noThreads')}</p>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={`w-full ${language === 'he' ? 'text-right' : 'text-left'} p-3 rounded-lg border transition-colors ${
                  selectedThread?.id === thread.id
                    ? 'bg-primary-100 border-primary-500'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-sm mb-1">
                  {thread.title}
                </div>
                {thread.last_message && (
                  <div className="text-xs text-gray-600 truncate">
                    {thread.last_message.sender_name}: {thread.last_message.message}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages View */}
      <div className="flex-1 bg-white rounded-lg shadow-md flex flex-col">
        {selectedThread ? (
          <>
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold">{selectedThread.title}</h3>
              <p className="text-sm text-gray-500">{t('chat.createdBy')} {selectedThread.created_by_name}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {t('chat.noMessages')}
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md rounded-lg p-3 ${
                        message.sender_id === user?.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="text-xs mb-1 opacity-75">
                        {message.sender_name}
                      </div>
                      <div className="whitespace-pre-wrap">{message.message}</div>
                      <div className="text-xs mt-1 opacity-75">
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('chat.placeholder')}
                  className="input flex-1"
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sending || !newMessage.trim()}
                >
                  {sending ? t('chat.sending') : t('chat.send')}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {t('chat.selectOrCreate')}
          </div>
        )}
      </div>

      {/* Create Thread Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('chat.createThread')}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('chat.threadTitle')} *
              </label>
              <input
                type="text"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder={t('chat.threadTitlePlaceholder')}
                className="input w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateThread();
                  } else if (e.key === 'Escape') {
                    setShowCreateModal(false);
                    setNewThreadTitle('');
                  }
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewThreadTitle('');
                }}
                className="btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreateThread}
                className="btn-primary"
                disabled={!newThreadTitle.trim()}
              >
                {t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

