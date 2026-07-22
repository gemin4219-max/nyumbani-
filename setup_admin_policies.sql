-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR

-- 1. Allow admins to view all transactions
create policy "Admins can view all transactions"
    on public.transactions for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and user_type = 'admin'
        )
    );

-- 2. Allow admins to update transactions (e.g. mark as completed or failed)
create policy "Admins can update transactions"
    on public.transactions for update
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and user_type = 'admin'
        )
    );

-- 3. Allow admins to view all wallets (needed to check balance before refund)
create policy "Admins can view all wallets"
    on public.wallets for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and user_type = 'admin'
        )
    );

-- 4. Allow admins to update wallets (needed to process refunds on rejection)
create policy "Admins can update wallets"
    on public.wallets for update
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and user_type = 'admin'
        )
    );
