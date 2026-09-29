-- Web Assistant: restore per-user row level security
-- Run this once in the Supabase SQL Editor if you previously ran patch.sql.
-- patch.sql opened both tables to anyone holding the anon key (USING (true)).
-- This puts back the auth.uid() = user_id rules from schema.sql.
--
-- WARNING: rows saved without a signed-in account (user_id like 'guest_xxxx',
-- or empty) cannot be tied to anyone, so they are deleted.

BEGIN;

-- 1. Remove the open policies (and the originals, in case they still exist)
DROP POLICY IF EXISTS "Public and user access for balance entries" ON public.balance_entries;
DROP POLICY IF EXISTS "Public and user access for expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage their own balance entries" ON public.balance_entries;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;

-- 2. Delete rows that do not belong to a real account
DELETE FROM public.expenses
WHERE user_id IS NULL
   OR user_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   OR user_id::text NOT IN (SELECT id::text FROM auth.users);

DELETE FROM public.balance_entries
WHERE user_id IS NULL
   OR user_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   OR user_id::text NOT IN (SELECT id::text FROM auth.users);

-- 3. Put user_id back to a required UUID tied to auth.users
ALTER TABLE public.balance_entries ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE public.balance_entries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.balance_entries DROP CONSTRAINT IF EXISTS balance_entries_user_id_fkey;
ALTER TABLE public.balance_entries
    ADD CONSTRAINT balance_entries_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.expenses ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE public.expenses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;
ALTER TABLE public.expenses
    ADD CONSTRAINT expenses_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Make sure RLS is on and restore per-user policies
ALTER TABLE public.balance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

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

COMMIT;
