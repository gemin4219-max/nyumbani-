-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Upgrade Properties (Pango) table
alter table public.properties 
add column if not exists description text,
add column if not exists features jsonb,
add column if not exists image_url text;

-- 2. Upgrade Sokoni table
alter table public.sokoni_items
add column if not exists description text,
add column if not exists features jsonb;

-- 3. Upgrade Usafi table
alter table public.usafi_services
add column if not exists description text,
add column if not exists features jsonb;

-- 4. Upgrade Kariakoo table
alter table public.kariakoo_items
add column if not exists description text,
add column if not exists features jsonb;

-- Note: To upload images, you must create a Storage Bucket named 'public_images' and make it Public!
