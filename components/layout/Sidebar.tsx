'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePurchases } from '@/context/PurchaseContext';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  ShieldCheck,
  BarChart3,
  Bot,
  Settings,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { metrics, setIsAddModalOpen, setIsScannerOpen } = usePurchases();
  const { isSupabase } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Purchases',
      href: '/purchases',
      icon: Receipt,
      badge: metrics.totalPurchasesCount > 0 ? String(metrics.totalPurchasesCount) : undefined,
    },
    {
      label: 'EMIs',
      href: '/emi',
      icon: CreditCard,
      badge: metrics.activeEmiCount > 0 ? String(metrics.activeEmiCount) : undefined,
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400',
    },
    {
      label: 'Warranties',
      href: '/warranties',
      icon: ShieldCheck,
      badge: metrics.warrantyExpiringSoonCount > 0 ? `${metrics.warrantyExpiringSoonCount} Expiring` : undefined,
      badgeColor: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400',
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
    },
    {
      label: 'Ask BuyTrack',
      href: '/ask',
      icon: Bot,
      highlight: true,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#0c121e]/50 backdrop-blur-xl h-[calc(100vh-4rem)] sticky top-16 p-4 justify-between transition-colors">
      
      {/* Navigation list */}
      <div className="space-y-6">
        
        {/* Quick Action Button */}
        <div className="space-y-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Scan Receipt</span>
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50 dark:border-indigo-800/60 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                } ${item.highlight && !isActive ? 'hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : item.highlight
                        ? 'text-emerald-500'
                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sync Status Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/40">
        <div className="flex items-center gap-2 mb-1.5">
          <Zap className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {isSupabase ? 'Cloud Connected' : 'Demo & Local Storage'}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
          {isSupabase
            ? 'All receipts, EMIs & warranties synced to PostgreSQL'
            : 'Working seamlessly locally. Connect Supabase in Settings.'}
        </p>
      </div>

    </aside>
  );
}
