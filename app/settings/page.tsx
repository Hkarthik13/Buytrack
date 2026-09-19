'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { usePurchases } from '@/context/PurchaseContext';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from '@/lib/storage/store';
import { NotificationPreference } from '@/types/database';
import {
  User,
  Bell,
  Sun,
  Moon,
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Zap,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updateProfile, isSupabase, resetToDemoUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { purchases, resetUserDemoPurchases, currency } = usePurchases();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || '₹');
  const [prefs, setPrefs] = useState<NotificationPreference>({
    id: '',
    user_id: '',
    notify_30_days: true,
    notify_7_days: true,
    notify_1_day: true,
    emi_due_reminders: true,
    email_notifications: true,
    push_notifications: false,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setSelectedCurrency(user.currency || '₹');
      getNotificationPreferences(user.id).then(setPrefs);
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await updateProfile({
      name,
      email,
      currency: selectedCurrency,
    });
    await saveNotificationPreferences(user.id, prefs);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(purchases, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `buytrack_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Account & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal profile, notification thresholds, currency and database sync
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Your settings and preferences have been successfully updated!</span>
        </div>
      )}

      <form onSubmit={handleProfileSave} className="space-y-6">
        
        {/* 1. Profile Information */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Profile Information
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Personal identity and display configurations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD - US Dollar)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - British Pound)</option>
                <option value="AED">AED (UAE Dirham)</option>
                <option value="SGD">SGD (Singapore Dollar)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Notification Preferences */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Warranty & EMI Reminder Preferences
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose when you want to receive warranty expiry warnings and payment alerts
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                id: 'notify_30_days',
                title: '30 Days Before Warranty Expiry',
                desc: 'Get an early alert to plan servicing or extended protection renewal',
                checked: prefs.notify_30_days,
              },
              {
                id: 'notify_7_days',
                title: '7 Days Before Warranty Expiry',
                desc: 'One-week urgent notice for upcoming warranty expiration',
                checked: prefs.notify_7_days,
              },
              {
                id: 'notify_1_day',
                title: '1 Day Before Warranty Expiry',
                desc: 'Final day alert for warranty expiration',
                checked: prefs.notify_1_day,
              },
              {
                id: 'emi_due_reminders',
                title: 'Monthly EMI Due Date Alerts',
                desc: 'Receive alerts 3 days prior to any scheduled EMI payment',
                checked: prefs.emi_due_reminders,
              },
            ].map((item) => (
              <label
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) =>
                    setPrefs({ ...prefs, [item.id]: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>

        {/* 3. Theme Preferences */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Appearance & Theme
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Switch between modern dark fintech mode and crisp light mode
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                theme === 'dark'
                  ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-5 h-5" />
              <div className="text-left">
                <span className="text-xs block">Dark Mode</span>
                <span className="text-[10px] text-slate-400 block font-normal">Sleek obsidian fintech</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-5 h-5" />
              <div className="text-left">
                <span className="text-xs block">Light Mode</span>
                <span className="text-[10px] text-slate-400 block font-normal">Crisp clean contrast</span>
              </div>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
          >
            Save Settings
          </button>
        </div>

      </form>

      {/* 4. Database & Cloud Sync Details */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Database & Cloud Synchronization
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Supabase PostgreSQL connection and offline persistence status
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Current Storage Engine:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isSupabase ? 'Supabase PostgreSQL Cloud' : 'Smart Isolated Local Storage (Demo Mode)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            To synchronize across all mobile and desktop devices permanently, configure <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your <code>.env.local</code> or Vercel Environment Variables.
          </p>
        </div>

        {/* Data Tools */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Reset to standard demo dataset? This will restore sample TV, Laptop, and Headphones.')) {
                resetUserDemoPurchases();
                resetToDemoUser();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

    </div>
  );
}
