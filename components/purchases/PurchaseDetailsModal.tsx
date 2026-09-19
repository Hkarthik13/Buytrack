'use client';

import React, { useState } from 'react';
import { usePurchases } from '@/context/PurchaseContext';
import { calculateWarrantyMetrics } from '@/lib/calculations/warranty';
import { EmiStatus } from '@/types/database';
import {
  X,
  Trash2,
  Calendar,
  Store,
  Tag,
  ShieldCheck,
  CreditCard,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function PurchaseDetailsModal() {
  const {
    selectedPurchaseDetail,
    setSelectedPurchaseDetail,
    deletePurchase,
    markInstallmentStatus,
    currency,
  } = usePurchases();

  const [activeTab, setActiveTab] = useState<'overview' | 'emi' | 'warranty' | 'receipt'>('overview');
  const [showReceiptFull, setShowReceiptFull] = useState(false);

  if (!selectedPurchaseDetail) return null;

  const p = selectedPurchaseDetail;
  const warrantyMetrics = p.has_warranty && p.warranty
    ? calculateWarrantyMetrics(p.warranty.warranty_start_date, p.warranty.warranty_end_date)
    : null;

  const emi = p.has_emi ? p.emi_plan : null;
  const emiProgress = emi && emi.number_of_installments > 0
    ? Math.round((emi.paid_installments / emi.number_of_installments) * 100)
    : 0;

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${p.product_name}"?`)) {
      await deletePurchase(p.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {p.category}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {p.brand}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {p.product_name}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{p.store}</span>
              <span>•</span>
              <span>Purchased on {p.purchase_date}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Delete Purchase"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedPurchaseDetail(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors shrink-0 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Overview & Pricing
          </button>

          {p.has_emi && (
            <button
              onClick={() => setActiveTab('emi')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'emi'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>EMI Plan ({emi?.paid_installments}/{emi?.number_of_installments})</span>
            </button>
          )}

          {p.has_warranty && (
            <button
              onClick={() => setActiveTab('warranty')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'warranty'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Warranty ({warrantyMetrics?.status})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('receipt')}
            className={`py-3 border-b-2 transition-colors shrink-0 ${
              activeTab === 'receipt'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Receipt Document
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Big Price Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/50 dark:border-indigo-800/40 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Final Purchase Price</span>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {currency}{p.final_price.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-sm">
                    Paid via {p.payment_method}
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Original Price</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {currency}{p.original_price.toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Discount Saved</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    - {currency}{p.discount.toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tax / GST</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {currency}{p.tax.toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Store / Seller</span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                    {p.store}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {p.notes && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{p.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EMI SCHEDULE & DETAILS */}
          {activeTab === 'emi' && emi && (
            <div className="space-y-6">
              {/* Progress and Summary */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                      EMI Repayment Progress
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {emi.paid_installments} of {emi.number_of_installments} Installments Paid ({emiProgress}%)
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Monthly Installment</span>
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {currency}{emi.monthly_emi.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${emiProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Down Payment</span>
                    <p className="font-bold text-slate-900 dark:text-white">{currency}{emi.down_payment.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Financed Amount</span>
                    <p className="font-bold text-slate-900 dark:text-white">{currency}{emi.financed_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Next Due Date</span>
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{emi.next_due_date}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Completion Date</span>
                    <p className="font-bold text-slate-900 dark:text-white">{emi.completion_date}</p>
                  </div>
                </div>
              </div>

              {/* Installment Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Installment Schedule ({emi.payments?.length || 0} Payments)
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {emi.payments?.map((pm) => (
                        <tr key={pm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                            {pm.installment_number}
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
                              {pm.status === 'Paid' ? 'Mark Pending' : 'Mark as Paid'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WARRANTY */}
          {activeTab === 'warranty' && p.warranty && warrantyMetrics && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border border-emerald-200/50 dark:border-emerald-800/40 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Warranty Status
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {warrantyMetrics.expiryLabel}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      warrantyMetrics.status === 'Active'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        : warrantyMetrics.status === 'Expiring Soon'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {warrantyMetrics.status}
                  </span>
                </div>

                {/* Warranty Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      warrantyMetrics.status === 'Active'
                        ? 'bg-emerald-500'
                        : warrantyMetrics.status === 'Expiring Soon'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${warrantyMetrics.progressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Coverage Duration</span>
                    <p className="font-bold text-slate-900 dark:text-white">{p.warranty.warranty_duration_months} Months</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Warranty Start</span>
                    <p className="font-bold text-slate-900 dark:text-white">{p.warranty.warranty_start_date}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Expiration Date</span>
                    <p className="font-bold text-slate-900 dark:text-white">{p.warranty.warranty_end_date}</p>
                  </div>
                </div>

                {p.warranty.notes && (
                  <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 border-t border-emerald-100 dark:border-emerald-900/30">
                    <p><strong>Coverage Notes:</strong> {p.warranty.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RECEIPT */}
          {activeTab === 'receipt' && (
            <div className="space-y-4">
              {p.receipt_image_url ? (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center max-h-96">
                    <img
                      src={p.receipt_image_url}
                      alt="Receipt Document"
                      className="max-h-96 w-auto object-contain rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={p.receipt_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Image</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No receipt image was attached to this purchase.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
