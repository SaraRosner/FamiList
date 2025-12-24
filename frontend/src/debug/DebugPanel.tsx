import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function DebugPanel() {
  const { user, token } = useAuth();
  const [apiHealth, setApiHealth] = useState<any>(null);
  const [open, setOpen] = useState<boolean>(localStorage.getItem('debug') === '1');

  useEffect(() => {
    const i = setInterval(() => setOpen(localStorage.getItem('debug') === '1'), 500);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axios.get('/api/debug/health');
        setApiHealth(res.data);
      } catch {}
    };
    if (open) fetchHealth();
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', left: 16, bottom: 16, zIndex: 9999 }}>
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm text-right">
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold">דיבוג</div>
          <button className="text-sm text-red-600" onClick={() => localStorage.setItem('debug', '0')}>סגור</button>
        </div>
        <div className="text-xs text-gray-700 space-y-1">
          <div>משתמש: {user ? `${user.name} (#${user.id})` : '—'}</div>
          <div>משפחה: {user?.family_id ?? '—'}</div>
          <div>טוקן: {token ? `${token.slice(0, 12)}...` : '—'}</div>
          <div>API Debug: {apiHealth?.debug ? 'ON' : '—'}</div>
        </div>
      </div>
    </div>
  );
}


