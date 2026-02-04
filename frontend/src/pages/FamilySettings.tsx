import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Member, MemberRole } from '../types';

interface AddMemberForm {
  name: string;
  email: string;
  role: MemberRole;
}

export default function FamilySettings() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddMemberForm>({
    name: '',
    email: '',
    role: 'MEMBER',
  });

  // Case-insensitive admin check (backend might return 'admin' or 'ADMIN')
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    // Debug: log the user's role to help diagnose
    console.log('[FamilySettings] Current user role:', user?.role, 'isAdmin:', isAdmin);
    loadMembers();
  }, [user, isAdmin]);

  const loadMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get<Member[]>('/api/members');
      setMembers(res.data);
    } catch (err: any) {
      console.error('Failed to load members', err);
      setError(err.response?.data?.error || t('familySettings.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setForm({ name: '', email: '', role: 'MEMBER' });
    setShowAddModal(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await axios.post<Member>('/api/members', form);
      setShowAddModal(false);
      await loadMembers();
    } catch (err: any) {
      console.error('Failed to add member', err);
      setError(err.response?.data?.error || t('familySettings.errorAdd'));
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (memberId: number, role: MemberRole) => {
    setUpdatingId(memberId);
    setError('');
    try {
      await axios.patch(`/api/members/${memberId}/role`, { role });
      await loadMembers();
    } catch (err: any) {
      console.error('Failed to update role', err);
      setError(err.response?.data?.error || t('familySettings.errorUpdateRole'));
    } finally {
      setUpdatingId(null);
    }
  };

  const roleLabel = (role: string): string => {
    // Normalize to uppercase for comparison
    const normalizedRole = role?.toUpperCase() || 'MEMBER';
    switch (normalizedRole) {
      case 'ADMIN':
        return t('familySettings.roleAdmin');
      case 'RESTRICTED':
        return t('familySettings.roleRestricted');
      case 'MEMBER':
      default:
        return t('familySettings.roleMember');
    }
  };

  if (!user?.family_id) {
    return null;
  }

  return (
    <div dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('familySettings.title')}</h1>
          <p className="text-gray-600 mt-1">{t('familySettings.subtitle')}</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="btn-primary"
          >
            + {t('familySettings.addMember')}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-600">{t('common.loading')}</div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t('familySettings.noMembers')}</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('familySettings.name')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('familySettings.email')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('familySettings.role')}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{m.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {isAdmin ? (
                      <select
                        value={m.role?.toUpperCase() || 'MEMBER'}
                        disabled={updatingId === m.id}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as MemberRole)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="ADMIN">{t('familySettings.roleAdmin')}</option>
                        <option value="MEMBER">{t('familySettings.roleMember')}</option>
                        <option value="RESTRICTED">{t('familySettings.roleRestricted')}</option>
                      </select>
                    ) : (
                      roleLabel(m.role)
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {m.id === user.id && <span>{t('familySettings.you')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && isAdmin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{t('familySettings.addMember')}</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familySettings.name')}
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familySettings.email')}
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('familySettings.role')}
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as MemberRole })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="ADMIN">{t('familySettings.roleAdmin')}</option>
                  <option value="MEMBER">{t('familySettings.roleMember')}</option>
                  <option value="RESTRICTED">{t('familySettings.roleRestricted')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700"
                  disabled={saving}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {saving ? t('familySettings.saving') : t('familySettings.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

