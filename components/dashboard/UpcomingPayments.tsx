'use client';

import React from 'react';
import Link from 'next/link';
import { usePurchases } from '@/context/PurchaseContext';
import { CreditCard, Calendar, CheckCircle2, ChevronRight, ArrowUpRight } from 'lucide-react';

export default function UpcomingPayments() {
  const { purchases, currency, markInstallmentStatus, setSelectedPurchaseDetail } = usePurchases();

  // Find all pending installments across all active EMI plans
  const upcomingList: {
    purchaseId: string;
    productName: string;
    paymentId: string;
    installmentNumber: number;
    totalInstallments: number;
    dueDate: string;
    amount: number;
    status: string;
  }[] = [];

  purchases.forEach((p) => {
    if (p.has_emi && p.emi_plan?.payments) {
      p.emi_plan.payments
        .filter((pm) => pm.status !== 'Paid')
        .forEach((pm) => {
          upcomingList.push({
            purchaseId: p.id,
            productName: p.product_name,
            paymentId: pm.id,
            installmentNumber: pm.installment_number,
            totalInstallments: p.emi_plan!.number_of_installments,
            dueDate: pm.due_date,
            amount: pm.amount,
            status: pm.status,
          });
        });
    }
  });

  // Sort by due date
  upcomingList.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const displayed = upcomingList.slice(0, 4);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming EMI Payments
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Next scheduled installment dues
            </p>
          </div>
        </div>

        <Link
          href="/emi"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {displayed.length === 0 ? (
        <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            All Caught Up!
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            No upcoming EMI payments due.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((item) => (
            <div
              key={item.paymentId}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {item.productName}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    Due {item.dueDate}
                  </span>
                  <span>•</span>
                  <span>Installment {item.installmentNumber} of {item.totalInstallments}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    {currency}{item.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    {item.status}
                  </span>
                </div>

                <button
                  onClick={() => markInstallmentStatus(item.purchaseId, item.paymentId, 'Paid')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  Pay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
