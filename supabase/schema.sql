-- Web Assistant: Balance Tracker Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create Balance Entries table
CREATE TABLE IF NOT EXISTS public.balance_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    day_name TEXT NOT NULL,
    balance NUMERIC(12, 2) NOT NULL,
    previous_balance NUMERIC(12, 2),
    difference NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_settled BOOLEAN NOT NULL DEFAULT FALSE,
    settled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    balance_entry_id UUID REFERENCES public.balance_entries(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL DEFAULT 'Others',
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT DEFAULT '',
    is_auto_settled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS) for data protection
ALTER TABLE public.balance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Allow users to view and manipulate only their own records
CREATE POLICY "Users can manage their own balance entries"
    ON public.balance_entries
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own expenses"
    ON public.expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.balance_entries b
            WHERE b.id = balance_entry_id AND b.user_id = auth.uid()
        )
    );

-- 5. Indexes for fast mobile queries
CREATE INDEX IF NOT EXISTS idx_balance_entries_user_date ON public.balance_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_balance_entry ON public.expenses(balance_entry_id);
