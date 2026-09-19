import { Purchase, NotificationPreference, EmiPayment, EmiStatus, UserProfile } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { INITIAL_DEMO_PURCHASES, DEMO_USER } from './demoData';
import { updateEmiPlanStats } from '../calculations/emi';

const STORAGE_KEY_PREFIX = 'buytrack_purchases_';
const PREFS_KEY_PREFIX = 'buytrack_prefs_';
const USERS_KEY = 'buytrack_registered_users';

/**
 * Get all purchases for a specific user
 */
export async function getPurchasesForUser(userId: string): Promise<Purchase[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          warranty:warranties(*),
          emi_plan:emi_plans(
            *,
            payments:emi_payments(*)
          )
        `)
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false });

      if (!error && data) {
        return data as Purchase[];
      }
      console.warn('Supabase fetch failed, falling back to local store:', error);
    } catch (e) {
      console.warn('Supabase exception, falling back to local store:', e);
    }
  }

  // Local storage fallback
  if (typeof window === 'undefined') return userId === DEMO_USER.id ? INITIAL_DEMO_PURCHASES : [];
  
  const key = `${STORAGE_KEY_PREFIX}${userId}`;
  const raw = localStorage.getItem(key);
  
  if (!raw) {
    if (userId === DEMO_USER.id) {
      localStorage.setItem(key, JSON.stringify(INITIAL_DEMO_PURCHASES));
      return INITIAL_DEMO_PURCHASES;
    }
    return [];
  }

  try {
    return JSON.parse(raw) as Purchase[];
  } catch {
    return [];
  }
}

/**
 * Save or update a purchase for a user
 */
export async function savePurchaseForUser(userId: string, purchase: Purchase): Promise<Purchase> {
  const isUpdate = Boolean(purchase.id);
  const now = new Date().toISOString();
  
  const record: Purchase = {
    ...purchase,
    id: purchase.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    created_at: purchase.created_at || now,
    updated_at: now,
  };

  // If Supabase is active
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Save purchase
      const { data: pData, error: pError } = await supabase
        .from('purchases')
        .upsert({
          id: record.id,
          user_id: record.user_id,
          product_name: record.product_name,
          brand: record.brand,
          category: record.category,
          store: record.store,
          purchase_date: record.purchase_date,
          original_price: record.original_price,
          discount: record.discount,
          tax: record.tax,
          final_price: record.final_price,
          payment_method: record.payment_method,
          receipt_image_url: record.receipt_image_url,
          notes: record.notes,
          has_warranty: record.has_warranty,
          has_emi: record.has_emi,
        })
        .select()
        .single();

      if (!pError && pData) {
        // 2. Save warranty if present
        if (record.has_warranty && record.warranty) {
          await supabase.from('warranties').upsert({
            id: record.warranty.id || `w_${record.id}`,
            purchase_id: record.id,
            warranty_duration_months: record.warranty.warranty_duration_months,
            warranty_start_date: record.warranty.warranty_start_date,
            warranty_end_date: record.warranty.warranty_end_date,
            warranty_type: record.warranty.warranty_type,
            notes: record.warranty.notes,
          });
        }

        // 3. Save EMI plan if present
        if (record.has_emi && record.emi_plan) {
          const planId = record.emi_plan.id || `emi_${record.id}`;
          await supabase.from('emi_plans').upsert({
            id: planId,
            purchase_id: record.id,
            total_amount: record.emi_plan.total_amount,
            down_payment: record.emi_plan.down_payment,
            financed_amount: record.emi_plan.financed_amount,
            monthly_emi: record.emi_plan.monthly_emi,
            number_of_installments: record.emi_plan.number_of_installments,
            paid_installments: record.emi_plan.paid_installments,
            remaining_installments: record.emi_plan.remaining_installments,
            start_date: record.emi_plan.start_date,
            next_due_date: record.emi_plan.next_due_date,
            completion_date: record.emi_plan.completion_date,
            interest_rate: record.emi_plan.interest_rate,
            total_payable: record.emi_plan.total_payable,
          });

          if (record.emi_plan.payments && record.emi_plan.payments.length > 0) {
            for (const pm of record.emi_plan.payments) {
              await supabase.from('emi_payments').upsert({
                id: pm.id,
                emi_plan_id: planId,
                installment_number: pm.installment_number,
                due_date: pm.due_date,
                amount: pm.amount,
                status: pm.status,
                paid_date: pm.paid_date || null,
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Supabase upsert error:', e);
    }
  }

  // Local sync
  if (typeof window !== 'undefined') {
    const key = `${STORAGE_KEY_PREFIX}${userId}`;
    const purchases = await getPurchasesForUser(userId);
    const index = purchases.findIndex((p) => p.id === record.id);
    if (index >= 0) {
      purchases[index] = record;
    } else {
      purchases.unshift(record);
    }
    localStorage.setItem(key, JSON.stringify(purchases));
  }

  return record;
}

/**
 * Delete a purchase
 */
export async function deletePurchaseForUser(userId: string, purchaseId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('purchases').delete().eq('id', purchaseId).eq('user_id', userId);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const key = `${STORAGE_KEY_PREFIX}${userId}`;
    const purchases = await getPurchasesForUser(userId);
    const updated = purchases.filter((p) => p.id !== purchaseId);
    localStorage.setItem(key, JSON.stringify(updated));
  }
  return true;
}

/**
 * Update an installment status (Paid / Pending / Overdue)
 */
export async function updateInstallmentStatus(
  userId: string,
  purchaseId: string,
  paymentId: string,
  newStatus: EmiStatus
): Promise<Purchase | null> {
  const purchases = await getPurchasesForUser(userId);
  const purchase = purchases.find((p) => p.id === purchaseId);
  if (!purchase || !purchase.emi_plan || !purchase.emi_plan.payments) return null;

  const now = new Date().toISOString().split('T')[0];
  const updatedPayments = purchase.emi_plan.payments.map((p) => {
    if (p.id === paymentId) {
      return {
        ...p,
        status: newStatus,
        paid_date: newStatus === 'Paid' ? now : undefined,
      };
    }
    return p;
  });

  const updatedPlan = updateEmiPlanStats(purchase.emi_plan, updatedPayments);
  const updatedPurchase: Purchase = {
    ...purchase,
    emi_plan: updatedPlan,
    updated_at: new Date().toISOString(),
  };

  await savePurchaseForUser(userId, updatedPurchase);
  return updatedPurchase;
}

/**
 * Notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreference> {
  const defaultPrefs: NotificationPreference = {
    id: `pref_${userId}`,
    user_id: userId,
    notify_30_days: true,
    notify_7_days: true,
    notify_1_day: true,
    emi_due_reminders: true,
    email_notifications: true,
    push_notifications: false,
  };

  if (typeof window === 'undefined') return defaultPrefs;
  const key = `${PREFS_KEY_PREFIX}${userId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return defaultPrefs;
  try {
    return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    return defaultPrefs;
  }
}

export async function saveNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  const current = await getNotificationPreferences(userId);
  const updated = { ...current, ...prefs };
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${PREFS_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  }
  return updated;
}

/**
 * Reset user demo dataset
 */
export function resetDemoData(userId: string): void {
  if (typeof window !== 'undefined') {
    const key = `${STORAGE_KEY_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(INITIAL_DEMO_PURCHASES));
  }
}
