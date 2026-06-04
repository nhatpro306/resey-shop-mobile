# Supabase Setup — RESEY Shop Mobile

This app shares the **same Supabase project as the RESEY web app**. The schema, the
`create_order_checkout` RPC, and RLS policies already exist there. This document is a
**verification checklist** — it does not create or drop anything destructive.

> The app ships the **anon key only**. RLS is the security boundary. Never put the
> service-role key in the app, EAS secrets used at runtime, or Vercel public env.

---

## 1. Environment values (client / public)

| Variable | Where | Notes |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | EAS secret + Vercel env | `https://<ref>.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | EAS secret + Vercel env | anon/publishable key only |
| `EXPO_PUBLIC_WEB_URL` | EAS secret + Vercel env | web base URL, resolves relative image paths |
| `EXPO_PUBLIC_SENTRY_DSN` | optional | leave empty to disable crash reporting |

Read at runtime via `expo-constants` → `src/config/env.ts`. Missing values warn in dev, never crash prod.

---

## 2. Tables (must exist in the target project)

- `products` — `product_id`, `title`, `slug`, `price`, `image`, `is_active`, `stock`, `category_id`, …
- `product_variants` — variant `id`, `product_id`, `size`, `color`, `stock`, `price_override`, `sku`, `is_active`
- `product_images` — `product_id`, `url`, `sort_order`
- `categories` — `id`, `name`
- `profiles` — `profile_id` (= auth uid), `role` (`'admin'` gates admin UI), `is_active`, name/contact
- `addresses` — user addresses; `orders.shipping_address_id` → `addresses`
- `orders` — `id`, `user_id`, `created_at`, status, totals, payment fields, `shipping_address_id`
- `order_items` — `order_id`, `product_id`, `variant_id`, `quantity`, `price`, snapshot columns
- `store_settings` — hero / banking / shipping config (at least one row)

## 3. RPC

- `create_order_checkout(payload jsonb) returns bigint`
  - `payload`: `{ shipping_address_id, payment_method, payment_id, shipping_fee, customer_*, items: [{ product_id, variant_id, quantity, selected_size, selected_color }] }`
  - Must run atomically and **decrement stock server-side**; raise on `Not enough stock` / `no longer available` / `Authentication required` (the client maps these to friendly errors in `src/domain/services/order.ts`).

## 4. Storage buckets (with path-scoped RLS)

| Bucket | Path convention | Used by |
|---|---|---|
| `product-images` | `product-images/<file>` | admin product image upload (`src/domain/services/storage.ts`) |
| `avatars` | `avatars/<userId>/<file>` | profile avatar (`src/domain/services/profile.ts`) |

Both need policies allowing the **owner/admin to write** and **public read** (or signed URLs).

## 5. RLS verification (do before launch)

- [ ] As **anon**: can read public products/categories; **cannot** read other users' orders/addresses/profiles.
- [ ] As **non-admin user**: can CRUD own addresses/profile/orders only; **cannot** write products or read others' orders.
- [ ] As **admin** (`profiles.role = 'admin'`): can manage products, view all orders.
- [ ] `create_order_checkout` rejects out-of-stock and unauthenticated calls.

## 6. Auth redirect URLs (Supabase → Authentication → URL Configuration)

Add so password reset / deep links work on every surface:
- `resey://` (native scheme)
- `resey://reset-password` (or the app's reset route)
- `https://<your-vercel-app>.vercel.app` (web)

---

No migrations are shipped here because the backend is shared and already provisioned. If a
table/policy is missing in a fresh project, port it from the web app's migrations — do not
hand-write destructive SQL against production.
