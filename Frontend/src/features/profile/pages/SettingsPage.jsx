import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Alert } from '../../../components/common/LayoutComponents';
import { Save, Shield, Bell, Moon, Sun, Lock } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [success, setSuccess] = useState('');
  
  // Mock settings state
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    weeklyReport: true,
    anomalyAlerts: true,
    darkMode: false,
    currency: 'USD',
  });

  const [saving, setSaving] = useState(false);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaving(true);
    // In a real app, send to API
    setTimeout(() => {
      setSaving(false);
      setSuccess('Settings saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Manage your application preferences and alerts.</p>
        </div>
        <Button variant="primary" icon={Save} onClick={handleSave} isLoading={saving}>
          Save Changes
        </Button>
      </div>

      {success && <Alert type="success">{success}</Alert>}

      <Card title="Notifications & Alerts" subtitle="How we contact you">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-600" /> Push Notifications
              </p>
              <p className="text-xs text-slate-500">Receive browser notifications for important events.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.notificationsEnabled} onChange={() => handleToggle('notificationsEnabled')} />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-600" /> Anomaly Alerts
              </p>
              <p className="text-xs text-slate-500">Email me immediately if high-risk transactions are detected.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.anomalyAlerts} onChange={() => handleToggle('anomalyAlerts')} />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-600" /> Weekly Summary Report
              </p>
              <p className="text-xs text-slate-500">Receive a weekly email summarizing your transaction flow.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.weeklyReport} onChange={() => handleToggle('weeklyReport')} />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>
      </Card>

      <Card title="Appearance & Localization">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                {settings.darkMode ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-500" />} 
                Dark Mode
              </p>
              <p className="text-xs text-slate-500">Toggle dark appearance (Coming soon).</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer opacity-50">
              <input type="checkbox" className="sr-only peer" disabled checked={settings.darkMode} onChange={() => handleToggle('darkMode')} />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Currency Display</label>
            <select 
              className="w-full sm:w-64 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2"
              value={settings.currency}
              onChange={(e) => setSettings({...settings, currency: e.target.value})}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>
      </Card>

      <Card title="Security Preferences">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
           <div>
             <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
               <Lock className="w-4 h-4 text-slate-600" /> Require Password for Exports
             </p>
             <p className="text-xs text-slate-500">Prompt for password when downloading sensitive CSV reports.</p>
           </div>
           <label className="relative inline-flex items-center cursor-pointer">
             <input type="checkbox" className="sr-only peer" defaultChecked />
             <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
           </label>
        </div>
      </Card>
    </div>
  );
};
