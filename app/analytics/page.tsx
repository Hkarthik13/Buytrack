'use client';

import React from 'react';
import { usePurchases } from '@/context/PurchaseContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export default function AnalyticsPage() {
  const { purchases, metrics, currency } = usePurchases();

  // 1. Category Chart Data
  const categoryData = Object.entries(metrics.categorySpending).map(([name, value]) => ({
    name,
    value,
  }));

  // 2. Monthly Trend Data
  const monthlyData = metrics.monthlySpending;

  // 3. Payment Method Distribution
  const paymentDistMap: Record<string, number> = {};
  purchases.forEach((p) => {
    paymentDistMap[p.payment_method] = (paymentDistMap[p.payment_method] || 0) + p.final_price;
  });
  const paymentData = Object.entries(paymentDistMap).map(([name, value]) => ({
    name,
    value,
  }));

  // 4. Warranty Breakdown
  const warrantyChartData = [
    { name: 'Active', count: metrics.activeWarrantyCount, color: '#10b981' },
    { name: 'Expiring Soon', count: metrics.warrantyExpiringSoonCount, color: '#f59e0b' },
    { name: 'Expired', count: metrics.expiredWarrantyCount, color: '#f43f5e' },
  ].filter((w) => w.count > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Purchase Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual insights across spending categories, monthly expenses, EMI commitments & asset warranties
          </p>
        </div>
      </div>

      {/* Top Aggregates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Asset Value</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {currency}{metrics.totalPurchasesAmount.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{purchases.length} lifetime purchases</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Active Monthly EMI Burden</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {currency}{metrics.monthlyEmiCommitment.toLocaleString()}
            <span className="text-xs font-normal text-slate-400"> / mo</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{metrics.activeEmiCount} active financing plans</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active Warranty Coverage</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.activeWarrantyCount}
            <span className="text-xs font-normal text-slate-400"> Items Covered</span>
          </div>
          <span className="text-[11px] text-amber-500 mt-0.5 block">{metrics.warrantyExpiringSoonCount} expiring within 30 days</span>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Category Spending Donut */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Spending by Category
            </h3>
          </div>

          <div className="h-64 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${currency}${val.toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No spending data recorded
              </div>
            )}
          </div>
        </div>

        {/* 2. Monthly Purchase Spending Bar */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Monthly Purchase Spending Trend
            </h3>
          </div>

          <div className="h-64 w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${currency}${v}`} />
                  <Tooltip
                    formatter={(val: number) => [`${currency}${val.toLocaleString()}`, 'Spent']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No purchase timeline data
              </div>
            )}
          </div>
        </div>

        {/* 3. Payment Method Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Payment Methods Breakdown
            </h3>
          </div>

          <div className="h-64 w-full">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${currency}${v}`} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                  <Tooltip
                    formatter={(val: number) => [`${currency}${val.toLocaleString()}`, 'Total Spent']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No payment data
              </div>
            )}
          </div>
        </div>

        {/* 4. Warranty Health Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Warranty Protection Health
            </h3>
          </div>

          <div className="h-64 w-full">
            {warrantyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={warrantyChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {warrantyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val} Products`, 'Count']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No warranty tracking data
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
