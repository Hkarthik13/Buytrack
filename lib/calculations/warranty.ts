import { Warranty, WarrantyStatus } from '@/types/database';
import { formatDateISO } from './emi';

export interface WarrantyCalculationResult {
  status: WarrantyStatus;
  daysRemaining: number;
  totalDays: number;
  progressPercent: number; // 0% (fresh) to 100% (expired)
  isExpiringSoon: boolean; // within 30 days
  expiryLabel: string;
}

/**
 * Calculate accurate warranty metrics
 */
export function calculateWarrantyMetrics(
  startDateStr: string,
  endDateStr: string
): WarrantyCalculationResult {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay));
  const diffDays = Math.round((end.getTime() - today.getTime()) / msPerDay);

  let status: WarrantyStatus = 'Active';
  let daysRemaining = Math.max(0, diffDays);

  if (diffDays < 0) {
    status = 'Expired';
    daysRemaining = 0;
  } else if (diffDays <= 30) {
    status = 'Expiring Soon';
  } else {
    status = 'Active';
  }

  const elapsedDays = Math.max(0, Math.min(totalDays, totalDays - daysRemaining));
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

  let expiryLabel = '';
  if (diffDays < 0) {
    expiryLabel = `Expired ${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    expiryLabel = 'Expires today!';
  } else if (diffDays === 1) {
    expiryLabel = 'Expires tomorrow!';
  } else if (diffDays <= 30) {
    expiryLabel = `${diffDays} days left`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    expiryLabel = `${months} month${months > 1 ? 's' : ''} left (${diffDays} days)`;
  } else {
    const years = (diffDays / 365).toFixed(1);
    expiryLabel = `${years} years left (${diffDays} days)`;
  }

  return {
    status,
    daysRemaining,
    totalDays,
    progressPercent,
    isExpiringSoon: status === 'Expiring Soon',
    expiryLabel,
  };
}

/**
 * Calculate warranty end date given start date and duration in months
 */
export function calculateWarrantyEndDate(startDateStr: string, durationMonths: number): string {
  const d = new Date(startDateStr);
  if (isNaN(d.getTime())) return formatDateISO(new Date());
  d.setMonth(d.getMonth() + Number(durationMonths));
  return formatDateISO(d);
}

/**
 * Enrich a warranty object with current live stats
 */
export function enrichWarranty(w: Warranty): Warranty & WarrantyCalculationResult {
  const metrics = calculateWarrantyMetrics(w.warranty_start_date, w.warranty_end_date);
  return {
    ...w,
    ...metrics,
    days_remaining: metrics.daysRemaining,
  };
}
