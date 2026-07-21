-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR

-- 1. Create Addresses Table
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Home',
  full_address text not null,
  is_default boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.addresses enable row level security;

-- 3. Create policies for the addresses table
drop policy if exists "Users can view their own addresses" on public.addresses;
create policy "Users can view their own addresses" 
  on public.addresses for select 
  using (auth.uid() = profile_id);

drop policy if exists "Users can insert their own addresses" on public.addresses;
create policy "Users can insert their own addresses" 
  on public.addresses for insert 
  with check (auth.uid() = profile_id);

drop policy if exists "Users can update their own addresses" on public.addresses;
create policy "Users can update their own addresses" 
  on public.addresses for update 
  using (auth.uid() = profile_id);

drop policy if exists "Users can delete their own addresses" on public.addresses;
create policy "Users can delete their own addresses" 
  on public.addresses for delete 
  using (auth.uid() = profile_id);
