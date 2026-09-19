'use client';

import React from 'react';
import Link from 'next/link';
import { usePurchases } from '@/context/PurchaseContext';
import {
  Camera,
  Plus,
  CreditCard,
  ShieldCheck,
  BarChart3,
  Bot,
  Calculator,
} from 'lucide-react';

export default function QuickActions() {
  const {
    setIsScannerOpen,
    setIsAddModalOpen,
    setIsAiModalOpen,
    setIsCalculatorOpen,
  } = usePurchases();

  const actions = [
    {
      label: 'Scan Receipt',
      icon: Camera,
      onClick: () => setIsScannerOpen(true),
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20',
      iconColor: 'text-white',
    },
    {
      label: 'Add Purchase',
      icon: Plus,
      onClick: () => setIsAddModalOpen(true),
      color: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'EMI Calculator',
      icon: Calculator,
      onClick: () => setIsCalculatorOpen(true),
      color: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Check Warranties',
      icon: ShieldCheck,
      href: '/warranties',
      color: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'View Analytics',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Ask BuyTrack',
      icon: Bot,
      onClick: () => setIsAiModalOpen(true),
      color: 'bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act, index) => {
          const Icon = act.icon;

          if (act.href) {
            return (
              <Link
                key={index}
                href={act.href}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-semibold transition-all hover:scale-102 active:scale-98 ${act.color}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${act.iconColor}`} />
                <span className="truncate">{act.label}</span>
              </Link>
            );
          }

          return (
            <button
              key={index}
              onClick={act.onClick}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-semibold transition-all hover:scale-102 active:scale-98 ${act.color}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${act.iconColor}`} />
              <span className="truncate">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
