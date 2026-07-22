create table if not exists public.gas_items (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    price numeric not null,
    unit text not null,
    badge_text text,
    description text,
    features text[],
    image_url text
);

alter table public.gas_items enable row level security;

create policy "Allow public read access to gas items"
    on public.gas_items for select
    using (true);

create policy "Allow authenticated admin users to insert gas items"
    on public.gas_items for insert
    to authenticated
    with check (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and user_type = 'admin'
        )
    );

create policy "Allow authenticated admin users to update gas items"
    on public.gas_items for update
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and user_type = 'admin'
        )
    );

create policy "Allow authenticated admin users to delete gas items"
    on public.gas_items for delete
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and user_type = 'admin'
        )
    );
