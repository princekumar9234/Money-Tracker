import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import api from '../../../services/api';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Alert } from '../../../components/common/LayoutComponents';
import { User, Mail, Calendar, ShieldCheck, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { formatDateTime } from '../../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const { user, isEmailVerified, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setUpdating(true);
      setError('');
      setSuccess('');
      await api.patch('/user/profile', { name });
      await refreshUser();
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: This will permanently delete your account, all uploaded transactions, AI analyses, and generated reports. This action cannot be undone. Are you absolutely sure?')) return;
    
    try {
      setDeleting(true);
      await api.delete('/user/account');
      await logout();
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your account information and preferences.</p>
      </div>

      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      <Card title="Account Information" subtitle="Update your personal details">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={User}
            required
          />
          
          <Input
            label="Email Address"
            value={user?.email || ''}
            disabled
            icon={Mail}
            helperText="Email address cannot be changed."
          />

          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" variant="primary" isLoading={updating} disabled={name === user?.name}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Account Status">
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4" />
              <span className="font-semibold">Email Verification</span>
            </div>
            {isEmailVerified ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-700 font-semibold text-xs bg-amber-50 px-2 py-1 rounded">
                <AlertTriangle className="w-3.5 h-3.5" /> Unverified
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-semibold">Account Security</span>
            </div>
            <span className="text-emerald-700 font-semibold text-xs">Standard Protection</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold">Member Since</span>
            </div>
            <span className="text-slate-600 font-mono text-xs">
              {user?.createdAt ? formatDateTime(user.createdAt) : 'N/A'}
            </span>
          </div>
        </div>
      </Card>

      <Card title="Danger Zone" className="border-red-200">
        <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-red-900 text-sm">Delete Account</h4>
            <p className="text-xs text-red-700 mt-1">Permanently remove your account and all associated data.</p>
          </div>
          <Button variant="danger" size="sm" icon={Trash2} isLoading={deleting} onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
};
