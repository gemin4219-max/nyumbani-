-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR

-- 1. Create Payment Methods Table
create table if not exists public.payment_methods (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  phone_number text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (profile_id, phone_number)
);

-- 2. Enable Row Level Security (RLS)
alter table public.payment_methods enable row level security;

-- 3. Create policies for the payment_methods table
drop policy if exists "Users can view their own payment methods" on public.payment_methods;
create policy "Users can view their own payment methods" 
  on public.payment_methods for select 
  using (auth.uid() = profile_id);

drop policy if exists "Users can insert their own payment methods" on public.payment_methods;
create policy "Users can insert their own payment methods" 
  on public.payment_methods for insert 
  with check (auth.uid() = profile_id);

drop policy if exists "Users can update their own payment methods" on public.payment_methods;
create policy "Users can update their own payment methods" 
  on public.payment_methods for update 
  using (auth.uid() = profile_id);

drop policy if exists "Users can delete their own payment methods" on public.payment_methods;
create policy "Users can delete their own payment methods" 
  on public.payment_methods for delete 
  using (auth.uid() = profile_id);
