'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePurchases } from '@/context/PurchaseContext';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  ShieldCheck,
  Camera,
  Bot,
} from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { setIsScannerOpen, metrics } = usePurchases();

  const navItems = [
    { label: 'Home', href: '/', icon: LayoutDashboard },
    { label: 'Purchases', href: '/purchases', icon: Receipt },
    // Center is FAB
    { label: 'EMIs', href: '/emi', icon: CreditCard, badge: metrics.activeEmiCount },
    { label: 'Warranties', href: '/warranties', icon: ShieldCheck, badge: metrics.warrantyExpiringSoonCount },
    { label: 'Ask AI', href: '/ask', icon: Bot },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800/90 px-3 py-2">
      <div className="flex items-center justify-around relative">
        
        {/* Item 1: Home */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            pathname === '/'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>

        {/* Item 2: Purchases */}
        <Link
          href="/purchases"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            pathname === '/purchases'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px]">Purchases</span>
        </Link>

        {/* Center Floating Action Button: Scan Receipt */}
        <div className="flex flex-col items-center -mt-6">
          <button
            onClick={() => setIsScannerOpen(true)}
            aria-label="Scan Receipt"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-transform"
          >
            <Camera className="w-5 h-5" />
          </button>
          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">Scan</span>
        </div>

        {/* Item 3: EMIs */}
        <Link
          href="/emi"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all relative ${
            pathname === '/emi'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <div className="relative">
            <CreditCard className="w-5 h-5" />
            {metrics.activeEmiCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500" />
            )}
          </div>
          <span className="text-[10px]">EMIs</span>
        </Link>

        {/* Item 4: Warranties */}
        <Link
          href="/warranties"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all relative ${
            pathname === '/warranties'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <div className="relative">
            <ShieldCheck className="w-5 h-5" />
            {metrics.warrantyExpiringSoonCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </div>
          <span className="text-[10px]">Warranty</span>
        </Link>

        {/* Item 5: Ask AI */}
        <Link
          href="/ask"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            pathname === '/ask'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px]">Ask AI</span>
        </Link>

      </div>
    </nav>
  );
}
