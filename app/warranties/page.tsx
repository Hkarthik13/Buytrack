'use client';

import React, { useState } from 'react';
import { usePurchases } from '@/context/PurchaseContext';
import { calculateWarrantyMetrics } from '@/lib/calculations/warranty';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export default function WarrantiesPage() {
  const { purchases, setSelectedPurchaseDetail, currency } = usePurchases();
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

  // Enriched warranties list
  const warranties = purchases
    .filter((p) => p.has_warranty && p.warranty)
    .map((p) => {
      const metrics = calculateWarrantyMetrics(
        p.warranty!.warranty_start_date,
        p.warranty!.warranty_end_date
      );
      return {
        purchase: p,
        warranty: p.warranty!,
        metrics,
      };
    })
    .sort((a, b) => a.metrics.daysRemaining - b.metrics.daysRemaining);

  const filtered = warranties.filter((w) => {
    if (filter === 'active') return w.metrics.status === 'Active';
    if (filter === 'expiring') return w.metrics.status === 'Expiring Soon';
    if (filter === 'expired') return w.metrics.status === 'Expired';
    return true;
  });

  const activeCount = warranties.filter((w) => w.metrics.status === 'Active').length;
  const expiringCount = warranties.filter((w) => w.metrics.status === 'Expiring Soon').length;
  const expiredCount = warranties.filter((w) => w.metrics.status === 'Expired').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Warranty Hub & Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor protection coverage, countdown timers and upcoming claim deadlines
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All ({warranties.length})
          </button>
          <button
            onClick={() => setFilter('expiring')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'expiring'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            Expiring Soon ({expiringCount})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'expired'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Expired ({expiredCount})
          </button>
        </div>
      </div>

      {/* Reminder Schedule Notice */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-emerald-500/10 to-transparent border border-indigo-200/50 dark:border-indigo-800/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Automated Warranty Expiry Alerts
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              BuyTrack notifies you 30 days, 7 days, and 1 day before any warranty expires.
            </p>
          </div>
        </div>

        <a
          href="/settings"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Manage Preferences
        </a>
      </div>

      {/* Warranty Cards Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Warranties Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Try choosing a different status filter or register a new purchase with warranty.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(({ purchase, warranty, metrics }) => {
            const isCritical = metrics.daysRemaining <= 7 && metrics.status !== 'Expired';
            const isExpiringSoon = metrics.status === 'Expiring Soon';

            return (
              <div
                key={purchase.id}
                onClick={() => setSelectedPurchaseDetail(purchase)}
                className={`glass-card rounded-3xl p-5 cursor-pointer flex flex-col justify-between space-y-4 hover:scale-[1.01] transition-all border ${
                  isCritical
                    ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/10'
                    : isExpiringSoon
                    ? 'border-amber-300 dark:border-amber-900/80 bg-amber-50/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        metrics.status === 'Active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : metrics.status === 'Expiring Soon'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {metrics.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {warranty.warranty_type} Warranty
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {purchase.product_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {purchase.brand} • Purchased {purchase.purchase_date}
                  </p>
                </div>

                {/* Countdown Meter */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Remaining</span>
                    <span
                      className={`font-extrabold ${
                        isCritical
                          ? 'text-rose-600 dark:text-rose-400'
                          : isExpiringSoon
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {metrics.expiryLabel}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        metrics.status === 'Active'
                          ? 'bg-emerald-500'
                          : metrics.status === 'Expiring Soon'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${metrics.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>Start: {warranty.warranty_start_date}</span>
                    <span>Expires: {warranty.warranty_end_date}</span>
                  </div>
                </div>

                {/* Notes if available */}
                {warranty.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                    "{warranty.notes}"
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>View Details & Receipt</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
