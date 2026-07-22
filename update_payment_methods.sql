-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO ADD THE MISSING COLUMN

ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- This forces Supabase to refresh its cache so the app sees the new column immediately
NOTIFY pgrst, reload_schema;
