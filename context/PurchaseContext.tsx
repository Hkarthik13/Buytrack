'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Purchase, EmiStatus, ProductCategory, ExtractedReceiptData, SmartInsight } from '@/types/database';
import { useAuth } from './AuthContext';
import {
  getPurchasesForUser,
  savePurchaseForUser,
  deletePurchaseForUser,
  updateInstallmentStatus,
  resetDemoData,
} from '@/lib/storage/store';
import { computeDashboardMetrics, generateSmartInsights, DashboardMetrics } from '@/lib/calculations/insights';
import { calculateEmi, generateInstallmentSchedule } from '@/lib/calculations/emi';
import { calculateWarrantyEndDate } from '@/lib/calculations/warranty';

interface PurchaseContextType {
  purchases: Purchase[];
  isLoading: boolean;
  metrics: DashboardMetrics;
  insights: SmartInsight[];
  currency: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedWarrantyFilter: string;
  setSelectedWarrantyFilter: (w: string) => void;
  selectedEmiFilter: string;
  setSelectedEmiFilter: (e: string) => void;
  filteredPurchases: Purchase[];
  
  // Actions
  addPurchase: (purchase: Purchase) => Promise<Purchase>;
  updatePurchase: (purchase: Purchase) => Promise<Purchase>;
  deletePurchase: (id: string) => Promise<void>;
  markInstallmentStatus: (purchaseId: string, paymentId: string, status: EmiStatus) => Promise<void>;
  createPurchaseFromExtraction: (extracted: ExtractedReceiptData, receiptUrl?: string) => Promise<Purchase>;
  resetUserDemoPurchases: () => Promise<void>;
  refreshPurchases: () => Promise<void>;

  // Modals & UI state
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;
  isCalculatorOpen: boolean;
  setIsCalculatorOpen: (open: boolean) => void;
  selectedPurchaseDetail: Purchase | null;
  setSelectedPurchaseDetail: (p: Purchase | null) => void;
  extractedReviewData: { data: ExtractedReceiptData; receiptUrl?: string } | null;
  setExtractedReviewData: (d: { data: ExtractedReceiptData; receiptUrl?: string } | null) => void;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWarrantyFilter, setSelectedWarrantyFilter] = useState('All');
  const [selectedEmiFilter, setSelectedEmiFilter] = useState('All');

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<Purchase | null>(null);
  const [extractedReviewData, setExtractedReviewData] = useState<{ data: ExtractedReceiptData; receiptUrl?: string } | null>(null);

  const currency = user?.currency || '₹';

  const loadData = async () => {
    if (!user) {
      setPurchases([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const list = await getPurchasesForUser(user.id);
      setPurchases(list);
    } catch (e) {
      console.error('Failed to load purchases:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const addPurchase = async (purchase: Purchase): Promise<Purchase> => {
    if (!user) throw new Error('Must be logged in');
    const saved = await savePurchaseForUser(user.id, purchase);
    setPurchases((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
    return saved;
  };

  const updatePurchase = async (purchase: Purchase): Promise<Purchase> => {
    if (!user) throw new Error('Must be logged in');
    const saved = await savePurchaseForUser(user.id, purchase);
    setPurchases((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    if (selectedPurchaseDetail && selectedPurchaseDetail.id === saved.id) {
      setSelectedPurchaseDetail(saved);
    }
    return saved;
  };

  const deletePurchase = async (id: string): Promise<void> => {
    if (!user) throw new Error('Must be logged in');
    await deletePurchaseForUser(user.id, id);
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    if (selectedPurchaseDetail && selectedPurchaseDetail.id === id) {
      setSelectedPurchaseDetail(null);
    }
  };

  const markInstallmentStatus = async (
    purchaseId: string,
    paymentId: string,
    status: EmiStatus
  ): Promise<void> => {
    if (!user) return;
    const updated = await updateInstallmentStatus(user.id, purchaseId, paymentId, status);
    if (updated) {
      setPurchases((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (selectedPurchaseDetail && selectedPurchaseDetail.id === updated.id) {
        setSelectedPurchaseDetail(updated);
      }
    }
  };

  const createPurchaseFromExtraction = async (
    extracted: ExtractedReceiptData,
    receiptUrl?: string
  ): Promise<Purchase> => {
    if (!user) throw new Error('User not logged in');

    const purchaseId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const purchaseDate = extracted.purchase_date || new Date().toISOString().split('T')[0];
    const finalPrice = extracted.final_price || extracted.original_price || 0;

    let warrantyObj = undefined;
    if (extracted.has_warranty && extracted.warranty_duration_months) {
      const dur = extracted.warranty_duration_months;
      warrantyObj = {
        id: `w_${purchaseId}`,
        purchase_id: purchaseId,
        warranty_duration_months: dur,
        warranty_start_date: purchaseDate,
        warranty_end_date: calculateWarrantyEndDate(purchaseDate, dur),
        warranty_type: 'Manufacturer' as const,
        notes: extracted.notes || 'Auto-registered from receipt scan',
      };
    }

    let emiPlanObj = undefined;
    if (extracted.has_emi && (extracted.monthly_emi || extracted.tenure_months)) {
      const tenure = extracted.tenure_months || 10;
      const downPay = extracted.down_payment || 0;
      const rate = extracted.interest_rate || 0;

      const emiCalc = calculateEmi({
        productPrice: finalPrice,
        downPayment: downPay,
        tenureMonths: tenure,
        interestRateAnnual: rate,
        startDate: purchaseDate,
      });

      const planId = `emi_${purchaseId}`;
      emiPlanObj = {
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

    const newPurchase: Purchase = {
      id: purchaseId,
      user_id: user.id,
      product_name: extracted.product_name || 'Scanned Purchase',
      brand: extracted.brand || 'Generic',
      category: (extracted.category as ProductCategory) || 'Electronics',
      store: extracted.store || 'Retail Store',
      purchase_date: purchaseDate,
      original_price: extracted.original_price || finalPrice,
      discount: extracted.discount || 0,
      tax: extracted.tax || 0,
      final_price: finalPrice,
      payment_method: extracted.payment_method || (extracted.has_emi ? 'EMI' : 'UPI'),
      receipt_image_url: receiptUrl,
      notes: extracted.notes,
      has_warranty: Boolean(warrantyObj),
      has_emi: Boolean(emiPlanObj),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      warranty: warrantyObj,
      emi_plan: emiPlanObj,
    };

    const saved = await addPurchase(newPurchase);
    return saved;
  };

  const resetUserDemoPurchases = async () => {
    if (!user) return;
    resetDemoData(user.id);
    await loadData();
  };

  const refreshPurchases = async () => {
    await loadData();
  };

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      // Search text
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = p.product_name.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchStore = p.store.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchMethod = p.payment_method.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchStore && !matchCategory && !matchMethod) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }

      // Warranty
      if (selectedWarrantyFilter !== 'All') {
        if (selectedWarrantyFilter === 'Has Warranty' && !p.has_warranty) return false;
        if (selectedWarrantyFilter === 'No Warranty' && p.has_warranty) return false;
      }

      // EMI
      if (selectedEmiFilter !== 'All') {
        if (selectedEmiFilter === 'Active EMI' && (!p.has_emi || (p.emi_plan && p.emi_plan.remaining_installments === 0))) return false;
        if (selectedEmiFilter === 'No EMI' && p.has_emi) return false;
      }

      return true;
    });
  }, [purchases, searchQuery, selectedCategory, selectedWarrantyFilter, selectedEmiFilter]);

  // Derived metrics and insights
  const metrics = useMemo(() => computeDashboardMetrics(purchases, currency), [purchases, currency]);
  const insights = useMemo(() => generateSmartInsights(purchases, currency), [purchases, currency]);

  return (
    <PurchaseContext.Provider
      value={{
        purchases,
        isLoading,
        metrics,
        insights,
        currency,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedWarrantyFilter,
        setSelectedWarrantyFilter,
        selectedEmiFilter,
        setSelectedEmiFilter,
        filteredPurchases,
        addPurchase,
        updatePurchase,
        deletePurchase,
        markInstallmentStatus,
        createPurchaseFromExtraction,
        resetUserDemoPurchases,
        refreshPurchases,
        isScannerOpen,
        setIsScannerOpen,
        isAddModalOpen,
        setIsAddModalOpen,
        isAiModalOpen,
        setIsAiModalOpen,
        isCalculatorOpen,
        setIsCalculatorOpen,
        selectedPurchaseDetail,
        setSelectedPurchaseDetail,
        extractedReviewData,
        setExtractedReviewData,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchases must be used within a PurchaseProvider');
  }
  return context;
}
