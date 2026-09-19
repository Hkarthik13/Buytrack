'use client';

import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ReceiptScannerModal from '../receipt/ReceiptScannerModal';
import ReceiptReviewModal from '../receipt/ReceiptReviewModal';
import AddPurchaseModal from '../purchases/AddPurchaseModal';
import PurchaseDetailsModal from '../purchases/PurchaseDetailsModal';
import AskBuyTrackModal from '../ai/AskBuyTrackModal';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-mobile-nav">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals */}
      <ReceiptScannerModal />
      <ReceiptReviewModal />
      <AddPurchaseModal />
      <PurchaseDetailsModal />
      <AskBuyTrackModal />
    </div>
  );
}
