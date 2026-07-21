-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR

-- 1. Create Usafi Services Table
create table if not exists public.usafi_services (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  price numeric(10, 2) not null,
  unit text not null default 'session',
  badge_text text,
  description text,
  features text[],
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Sokoni Items Table
create table if not exists public.sokoni_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  price numeric(10, 2) not null,
  unit text not null default 'item',
  badge_text text,
  description text,
  features text[],
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Kariakoo Items Table
create table if not exists public.kariakoo_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  price numeric(10, 2) not null,
  unit text not null default 'item',
  badge_text text,
  description text,
  features text[],
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.usafi_services enable row level security;
alter table public.sokoni_items enable row level security;
alter table public.kariakoo_items enable row level security;

-- Policies for public reading
create policy "Anyone can view usafi services" on usafi_services for select using (true);
create policy "Anyone can view sokoni items" on sokoni_items for select using (true);
create policy "Anyone can view kariakoo items" on kariakoo_items for select using (true);

-- Policies for admin writing (Allows anyone authenticated to manage for now)
create policy "Admins can manage usafi" on usafi_services for all using (auth.role() = 'authenticated');
create policy "Admins can manage sokoni" on sokoni_items for all using (auth.role() = 'authenticated');
create policy "Admins can manage kariakoo" on kariakoo_items for all using (auth.role() = 'authenticated');
