import { EmiPayment, EmiPlan, EmiStatus } from '@/types/database';

export interface EmiCalculationInput {
  productPrice: number;
  downPayment: number;
  tenureMonths: number;
  interestRateAnnual: number; // e.g. 0 for No-Cost, 12 for 12% p.a.
  processingFee?: number;
  calculationType?: 'reducing' | 'flat' | 'nocost';
  startDate?: string; // YYYY-MM-DD
}

export interface EmiCalculationResult {
  productPrice: number;
  downPayment: number;
  financedAmount: number;
  interestRateAnnual: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalPayable: number;
  processingFee: number;
  completionDate: string;
  startDate: string;
  nextDueDate: string;
}

/**
 * Format a date object to YYYY-MM-DD
 */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add months to a given date safely
 */
export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + months);
    return formatDateISO(fallback);
  }
  const currentDay = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Handle edge-cases like Jan 31 + 1 month -> Feb 28/29
  if (d.getDate() !== currentDay) {
    d.setDate(0);
  }
  return formatDateISO(d);
}

/**
 * Deterministic calculation for EMI
 */
export function calculateEmi(input: EmiCalculationInput): EmiCalculationResult {
  const productPrice = Math.max(0, Number(input.productPrice) || 0);
  const downPayment = Math.max(0, Math.min(productPrice, Number(input.downPayment) || 0));
  const financedAmount = Math.max(0, productPrice - downPayment);
  const tenureMonths = Math.max(1, Math.floor(Number(input.tenureMonths) || 1));
  const interestRateAnnual = Math.max(0, Number(input.interestRateAnnual) || 0);
  const processingFee = Math.max(0, Number(input.processingFee) || 0);
  const startDate = input.startDate || formatDateISO(new Date());

  let monthlyEmi = 0;
  let totalInterest = 0;

  if (interestRateAnnual === 0 || input.calculationType === 'nocost' || financedAmount === 0) {
    // No-Cost EMI
    monthlyEmi = financedAmount > 0 ? Math.round((financedAmount / tenureMonths) * 100) / 100 : 0;
    totalInterest = 0;
  } else if (input.calculationType === 'flat') {
    // Flat Rate
    const years = tenureMonths / 12;
    totalInterest = Math.round(financedAmount * (interestRateAnnual / 100) * years * 100) / 100;
    monthlyEmi = Math.round(((financedAmount + totalInterest) / tenureMonths) * 100) / 100;
  } else {
    // Standard Reducing Balance (Standard Bank formula)
    const monthlyRate = interestRateAnnual / (12 * 100);
    const compound = Math.pow(1 + monthlyRate, tenureMonths);
    if (compound === 1 || isNaN(compound)) {
      monthlyEmi = Math.round((financedAmount / tenureMonths) * 100) / 100;
    } else {
      monthlyEmi = Math.round(((financedAmount * monthlyRate * compound) / (compound - 1)) * 100) / 100;
    }
    totalInterest = Math.max(0, Math.round((monthlyEmi * tenureMonths - financedAmount) * 100) / 100);
  }

  const totalPayable = Math.round((downPayment + monthlyEmi * tenureMonths + processingFee) * 100) / 100;
  const nextDueDate = addMonths(startDate, 1);
  const completionDate = addMonths(startDate, tenureMonths);

  return {
    productPrice,
    downPayment,
    financedAmount,
    interestRateAnnual,
    tenureMonths,
    monthlyEmi,
    totalInterest,
    totalPayable,
    processingFee,
    startDate,
    nextDueDate,
    completionDate,
  };
}

/**
 * Generate full installment schedule for an EMI plan
 */
export function generateInstallmentSchedule(
  planId: string,
  monthlyEmi: number,
  tenureMonths: number,
  startDate: string
): EmiPayment[] {
  const schedule: EmiPayment[] = [];
  const todayStr = formatDateISO(new Date());

  for (let i = 1; i <= tenureMonths; i++) {
    const dueDate = addMonths(startDate, i);
    let status: EmiStatus = 'Pending';
    if (dueDate < todayStr) {
      status = 'Pending'; // or Overdue if past
    }

    schedule.push({
      id: `payment_${planId}_${i}`,
      emi_plan_id: planId,
      installment_number: i,
      due_date: dueDate,
      amount: monthlyEmi,
      status: status,
    });
  }

  return schedule;
}

/**
 * Recalculate EMI Plan aggregates after payment status modification
 */
export function updateEmiPlanStats(plan: EmiPlan, payments: EmiPayment[]): EmiPlan {
  const paidList = payments.filter((p) => p.status === 'Paid');
  const paidCount = paidList.length;
  const remainingCount = Math.max(0, plan.number_of_installments - paidCount);

  // Find next pending or overdue payment
  const upcomingPayments = payments
    .filter((p) => p.status !== 'Paid')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const nextDue = upcomingPayments.length > 0 ? upcomingPayments[0].due_date : plan.completion_date;

  return {
    ...plan,
    paid_installments: paidCount,
    remaining_installments: remainingCount,
    next_due_date: nextDue,
    payments: payments,
  };
}
