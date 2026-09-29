-- Web Assistant: Habit / daily trackers (gym, Coca-Cola, chicken, sugar, ...)
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- user_id is TEXT (not UUID) to match supabase/patch.sql, so guest sessions work.

CREATE TABLE IF NOT EXISTS public.trackers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'yesno' CHECK (kind IN ('yesno', 'count')),
    unit TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tracker_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    skipped BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tracker_id, date)
);

ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and user access for trackers" ON public.trackers;
DROP POLICY IF EXISTS "Public and user access for tracker logs" ON public.tracker_logs;

CREATE POLICY "Public and user access for trackers"
    ON public.trackers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public and user access for tracker logs"
    ON public.tracker_logs FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_trackers_user ON public.trackers(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_logs_user_date ON public.tracker_logs(user_id, date DESC);
