-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR

-- The bookings table currently has a constraint on service_type that only allows
-- ('cleaning', 'relocation', 'maintenance', 'market').
-- We need to add 'viewing' so users can book property viewings.

-- 1. Drop the old constraint
alter table public.bookings drop constraint if exists bookings_service_type_check;

-- 2. Add the new constraint with 'viewing' included
alter table public.bookings add constraint bookings_service_type_check 
  check (service_type in ('cleaning', 'relocation', 'maintenance', 'market', 'viewing'));
