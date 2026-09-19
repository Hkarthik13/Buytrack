'use client';

import React, { useState } from 'react';
import { usePurchases } from '@/context/PurchaseContext';
import EmiCalculator from '@/components/emi/EmiCalculator';
import {
  CreditCard,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Percent,
} from 'lucide-react';

export default function EmiPage() {
  const { purchases, currency, markInstallmentStatus, setSelectedPurchaseDetail } = usePurchases();
  const [activeTab, setActiveTab] = useState<'plans' | 'calculator'>('plans');

  const emiPurchases = purchases.filter((p) => p.has_emi && p.emi_plan);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            EMI Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track financing plans, payment schedules, loan completion dates & calculate new EMIs
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'plans'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Active EMI Plans ({emiPurchases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'calculator'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>EMI Calculator</span>
          </button>
        </div>
      </div>

      {activeTab === 'calculator' ? (
        <EmiCalculator />
      ) : (
        <div className="space-y-6">
          {emiPurchases.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No Active EMI Plans
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  When you add or scan a purchase with EMI financing, its payment schedule and progress will appear here.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('calculator')}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Open EMI Calculator
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {emiPurchases.map((p) => {
                const plan = p.emi_plan!;
                const progressPct = plan.number_of_installments > 0
                  ? Math.round((plan.paid_installments / plan.number_of_installments) * 100)
                  : 0;

                const remainingAmount = plan.remaining_installments * plan.monthly_emi;

                return (
                  <div
                    key={p.id}
                    className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                            {p.category}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{p.brand}</span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                          {p.product_name}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Purchased from {p.store} on {p.purchase_date}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Monthly EMI</span>
                        <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                          {currency}{plan.monthly_emi.toLocaleString()}
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> / mo</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {plan.interest_rate > 0 ? `${plan.interest_rate}% p.a. interest` : 'No-Cost (0% Interest)'}
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">
                          Repayment Progress: {plan.paid_installments} of {plan.number_of_installments} Paid
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progressPct}% Complete</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5">
                        <div
                          className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Stat Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block">Total Product Price</span>
                        <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{currency}{p.final_price.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Down Payment</span>
                        <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{currency}{plan.down_payment.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Financed Loan</span>
                        <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{currency}{plan.financed_amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Remaining Balance</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">{currency}{remainingAmount.toLocaleString()} ({plan.remaining_installments} left)</span>
                      </div>
                    </div>

                    {/* Key Dates Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span className="text-slate-600 dark:text-slate-300">
                          Next Due Date: <strong className="text-indigo-600 dark:text-indigo-400">{plan.next_due_date}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300">
                          Expected Completion: <strong className="text-slate-900 dark:text-white">{plan.completion_date}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Installments Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                        Installment Schedule
                      </h4>
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Installment</th>
                              <th className="py-2.5 px-3">Due Date</th>
                              <th className="py-2.5 px-3">Amount</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {plan.payments?.map((pm) => (
                              <tr key={pm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                  #{pm.installment_number}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                                  {pm.due_date}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                  {currency}{pm.amount.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      pm.status === 'Paid'
                                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                        : pm.status === 'Overdue'
                                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                                    }`}
                                  >
                                    {pm.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() =>
                                      markInstallmentStatus(
                                        p.id,
                                        pm.id,
                                        pm.status === 'Paid' ? 'Pending' : 'Paid'
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                      pm.status === 'Paid'
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                    }`}
                                  >
                                    {pm.status === 'Paid' ? 'Undo (Pending)' : 'Mark as Paid'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
