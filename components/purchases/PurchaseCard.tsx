'use client';

import React from 'react';
import { Purchase } from '@/types/database';
import { usePurchases } from '@/context/PurchaseContext';
import { calculateWarrantyMetrics } from '@/lib/calculations/warranty';
import {
  CreditCard,
  ShieldCheck,
  Calendar,
  Store,
  Tag,
  ArrowUpRight,
  Tv,
  Laptop,
  Headphones,
  Watch,
  Refrigerator,
  ShoppingBag,
} from 'lucide-react';

export default function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const { setSelectedPurchaseDetail, currency } = usePurchases();

  const getProductIcon = (category: string, name: string) => {
    const n = name.toLowerCase();
    if (n.includes('tv') || n.includes('television')) return Tv;
    if (n.includes('laptop') || n.includes('thinkpad') || n.includes('macbook')) return Laptop;
    if (n.includes('headphone') || n.includes('audio') || n.includes('earbuds')) return Headphones;
    if (n.includes('watch')) return Watch;
    if (n.includes('fridge') || n.includes('refrigerator')) return Refrigerator;
    return ShoppingBag;
  };

  const Icon = getProductIcon(purchase.category, purchase.product_name);
  const wMetrics = purchase.has_warranty && purchase.warranty
    ? calculateWarrantyMetrics(purchase.warranty.warranty_start_date, purchase.warranty.warranty_end_date)
    : null;

  return (
    <div
      onClick={() => setSelectedPurchaseDetail(purchase)}
      className="glass-card rounded-3xl p-5 cursor-pointer group flex flex-col justify-between hover:scale-[1.01] transition-all"
    >
      <div>
        {/* Top badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
            {purchase.category}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            {purchase.brand}
          </span>
        </div>

        {/* Product Title and Icon */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:scale-105 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/70 group-hover:text-indigo-600 transition-all shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {purchase.product_name}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{purchase.store}</span>
              <span>•</span>
              <span>{purchase.purchase_date}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Pricing & Status Pills */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Price</span>
          <span className="text-lg font-black text-slate-900 dark:text-white">
            {currency}{purchase.final_price.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {purchase.has_emi && purchase.emi_plan && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              <span>{currency}{purchase.emi_plan.monthly_emi.toLocaleString()} × {purchase.emi_plan.number_of_installments}</span>
            </span>
          )}

          {purchase.has_warranty && wMetrics && (
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                wMetrics.status === 'Active'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : wMetrics.status === 'Expiring Soon'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>{wMetrics.expiryLabel}</span>
            </span>
          )}

          {!purchase.has_emi && !purchase.has_warranty && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Paid via {purchase.payment_method}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
