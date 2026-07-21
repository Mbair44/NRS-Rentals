# Admin inventory management

This update adds inventory add, edit, deactivate, and delete controls to `/admin`.

## Before deploying

Confirm these Vercel environment variables already exist for Production:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ACCESS_KEY`

No additional Supabase migration is required if your `inventory_items` table already has these columns:

- `id`
- `name`
- `slug`
- `description`
- `daily_price_cents`
- `image_url`
- `active`
- `created_at`

## Delete behavior

An item with no booking history is permanently deleted, along with its blocked dates.

An item with existing booking history is safely marked inactive instead. This preserves historical reservations while removing the item from the public gallery and future booking choices.

## Deploy

Copy these files into the existing Git project, then run:

```bash
git status
git add .
git commit -m "Add admin inventory management"
git push
```

## Inventory photo uploads

1. Run `supabase/inventory_image_uploads.sql` once in the Supabase SQL Editor.
2. Redeploy the website.
3. Open `/admin`, enter `ADMIN_ACCESS_KEY`, and edit or add an inventory item.
4. Choose one or more photos under **Rental photos**.
5. Click a thumbnail to select the cover image, then save the inventory item.

Photos are stored in the public Supabase Storage bucket named `inventory-images`. The dashboard accepts JPG, PNG, WebP, and GIF files up to 8 MB each.
