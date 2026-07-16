-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR

-- 1. Create Wallets Table
create table if not exists public.wallets (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  balance numeric(10, 2) not null default 0.00,
  currency text not null default 'TZS',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Wallets
alter table public.wallets enable row level security;
create policy "Users can view their own wallet" on wallets for select using (auth.uid() = profile_id);
create policy "Users can update their own wallet" on wallets for update using (auth.uid() = profile_id);

-- 2. Create Transactions Table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(10, 2) not null,
  type text not null check (type in ('topup', 'transfer', 'payment', 'withdrawal')),
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Transactions
alter table public.transactions enable row level security;
create policy "Users can view their own transactions" on transactions for select using (auth.uid() = profile_id);

-- 3. Create Properties Table
create table if not exists public.properties (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  address text not null,
  price numeric(10, 2) not null,
  status text not null default 'vacant' check (status in ('vacant', 'occupied', 'maintenance')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Properties
alter table public.properties enable row level security;
create policy "Anyone can view properties" on properties for select using (true);
create policy "Owners can manage properties" on properties for all using (auth.uid() = owner_id);

-- 4. Create Bookings Table
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  service_type text not null check (service_type in ('cleaning', 'relocation', 'maintenance', 'market')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  scheduled_date timestamp with time zone not null,
  amount numeric(10, 2),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Bookings
alter table public.bookings enable row level security;
create policy "Users can view their own bookings" on bookings for select using (auth.uid() = profile_id);
create policy "Users can create bookings" on bookings for insert with check (auth.uid() = profile_id);

-- 5. Trigger to automatically create a wallet when a profile is created
create or replace function public.handle_new_wallet()
returns trigger as $$
begin
  insert into public.wallets (profile_id, balance, currency)
  values (new.id, 0.00, 'TZS');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_wallet();
