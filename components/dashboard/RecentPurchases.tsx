'use client';

import React from 'react';
import Link from 'next/link';
import { usePurchases } from '@/context/PurchaseContext';
import { calculateWarrantyMetrics } from '@/lib/calculations/warranty';
import {
  Receipt,
  Tv,
  Laptop,
  Headphones,
  Watch,
  Refrigerator,
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

export default function RecentPurchases() {
  const { purchases, currency, setSelectedPurchaseDetail, setIsScannerOpen } = usePurchases();

  const getProductIcon = (category: string, name: string) => {
    const n = name.toLowerCase();
    if (n.includes('tv') || n.includes('television')) return Tv;
    if (n.includes('laptop') || n.includes('thinkpad') || n.includes('macbook')) return Laptop;
    if (n.includes('headphone') || n.includes('audio') || n.includes('earbuds')) return Headphones;
    if (n.includes('watch')) return Watch;
    if (n.includes('fridge') || n.includes('refrigerator')) return Refrigerator;
    return ShoppingBag;
  };

  const recent = purchases.slice(0, 5);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Purchases
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Latest tracked assets and orders
            </p>
          </div>
        </div>

        <Link
          href="/purchases"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>All Purchases ({purchases.length})</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No purchases registered yet
          </p>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
          >
            Scan Your First Receipt
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recent.map((p) => {
            const Icon = getProductIcon(p.category, p.product_name);
            const wMetrics = p.has_warranty && p.warranty
              ? calculateWarrantyMetrics(p.warranty.warranty_start_date, p.warranty.warranty_end_date)
              : null;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPurchaseDetail(p)}
                className="py-3.5 flex items-center justify-between gap-4 cursor-pointer group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:scale-105 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 transition-all shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {p.product_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>{p.store}</span>
                      <span>•</span>
                      <span>{p.purchase_date}</span>
                      {p.has_emi && (
                        <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-medium">
                          <CreditCard className="w-3 h-3" />
                          EMI
                        </span>
                      )}
                      {p.has_warranty && (
                        <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          {wMetrics?.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    {currency}{p.final_price.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {p.payment_method}
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
