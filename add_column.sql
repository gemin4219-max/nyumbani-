ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
