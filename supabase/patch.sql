-- 1. Drop existing policies that depend on user_id
DROP POLICY IF EXISTS "Users can manage their own balance entries" ON public.balance_entries;
DROP POLICY IF EXISTS "Public and user access for balance entries" ON public.balance_entries;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Public and user access for expenses" ON public.expenses;

-- 2. Drop foreign key constraints
ALTER TABLE public.balance_entries DROP CONSTRAINT IF EXISTS balance_entries_user_id_fkey;
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;

-- 3. Alter columns to TEXT and nullable
ALTER TABLE public.balance_entries ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.balance_entries ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.expenses ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.expenses ALTER COLUMN user_id DROP NOT NULL;

-- 4. Create inclusive policies for both authenticated & guest sessions
CREATE POLICY "Public and user access for balance entries" 
    ON public.balance_entries 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Public and user access for expenses" 
    ON public.expenses 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
