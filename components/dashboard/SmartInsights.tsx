'use client';

import React from 'react';
import Link from 'next/link';
import { usePurchases } from '@/context/PurchaseContext';
import {
  Sparkles,
  ShieldAlert,
  CreditCard,
  PieChart,
  Calendar,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function SmartInsights() {
  const { insights } = usePurchases();

  if (!insights || insights.length === 0) return null;

  const getIcon = (id: string) => {
    if (id.includes('emi')) return CreditCard;
    if (id.includes('warranty')) return ShieldAlert;
    if (id.includes('category')) return PieChart;
    return Sparkles;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Smart Purchase Insights
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight) => {
          const Icon = getIcon(insight.id);

          return (
            <div
              key={insight.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                insight.type === 'alert'
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                  : insight.type === 'warning'
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                  : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-900/50'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      insight.type === 'alert'
                        ? 'text-rose-500'
                        : insight.type === 'warning'
                        ? 'text-amber-500'
                        : 'text-indigo-500'
                    }`}
                  />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {insight.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {insight.message}
                </p>
              </div>

              {insight.action_url && (
                <Link
                  href={insight.action_url}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                >
                  <span>{insight.action_label || 'View details'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
