-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR TO FIX PAYMENT METHODS

create table if not exists public.payment_methods (
    id uuid default gen_random_uuid() primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    phone_number text not null,
    is_default boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payment_methods enable row level security;

create policy "Users can view their own payment methods"
    on public.payment_methods for select
    to authenticated
    using (auth.uid() = profile_id);

create policy "Users can insert their own payment methods"
    on public.payment_methods for insert
    to authenticated
    with check (auth.uid() = profile_id);

create policy "Users can update their own payment methods"
    on public.payment_methods for update
    to authenticated
    using (auth.uid() = profile_id);

create policy "Users can delete their own payment methods"
    on public.payment_methods for delete
    to authenticated
    using (auth.uid() = profile_id);
