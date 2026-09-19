-- ==============================================================================
-- BuyTrack Supabase PostgreSQL Database Schema with Row Level Security (RLS)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    phone TEXT,
    currency TEXT DEFAULT '₹',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    store TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    original_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) DEFAULT 0.00,
    tax NUMERIC(12, 2) DEFAULT 0.00,
    final_price NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'UPI',
    receipt_image_url TEXT,
    notes TEXT,
    has_warranty BOOLEAN DEFAULT FALSE,
    has_emi BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Warranties Table
CREATE TABLE IF NOT EXISTS public.warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    warranty_duration_months INTEGER NOT NULL DEFAULT 12,
    warranty_start_date DATE NOT NULL,
    warranty_end_date DATE NOT NULL,
    warranty_type TEXT DEFAULT 'Manufacturer',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. EMI Plans Table
CREATE TABLE IF NOT EXISTS public.emi_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2) NOT NULL,
    down_payment NUMERIC(12, 2) DEFAULT 0.00,
    financed_amount NUMERIC(12, 2) NOT NULL,
    monthly_emi NUMERIC(12, 2) NOT NULL,
    number_of_installments INTEGER NOT NULL,
    paid_installments INTEGER DEFAULT 0,
    remaining_installments INTEGER NOT NULL,
    start_date DATE NOT NULL,
    next_due_date DATE NOT NULL,
    completion_date DATE NOT NULL,
    interest_rate NUMERIC(5, 2) DEFAULT 0.00,
    total_payable NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. EMI Payments Table
CREATE TABLE IF NOT EXISTS public.emi_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emi_plan_id UUID NOT NULL REFERENCES public.emi_plans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Paid', 'Overdue'
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    notify_30_days BOOLEAN DEFAULT TRUE,
    notify_7_days BOOLEAN DEFAULT TRUE,
    notify_1_day BOOLEAN DEFAULT TRUE,
    emi_due_reminders BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- Row Level Security (RLS) Policies (Users can only see/modify their own data)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emi_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emi_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Purchases Policies
CREATE POLICY "Users can view their own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own purchases" ON public.purchases
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own purchases" ON public.purchases
    FOR DELETE USING (auth.uid() = user_id);

-- Warranties Policies
CREATE POLICY "Users can view warranties of their purchases" ON public.warranties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.purchases
            WHERE public.purchases.id = public.warranties.purchase_id
            AND public.purchases.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert warranties for their purchases" ON public.warranties
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.purchases
            WHERE public.purchases.id = public.warranties.purchase_id
            AND public.purchases.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update warranties for their purchases" ON public.warranties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.purchases
            WHERE public.purchases.id = public.warranties.purchase_id
            AND public.purchases.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete warranties for their purchases" ON public.warranties
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.purchases
            WHERE public.purchases.id = public.warranties.purchase_id
            AND public.purchases.user_id = auth.uid()
        )
    );

-- EMI Plans Policies
CREATE POLICY "Users can view EMI plans of their purchases" ON public.emi_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.purchases
            WHERE public.purchases.id = public.emi_plans.purchase_id
            AND public.purchases.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert EMI plans for their purchases" ON public.emi_plans
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.purchases
            WHERE public.purchases.id = public.emi_plans.purchase_id
            AND public.purchases.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update EMI plans for their purchases" ON public.emi_plans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.purchases
            WHERE public.purchases.id = public.emi_plans.purchase_id
            AND public.purchases.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete EMI plans for their purchases" ON public.emi_plans
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.purchases
            WHERE public.purchases.id = public.emi_plans.purchase_id
            AND public.purchases.user_id = auth.uid()
        )
    );

-- EMI Payments Policies
CREATE POLICY "Users can view EMI payments of their purchases" ON public.emi_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.emi_plans
            JOIN public.purchases ON public.purchases.id = public.emi_plans.purchase_id
            WHERE public.emi_plans.id = public.emi_payments.emi_plan_id
            AND public.purchases.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update EMI payments of their purchases" ON public.emi_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.emi_plans
            JOIN public.purchases ON public.purchases.id = public.emi_plans.purchase_id
            WHERE public.emi_plans.id = public.emi_payments.emi_plan_id
            AND public.purchases.user_id = auth.uid()
        )
    );

-- Notification Preferences Policies
CREATE POLICY "Users can view their notification preferences" ON public.notification_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notification preferences" ON public.notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their notification preferences" ON public.notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket creation for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own receipts" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own receipts" ON storage.objects
    FOR SELECT USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
