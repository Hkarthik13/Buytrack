'use client';

import React from 'react';
import Link from 'next/link';
import { usePurchases } from '@/context/PurchaseContext';
import {
  Receipt,
  CreditCard,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export default function SummaryCards() {
  const { metrics, currency } = usePurchases();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Total Purchases */}
      <Link
        href="/purchases"
        className="glass-card p-5 rounded-3xl group relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Purchases
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {currency}{metrics.totalPurchasesAmount.toLocaleString()}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>{metrics.totalPurchasesCount} tracked items</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </p>
        </div>
      </Link>

      {/* 2. Active EMIs */}
      <Link
        href="/emi"
        className="glass-card p-5 rounded-3xl group relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Active EMIs
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {currency}{metrics.monthlyEmiCommitment.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> / mo</span>
          </h3>
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
            {metrics.activeEmiCount} active financing plan{metrics.activeEmiCount !== 1 ? 's' : ''}
          </p>
        </div>
      </Link>

      {/* 3. Upcoming EMI */}
      <Link
        href="/emi"
        className="glass-card p-5 rounded-3xl group relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Upcoming EMI
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {metrics.upcomingEmiAmount > 0 ? `${currency}${metrics.upcomingEmiAmount.toLocaleString()}` : `${currency}0`}
          </h3>
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1 truncate">
            {metrics.upcomingEmiDaysLeft !== null
              ? metrics.upcomingEmiDaysLeft <= 0
                ? 'Due today!'
                : `Due in ${metrics.upcomingEmiDaysLeft} days (${metrics.upcomingEmiDueDate})`
              : 'No pending dues'}
          </p>
        </div>
      </Link>

      {/* 4. Warranty Expiring Soon */}
      <Link
        href="/warranties"
        className="glass-card p-5 rounded-3xl group relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Warranty Expiring Soon
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {metrics.warrantyExpiringSoonCount}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> product{metrics.warrantyExpiringSoonCount !== 1 ? 's' : ''}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {metrics.activeWarrantyCount} under active protection
          </p>
        </div>
      </Link>

    </div>
  );
}
