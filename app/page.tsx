'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePurchases } from '@/context/PurchaseContext';
import SummaryCards from '@/components/dashboard/SummaryCards';
import QuickActions from '@/components/dashboard/QuickActions';
import SmartInsights from '@/components/dashboard/SmartInsights';
import UpcomingPayments from '@/components/dashboard/UpcomingPayments';
import WarrantyAlerts from '@/components/dashboard/WarrantyAlerts';
import RecentPurchases from '@/components/dashboard/RecentPurchases';
import { Sparkles, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { isLoading } = usePurchases();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Welcome Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {user?.name || 'Friend'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>{todayFormatted}</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              “Buy it once. Never lose track of it.”
            </span>
          </p>
        </div>
      </div>

      {/* 1. Quick Summary Cards */}
      <SummaryCards />

      {/* 2. Quick Action Toolbar */}
      <QuickActions />

      {/* 3. Smart Insights Engine */}
      <SmartInsights />

      {/* 4. Two-Column Widgets: Upcoming Payments & Warranty Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingPayments />
        <WarrantyAlerts />
      </div>

      {/* 5. Recent Purchases */}
      <RecentPurchases />

    </div>
  );
}
