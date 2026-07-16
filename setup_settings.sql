-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Create Addresses Table
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, -- e.g., 'Home', 'Work'
  full_address text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Addresses
alter table public.addresses enable row level security;
create policy "Users can view their own addresses" on addresses for select using (auth.uid() = profile_id);
create policy "Users can insert their own addresses" on addresses for insert with check (auth.uid() = profile_id);
create policy "Users can update their own addresses" on addresses for update using (auth.uid() = profile_id);
create policy "Users can delete their own addresses" on addresses for delete using (auth.uid() = profile_id);

-- 2. Create Payment Methods Table
create table if not exists public.payment_methods (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null, -- e.g., 'M-Pesa', 'TigoPesa', 'Visa'
  account_number text not null, -- masked or raw depending on compliance
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Payment Methods
alter table public.payment_methods enable row level security;
create policy "Users can view their own payment methods" on payment_methods for select using (auth.uid() = profile_id);
create policy "Users can insert their own payment methods" on payment_methods for insert with check (auth.uid() = profile_id);
create policy "Users can update their own payment methods" on payment_methods for update using (auth.uid() = profile_id);
create policy "Users can delete their own payment methods" on payment_methods for delete using (auth.uid() = profile_id);
