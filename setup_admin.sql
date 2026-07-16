-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Elevate meshackurassa2@gmail.com to Admin
update public.profiles
set user_type = 'admin'
where id = (
  select id from auth.users where email = 'meshackurassa2@gmail.com'
);

-- 2. Create Sokoni Items Table
create table if not exists public.sokoni_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  price numeric not null,
  unit text not null default 'pc',
  image_url text,
  badge_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Usafi Services Table
create table if not exists public.usafi_services (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  price numeric not null,
  unit text not null default 'session',
  image_url text,
  badge_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Kariakoo Items Table
create table if not exists public.kariakoo_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  price numeric not null,
  unit text not null default 'pc',
  image_url text,
  badge_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable RLS (Read for everyone, Insert/Update/Delete for Admins only)
alter table public.sokoni_items enable row level security;
alter table public.usafi_services enable row level security;
alter table public.kariakoo_items enable row level security;

-- Policies for Sokoni
create policy "Anyone can view sokoni items" on sokoni_items for select using (true);
create policy "Admins can insert sokoni items" on sokoni_items for insert with check (exists (select 1 from profiles where id = auth.uid() and user_type = 'admin'));
create policy "Admins can update sokoni items" on sokoni_items for update using (exists (select 1 from profiles where id = auth.uid() and user_type = 'admin'));
create policy "Admins can delete sokoni items" on sokoni_items for delete using (exists (select 1 from profiles where id = auth.uid() and user_type = 'admin'));

-- Policies for Usafi
create policy "Anyone can view usafi services" on usafi_services for select using (true);
create policy "Admins can insert usafi services" on usafi_services for insert with check (exists (select 1 from profiles where id = auth.uid() and user_type = 'admin'));
create policy "Admins can update usafi services" on usafi_services for update using (exists (select 1 from profiles where id = auth.uid() and user_type = 'admin'));
create policy "Admins can delete usafi services" on usafi_services for delete using (exists (select 1 from profiles where id = auth.uid() and user_type = 'admin'));

-- Policies for Kariakoo
create policy "Anyone can view kariakoo items" on kariakoo_items for select using (true);
create policy "Admins can insert kariakoo items" on kariakoo_items for insert with check (exists (select 1 from profiles where id = auth.uid() and user_type = 'admin'));
create policy "Admins can update kariakoo items" on kariakoo_items for update using (exists (select 1 from profiles where id = auth.uid() and user_type = 'admin'));
create policy "Admins can delete kariakoo items" on kariakoo_items for delete using (exists (select 1 from profiles where id = auth.uid() and user_type = 'admin'));

-- 6. Insert some initial dummy data so the home screen isn't empty!
insert into public.sokoni_items (title, price, unit, badge_text) values 
('Farm Fresh Tomatoes', 5000, 'kg', 'Hot'),
('Premium Red Onions', 4000, 'kg', 'New'),
('Organic Avocados', 2500, 'pc', 'Hot');

insert into public.usafi_services (title, price, unit, badge_text) values 
('Standard Home Cleaning', 30000, 'day', 'Hot'),
('Deep Sofa Cleaning', 50000, 'session', 'Hot'),
('Move-in Cleaning', 80000, 'day', 'New');

insert into public.kariakoo_items (title, price, unit, badge_text) values 
('Smart TV 55"', 1200000, 'pc', 'New'),
('Modern Dining Set', 850000, 'set', 'Hot'),
('Wholesale Rice (50kg)', 110000, 'bag', 'New');
