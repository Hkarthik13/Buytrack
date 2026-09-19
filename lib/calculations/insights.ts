import { Purchase, SmartInsight } from '@/types/database';
import { calculateWarrantyMetrics } from './warranty';

export interface DashboardMetrics {
  totalPurchasesAmount: number;
  totalPurchasesCount: number;
  monthlyEmiCommitment: number;
  activeEmiCount: number;
  upcomingEmiAmount: number;
  upcomingEmiDueDate: string | null;
  upcomingEmiDaysLeft: number | null;
  upcomingEmiProductName: string | null;
  warrantyExpiringSoonCount: number;
  activeWarrantyCount: number;
  expiredWarrantyCount: number;
  categorySpending: Record<string, number>;
  monthlySpending: { month: string; amount: number }[];
}

export function computeDashboardMetrics(purchases: Purchase[], currency = '₹'): DashboardMetrics {
  let totalPurchasesAmount = 0;
  const categorySpending: Record<string, number> = {};
  const monthlySpendingMap: Record<string, number> = {};
  let monthlyEmiCommitment = 0;
  let activeEmiCount = 0;
  let warrantyExpiringSoonCount = 0;
  let activeWarrantyCount = 0;
  let expiredWarrantyCount = 0;

  interface UpcomingEmiCandidate {
    productName: string;
    amount: number;
    dueDate: string;
    daysLeft: number;
  }
  const upcomingCandidates: UpcomingEmiCandidate[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  purchases.forEach((p) => {
    totalPurchasesAmount += p.final_price;

    // Category
    const cat = p.category || 'Other';
    categorySpending[cat] = (categorySpending[cat] || 0) + p.final_price;

    // Monthly spending trend
    if (p.purchase_date) {
      const pDate = new Date(p.purchase_date);
      if (!isNaN(pDate.getTime())) {
        const monthKey = pDate.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlySpendingMap[monthKey] = (monthlySpendingMap[monthKey] || 0) + p.final_price;
      }
    }

    // Warranty
    if (p.has_warranty && p.warranty) {
      const wMetrics = calculateWarrantyMetrics(
        p.warranty.warranty_start_date,
        p.warranty.warranty_end_date
      );
      if (wMetrics.status === 'Expiring Soon') {
        warrantyExpiringSoonCount++;
      } else if (wMetrics.status === 'Active') {
        activeWarrantyCount++;
      } else {
        expiredWarrantyCount++;
      }
    }

    // EMI
    if (p.has_emi && p.emi_plan) {
      const plan = p.emi_plan;
      if (plan.remaining_installments > 0) {
        activeEmiCount++;
        monthlyEmiCommitment += plan.monthly_emi;

        // check upcoming payments
        if (plan.payments) {
          const nextPending = plan.payments.find((pm) => pm.status !== 'Paid');
          if (nextPending) {
            const dueDate = new Date(nextPending.due_date);
            const daysLeft = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            upcomingCandidates.push({
              productName: p.product_name,
              amount: nextPending.amount,
              dueDate: nextPending.due_date,
              daysLeft,
            });
          }
        }
      }
    }
  });

  // Sort upcoming EMI candidate by closest due date
  upcomingCandidates.sort((a, b) => a.daysLeft - b.daysLeft);
  const nearestEmi = upcomingCandidates[0] || null;

  // Format monthly spending for charts (last 6 months chronological)
  const monthlySpending = Object.entries(monthlySpendingMap).map(([month, amount]) => ({
    month,
    amount,
  }));

  return {
    totalPurchasesAmount: Math.round(totalPurchasesAmount),
    totalPurchasesCount: purchases.length,
    monthlyEmiCommitment: Math.round(monthlyEmiCommitment),
    activeEmiCount,
    upcomingEmiAmount: nearestEmi ? nearestEmi.amount : 0,
    upcomingEmiDueDate: nearestEmi ? nearestEmi.dueDate : null,
    upcomingEmiDaysLeft: nearestEmi ? nearestEmi.daysLeft : null,
    upcomingEmiProductName: nearestEmi ? nearestEmi.productName : null,
    warrantyExpiringSoonCount,
    activeWarrantyCount,
    expiredWarrantyCount,
    categorySpending,
    monthlySpending,
  };
}

export function generateSmartInsights(purchases: Purchase[], currency = '₹'): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const metrics = computeDashboardMetrics(purchases, currency);

  if (metrics.activeEmiCount > 0) {
    insights.push({
      id: 'active-emis',
      type: 'info',
      title: 'Active EMI Commitment',
      message: `You currently have ${metrics.activeEmiCount} active EMI plan${
        metrics.activeEmiCount > 1 ? 's' : ''
      } with a monthly commitment of ${currency}${metrics.monthlyEmiCommitment.toLocaleString()}.`,
      action_label: 'View EMI Tracker',
      action_url: '/emi',
      icon: 'credit-card',
    });
  }

  if (metrics.upcomingEmiProductName && metrics.upcomingEmiDaysLeft !== null) {
    const isImminent = metrics.upcomingEmiDaysLeft <= 7;
    insights.push({
      id: 'upcoming-emi-due',
      type: isImminent ? 'warning' : 'info',
      title: 'Upcoming EMI Due Date',
      message: `EMI for ${metrics.upcomingEmiProductName} of ${currency}${metrics.upcomingEmiAmount.toLocaleString()} is due ${
        metrics.upcomingEmiDaysLeft <= 0
          ? 'today!'
          : `in ${metrics.upcomingEmiDaysLeft} days (${metrics.upcomingEmiDueDate})`
      }.`,
      action_label: 'Pay Installment',
      action_url: '/emi',
      icon: 'calendar',
    });
  }

  if (metrics.warrantyExpiringSoonCount > 0) {
    insights.push({
      id: 'warranties-expiring',
      type: 'alert',
      title: 'Warranty Alert',
      message: `You have ${metrics.warrantyExpiringSoonCount} purchase${
        metrics.warrantyExpiringSoonCount > 1 ? 's' : ''
      } whose warranty expires within 30 days. Review them now to claim service if needed.`,
      action_label: 'Inspect Warranties',
      action_url: '/warranties',
      icon: 'shield-alert',
    });
  }

  // Top category insight
  const categories = Object.entries(metrics.categorySpending).sort((a, b) => b[1] - a[1]);
  if (categories.length > 0) {
    const [topCat, topAmount] = categories[0];
    const pct = metrics.totalPurchasesAmount > 0 ? Math.round((topAmount / metrics.totalPurchasesAmount) * 100) : 0;
    insights.push({
      id: 'top-category',
      type: 'info',
      title: 'Highest Spending Category',
      message: `Your highest spend is in ${topCat} (${currency}${topAmount.toLocaleString()}, approx ${pct}% of total purchases).`,
      action_label: 'Explore Analytics',
      action_url: '/analytics',
      icon: 'pie-chart',
    });
  }

  return insights;
}
