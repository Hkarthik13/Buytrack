'use client';

import React, { useState } from 'react';
import { usePurchases } from '@/context/PurchaseContext';
import { ProductCategory, PaymentMethod, Purchase } from '@/types/database';
import { calculateEmi, generateInstallmentSchedule } from '@/lib/calculations/emi';
import { calculateWarrantyEndDate } from '@/lib/calculations/warranty';
import confetti from 'canvas-confetti';
import {
  X,
  Plus,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

export default function AddPurchaseModal() {
  const { isAddModalOpen, setIsAddModalOpen, addPurchase, currency } = usePurchases();

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Electronics');
  const [store, setStore] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');

  // Warranty
  const [hasWarranty, setHasWarranty] = useState(true);
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [warrantyType, setWarrantyType] = useState<'Manufacturer' | 'Extended' | 'Seller'>('Manufacturer');

  // EMI
  const [hasEmi, setHasEmi] = useState(false);
  const [downPayment, setDownPayment] = useState(0);
  const [tenureMonths, setTenureMonths] = useState(10);
  const [interestRate, setInterestRate] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddModalOpen) return null;

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
    'UPI',
    'Credit Card',
    'Debit Card',
    'Net Banking',
    'Cash',
    'EMI',
    'Other',
  ];

  const handlePriceChange = (orig: number, disc: number, tx: number) => {
    setOriginalPrice(orig);
    setDiscount(disc);
    setTax(tx);
    const calculatedFinal = Math.max(0, orig - disc + tx);
    setFinalPrice(calculatedFinal);
  };

  const emiCalc = hasEmi
    ? calculateEmi({
        productPrice: finalPrice,
        downPayment,
        tenureMonths,
        interestRateAnnual: interestRate,
        startDate: purchaseDate,
      })
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const purchaseId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      
      let warrantyObj = undefined;
      if (hasWarranty) {
        warrantyObj = {
          id: `w_${purchaseId}`,
          purchase_id: purchaseId,
          warranty_duration_months: warrantyMonths,
          warranty_start_date: purchaseDate,
          warranty_end_date: calculateWarrantyEndDate(purchaseDate, warrantyMonths),
          warranty_type: warrantyType,
          notes: 'Manually added purchase warranty',
        };
      }

      let emiObj = undefined;
      if (hasEmi && emiCalc) {
        const planId = `emi_${purchaseId}`;
        emiObj = {
          id: planId,
          purchase_id: purchaseId,
          total_amount: emiCalc.totalPayable,
          down_payment: emiCalc.downPayment,
          financed_amount: emiCalc.financedAmount,
          monthly_emi: emiCalc.monthlyEmi,
          number_of_installments: emiCalc.tenureMonths,
          paid_installments: 0,
          remaining_installments: emiCalc.tenureMonths,
          start_date: emiCalc.startDate,
          next_due_date: emiCalc.nextDueDate,
          completion_date: emiCalc.completionDate,
          interest_rate: emiCalc.interestRateAnnual,
          total_payable: emiCalc.totalPayable,
          payments: generateInstallmentSchedule(planId, emiCalc.monthlyEmi, emiCalc.tenureMonths, emiCalc.startDate),
        };
      }

      const newP: Purchase = {
        id: purchaseId,
        user_id: '',
        product_name: productName,
        brand: brand || 'Generic',
        category,
        store: store || 'Retail Store',
        purchase_date: purchaseDate,
        original_price: originalPrice || finalPrice,
        discount,
        tax,
        final_price: finalPrice,
        payment_method: hasEmi ? 'EMI' : paymentMethod,
        notes,
        has_warranty: hasWarranty,
        has_emi: hasEmi,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        warranty: warrantyObj,
        emi_plan: emiObj,
      };

      await addPurchase(newP);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to add purchase:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={() => setIsAddModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Add New Purchase
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter product, price, warranty and EMI details.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sony Bravia 55' OLED TV"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand
              </label>
              <input
                type="text"
                placeholder="e.g. Sony, Apple, Samsung"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store / Seller
              </label>
              <input
                type="text"
                placeholder="e.g. Amazon, Croma, Reliance"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

          </div>

          {/* Pricing Block */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Original Price ({currency})
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={originalPrice || ''}
                  onChange={(e) => handlePriceChange(Number(e.target.value), discount, tax)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Discount ({currency})
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={discount || ''}
                  onChange={(e) => handlePriceChange(originalPrice, Number(e.target.value), tax)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Tax ({currency})
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={tax || ''}
                  onChange={(e) => handlePriceChange(originalPrice, discount, Number(e.target.value))}
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
                  placeholder="0"
                  value={finalPrice || ''}
                  onChange={(e) => setFinalPrice(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 text-sm font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const val = e.target.value as PaymentMethod;
                  setPaymentMethod(val);
                  if (val === 'EMI') setHasEmi(true);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Warranty Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Warranty Coverage
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasWarranty}
                  onChange={(e) => setHasWarranty(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {hasWarranty && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Warranty Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Warranty Type
                  </label>
                  <select
                    value={warrantyType}
                    onChange={(e) => setWarrantyType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  >
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Extended">Extended Warranty</option>
                    <option value="Seller">Seller Warranty</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* EMI Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  EMI Installment Plan
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEmi}
                  onChange={(e) => setHasEmi(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {hasEmi && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Down Payment ({currency})
                    </label>
                    <input
                      type="number"
                      value={downPayment || ''}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Tenure (Months)
                    </label>
                    <input
                      type="number"
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Interest % p.a.
                    </label>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      Monthly EMI
                    </label>
                    <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                      {currency}{emiCalc?.monthlyEmi.toLocaleString() || 0} / mo
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Invoice number, serial number, extended protection notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Add Purchase'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
