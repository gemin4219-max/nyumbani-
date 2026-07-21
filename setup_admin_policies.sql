-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR

-- 1. Give Admins full access to all bookings
drop policy if exists "Admins can manage all bookings" on public.bookings;
create policy "Admins can manage all bookings" on public.bookings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and user_type = 'admin')
);

-- 2. Give Admins full access to all wallets (Needed for refunds)
drop policy if exists "Admins can manage all wallets" on public.wallets;
create policy "Admins can manage all wallets" on public.wallets for all using (
  exists (select 1 from public.profiles where id = auth.uid() and user_type = 'admin')
);

-- 3. Give Admins full access to all transactions (Needed to mark transactions failed upon refund)
drop policy if exists "Admins can manage all transactions" on public.transactions;
create policy "Admins can manage all transactions" on public.transactions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and user_type = 'admin')
);
