'use client';

import React from 'react';
import Link from 'next/link';
import { usePurchases } from '@/context/PurchaseContext';
import { calculateWarrantyMetrics } from '@/lib/calculations/warranty';
import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function WarrantyAlerts() {
  const { purchases, setSelectedPurchaseDetail } = usePurchases();

  // Extract warranties
  const warrantyList = purchases
    .filter((p) => p.has_warranty && p.warranty)
    .map((p) => {
      const metrics = calculateWarrantyMetrics(
        p.warranty!.warranty_start_date,
        p.warranty!.warranty_end_date
      );
      return {
        purchase: p,
        metrics,
      };
    })
    .sort((a, b) => a.metrics.daysRemaining - b.metrics.daysRemaining);

  const expiringList = warrantyList.filter((w) => w.metrics.status === 'Expiring Soon' || w.metrics.daysRemaining <= 60);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Warranty Alerts & Expiries
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Active protection status across purchases
            </p>
          </div>
        </div>

        <Link
          href="/warranties"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>View Hub</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {warrantyList.length === 0 ? (
        <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
          <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No Warranties Tracked
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Scan receipts to automatically register warranties.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {warrantyList.slice(0, 4).map(({ purchase, metrics }) => {
            const isCritical = metrics.daysRemaining <= 7 && metrics.status !== 'Expired';
            const isExpiringSoon = metrics.status === 'Expiring Soon';

            return (
              <div
                key={purchase.id}
                onClick={() => setSelectedPurchaseDetail(purchase)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isCritical
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-300'
                    : isExpiringSoon
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 hover:border-amber-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-base shrink-0">
                    {isCritical ? '🔴' : isExpiringSoon ? '🟠' : '🟢'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {purchase.product_name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Expires {purchase.warranty?.warranty_end_date}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-bold ${
                      isCritical
                        ? 'text-rose-600 dark:text-rose-400'
                        : isExpiringSoon
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {metrics.expiryLabel}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {purchase.warranty?.warranty_type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
