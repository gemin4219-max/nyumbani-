-- 1. Create the storage bucket
insert into storage.buckets (id, name, public)
values ('public_images', 'public_images', true);

-- 2. Allow anyone to VIEW the images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'public_images' );

-- 3. Allow logged-in users (like you) to UPLOAD images
create policy "Auth Insert"
on storage.objects for insert
with check ( bucket_id = 'public_images' and auth.role() = 'authenticated' );

-- 4. Allow logged-in users to UPDATE images
create policy "Auth Update"
on storage.objects for update
using ( bucket_id = 'public_images' and auth.role() = 'authenticated' );

-- 5. Allow logged-in users to DELETE images
create policy "Auth Delete"
on storage.objects for delete
using ( bucket_id = 'public_images' and auth.role() = 'authenticated' );
