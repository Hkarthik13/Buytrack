'use client';

import React, { useState } from 'react';
import { usePurchases } from '@/context/PurchaseContext';
import { calculateEmi } from '@/lib/calculations/emi';
import {
  Calculator,
  Percent,
  Calendar,
  CheckCircle2,
  DollarSign,
  PieChart as PieIcon,
  TrendingDown,
} from 'lucide-react';

export default function EmiCalculator() {
  const { currency } = usePurchases();

  const [productPrice, setProductPrice] = useState<number>(50000);
  const [downPayment, setDownPayment] = useState<number>(5000);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [interestRate, setInterestRate] = useState<number>(0); // 0 = No-cost
  const [processingFee, setProcessingFee] = useState<number>(0);
  const [isNoCost, setIsNoCost] = useState(true);

  const result = calculateEmi({
    productPrice,
    downPayment,
    tenureMonths,
    interestRateAnnual: isNoCost ? 0 : interestRate,
    processingFee,
  });

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Deterministic EMI Calculator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compute monthly installments, total interest & loan completion date accurately.
            </p>
          </div>
        </div>

        {/* No-cost toggle */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              setIsNoCost(true);
              setInterestRate(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              isNoCost
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            No-Cost EMI (0%)
          </button>
          <button
            onClick={() => {
              setIsNoCost(false);
              if (interestRate === 0) setInterestRate(14);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              !isNoCost
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Interest-Based EMI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Product Price */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <label className="text-slate-700 dark:text-slate-300">Product Price</label>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currency}{productPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={500000}
              step={1000}
              value={productPrice}
              onChange={(e) => setProductPrice(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Down Payment */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <label className="text-slate-700 dark:text-slate-300">Down Payment (Optional)</label>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{currency}{downPayment.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={0}
              max={productPrice}
              step={500}
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <label className="text-slate-700 dark:text-slate-300">Loan Tenure</label>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{tenureMonths} Months</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[3, 6, 9, 12, 24].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTenureMonths(t)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    tenureMonths === t
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {t}m
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate (if not No-Cost) */}
          {!isNoCost && (
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <label className="text-slate-700 dark:text-slate-300">Annual Interest Rate (% p.a.)</label>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{interestRate}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={36}
                step={0.5}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
              />
            </div>
          )}

        </div>

        {/* Output Summary Card */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-900/10 border border-indigo-200/50 dark:border-indigo-800/50 flex flex-col justify-between space-y-6">
          
          <div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Monthly Installment
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
              {currency}{result.monthlyEmi.toLocaleString()}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400"> / month</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-indigo-200/40 dark:border-indigo-800/40 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Principal Financed Amount:</span>
              <span className="font-bold text-slate-900 dark:text-white">{currency}{result.financedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Total Interest Payable:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {result.totalInterest > 0 ? `${currency}${result.totalInterest.toLocaleString()}` : '₹0 (No-Cost)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Total Amount Payable:</span>
              <span className="font-bold text-slate-900 dark:text-white">{currency}{result.totalPayable.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>First Due Date:</span>
              <span className="font-semibold">{result.nextDueDate}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Expected Completion Date:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{result.completionDate}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-[11px] text-slate-500 dark:text-slate-400">
            💡 Calculated using standard bank reducing balance amortization formula without rounding errors.
          </div>

        </div>

      </div>

    </div>
  );
}
