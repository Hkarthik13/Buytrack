export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Cash' | 'EMI' | 'Other';
export type ProductCategory = 'Electronics' | 'Appliances' | 'Furniture' | 'Gadgets' | 'Automobile' | 'Fashion' | 'Home' | 'Other';
export type WarrantyStatus = 'Active' | 'Expiring Soon' | 'Expired';
export type EmiStatus = 'Pending' | 'Paid' | 'Overdue';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  currency: string;
  created_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  product_name: string;
  brand: string;
  category: ProductCategory;
  store: string;
  purchase_date: string; // ISO string (YYYY-MM-DD)
  original_price: number;
  discount: number;
  tax: number;
  final_price: number;
  payment_method: PaymentMethod;
  receipt_image_url?: string;
  receipt_thumbnail?: string;
  notes?: string;
  has_warranty: boolean;
  has_emi: boolean;
  created_at: string;
  updated_at: string;
  warranty?: Warranty;
  emi_plan?: EmiPlan;
}

export interface Warranty {
  id: string;
  purchase_id: string;
  warranty_duration_months: number;
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_type: 'Manufacturer' | 'Extended' | 'Seller' | 'None';
  notes?: string;
  status?: WarrantyStatus;
  days_remaining?: number;
}

export interface EmiPayment {
  id: string;
  emi_plan_id: string;
  installment_number: number;
  due_date: string; // YYYY-MM-DD
  amount: number;
  status: EmiStatus;
  paid_date?: string;
}

export interface EmiPlan {
  id: string;
  purchase_id: string;
  total_amount: number;
  down_payment: number;
  financed_amount: number;
  monthly_emi: number;
  number_of_installments: number;
  paid_installments: number;
  remaining_installments: number;
  start_date: string; // YYYY-MM-DD
  next_due_date: string; // YYYY-MM-DD
  completion_date: string; // YYYY-MM-DD
  interest_rate: number; // percentage e.g. 0 for no-cost, 14 for 14% p.a.
  total_payable: number;
  payments?: EmiPayment[];
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notify_30_days: boolean;
  notify_7_days: boolean;
  notify_1_day: boolean;
  emi_due_reminders: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

export interface ExtractedReceiptData {
  product_name?: string;
  brand?: string;
  category?: ProductCategory;
  store?: string;
  purchase_date?: string;
  original_price?: number;
  discount?: number;
  tax?: number;
  final_price?: number;
  payment_method?: PaymentMethod;
  has_warranty?: boolean;
  warranty_duration_months?: number;
  has_emi?: boolean;
  down_payment?: number;
  monthly_emi?: number;
  tenure_months?: number;
  interest_rate?: number;
  notes?: string;
  confidence_score?: number;
}

export interface SmartInsight {
  id: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  title: string;
  message: string;
  action_label?: string;
  action_url?: string;
  icon?: string;
}
