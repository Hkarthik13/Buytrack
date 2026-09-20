'use client';

import React, { useState, useEffect } from 'react';
import { usePurchases } from '@/context/PurchaseContext';
import { ExtractedReceiptData, ProductCategory, PaymentMethod } from '@/types/database';
import { calculateEmi } from '@/lib/calculations/emi';
import { calculateWarrantyEndDate } from '@/lib/calculations/warranty';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Building,
  Calendar,
  Tag,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

export default function ReceiptReviewModal() {
  const { extractedReviewData, setExtractedReviewData, createPurchaseFromExtraction, currency } = usePurchases();

  const [formData, setFormData] = useState<ExtractedReceiptData>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (extractedReviewData?.data) {
      setFormData(extractedReviewData.data);
    }
  }, [extractedReviewData]);

  if (!extractedReviewData) return null;

  const categories: ProductCategory[] = [
    'Electronics',
    'Appliances',
    'Furniture',
    'Gadgets',
    'Automobile',
    'Fashion',
    'Home',
    'Other',
  ];

  const paymentMethods: PaymentMethod[] = [
    'EMI',
    'Credit Card',
    'Debit Card',
    'UPI',
    'Net Banking',
    'Cash',
    'Other',
  ];

  // Live calculated EMI summary
  const emiSummary = formData.has_emi
    ? calculateEmi({
        productPrice: formData.final_price || 0,
        downPayment: formData.down_payment || 0,
        tenureMonths: formData.tenure_months || 10,
        interestRateAnnual: formData.interest_rate || 0,
        startDate: formData.purchase_date,
      })
    : null;

  const warrantyEndDate =
    formData.has_warranty && formData.purchase_date && formData.warranty_duration_months
      ? calculateWarrantyEndDate(formData.purchase_date, formData.warranty_duration_months)
      : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createPurchaseFromExtraction(formData, extractedReviewData.receiptUrl);

      // Trigger Confetti
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      setExtractedReviewData(null);
    } catch (err) {
      console.error('Failed to save extracted purchase:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={() => setExtractedReviewData(null)}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Review Extracted Receipt
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Confirm or edit details before saving to your BuyTrack database.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.product_name || ''}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Brand
              </label>
              <input
                type="text"
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={formData.category || 'Electronics'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Store / Merchant */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Store / Merchant
              </label>
              <input
                type="text"
                value={formData.store || ''}
                onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Purchase Date
              </label>
              <input
                type="date"
                value={formData.purchase_date || ''}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

          </div>

          {/* Pricing Row */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Original Price ({currency})
                </label>
                <input
                  type="number"
                  value={formData.original_price || ''}
                  onChange={(e) => setFormData({ ...formData, original_price: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Discount ({currency})
                </label>
                <input
                  type="number"
                  value={formData.discount || 0}
                  onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Tax / GST ({currency})
                </label>
                <input
                  type="number"
                  value={formData.tax || 0}
                  onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                  Final Price ({currency}) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.final_price || ''}
                  onChange={(e) => setFormData({ ...formData, final_price: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 text-sm font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={formData.payment_method || (formData.has_emi ? 'EMI' : 'UPI')}
                onChange={(e) => {
                  const val = e.target.value as PaymentMethod;
                  setFormData({
                    ...formData,
                    payment_method: val,
                    has_emi: val === 'EMI' || formData.has_emi,
                  });
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Warranty Section Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Warranty Information
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.has_warranty)}
                  onChange={(e) => setFormData({ ...formData, has_warranty: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {formData.has_warranty && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={formData.warranty_duration_months || 12}
                    onChange={(e) => setFormData({ ...formData, warranty_duration_months: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Calculated Expiry Date
                  </label>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                    {warrantyEndDate || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* EMI Section Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  EMI & Financing Plan
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.has_emi)}
                  onChange={(e) => setFormData({ ...formData, has_emi: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {formData.has_emi && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Down Payment ({currency})
                    </label>
                    <input
                      type="number"
                      value={formData.down_payment || 0}
                      onChange={(e) => setFormData({ ...formData, down_payment: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Tenure (Months)
                    </label>
                    <input
                      type="number"
                      value={formData.tenure_months || 10}
                      onChange={(e) => setFormData({ ...formData, tenure_months: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Interest Rate % p.a.
                    </label>
                    <input
                      type="number"
                      value={formData.interest_rate || 0}
                      onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      Calculated Monthly EMI
                    </label>
                    <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                      {currency}{emiSummary?.monthlyEmi.toLocaleString() || '0'} / mo
                    </div>
                  </div>
                </div>

                {emiSummary && (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap gap-4 justify-between">
                    <span>Financed: <strong>{currency}{emiSummary.financedAmount.toLocaleString()}</strong></span>
                    <span>Total Interest: <strong>{currency}{emiSummary.totalInterest.toLocaleString()}</strong></span>
                    <span>Total Payable: <strong>{currency}{emiSummary.totalPayable.toLocaleString()}</strong></span>
                    <span>Completion: <strong>{emiSummary.completionDate}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes / Invoice details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Invoice Notes & Summary
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Invoice No, Store branch, etc."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setExtractedReviewData(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save to BuyTrack'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
