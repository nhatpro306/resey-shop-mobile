# RESEY Shop Mobile — System Design

Companion to [PLAN.md](PLAN.md). This is the implementation-level design an AI agent builds from.
Backend = existing Supabase project (shared with web). Client = Expo / React Native.

---

## 1. System Context (C4 L1)

```
        ┌────────────┐         ┌────────────┐        ┌──────────────┐
        │  Customer   │         │   Admin     │        │  Web app      │
        │  (mobile)   │         │  (mobile)   │        │  (Next.js)    │
        └─────┬───────┘         └─────┬───────┘        └──────┬────────┘
              │  JWT / HTTPS          │                       │
              └───────────┬──────────┘───────────────────────┘
                          ▼
              ┌───────────────────────────┐
              │        Supabase            │
              │  Auth · Postgres(RLS) ·    │
              │  Storage · RPC · Edge Fns  │
              └───────────┬───────────────┘
                          ▼
          External: Resend (email) · APNs/FCM (push) · Sentry · Analytics
```

Mobile and web are **peer clients** of the same backend. The mobile app introduces no
server of its own; any server-side secret or webhook lives in a Supabase **Edge Function**.

---

## 2. Container View (C4 L2) — inside the app

| Container | Responsibility | Key tech |
|---|---|---|
| Route layer (`app/`) | Navigation, deep links, screen composition | Expo Router |
| Feature modules (`src/features/*`) | Screen UI + feature hooks | React, NativeWind |
| UI kit (`src/ui`) | Design-system primitives | NativeWind, Reanimated |
| Server-state (`hooks`) | Caching, pagination, mutations | TanStack Query |
| Client-state (`src/stores`) | Cart draft, filters, UI flags | Zustand + MMKV |
| Domain (`src/domain`) | Types, Zod schemas, services, query keys | Pure TS (portable) |
| Data client (`src/data`) | Supabase client, session, query persister | supabase-js, MMKV |
| Platform services (`src/lib`) | Analytics, notifications, errors, formatters | expo-* |

Dependency direction is strictly downward: Route → Feature → hooks → services → data.
Domain depends on nothing app-specific.

---

## 3. Data Model (from web `types.ts`)

Entities (Postgres tables, already exist): `products`, `product_images`, `product_variants`,
`categories`, `carts`, `cart_items`, `orders`, `order_items`, `profiles`, `addresses`,
`reviews`, `store_settings`, plus auth `users`.

```
categories 1───* products 1───* product_variants
                  │ 1───* product_images
profiles 1───1 carts 1───* cart_items *───1 products/variants
profiles 1───* orders 1───* order_items   (order_items snapshot title/image/sku/size/color)
profiles 1───* addresses
products 1───* reviews *───1 profiles
store_settings (singleton)
```

Design notes the agent must honor:
- `order_items` carry **snapshots** (`product_title_snapshot`, `product_image_snapshot`,
  `sku_snapshot`, size/color) — render history from snapshots, not live product joins.
- Variant resolves stock & optional `price_override`; price authority is server-side.
- `OrderStatus`: pending · processing · confirmed · shipping/shipped · completed/delivered · cancelled.
- `CartStatus`: active · abandoned · converted.

---

## 4. Key Sequence Flows

### 4.1 Auth + session
```
App start → read session (SecureStore/MMKV) → supabase.auth.getSession()
  valid   → hydrate profile (role) → route to (tabs) or (admin)
  expired → autoRefreshToken → on fail → (auth)/login
AppState foreground → auth.startAutoRefresh();  background → stopAutoRefresh()
```

### 4.2 Browse catalog (paginated)
```
Screen mount → useInfiniteQuery(qk.products(filters))
  → productService.list({filters, cursor, limit, select: minimal cols})
  → supabase.from('products').select(cols).eq('is_active',true)
       .order('created_at').gt('id', cursor).limit(N)
  → FlashList renders; onEndReached → fetchNextPage (keyset cursor)
```

### 4.3 Add to cart (optimistic)
```
Tap add → resolve variant (size+color) → mutate
  optimistic: write cart cache + cartDraft store
  network: cartService.upsertItem(...)
  error: rollback cache, toast(AppError)
  success: invalidate qk.cart(userId)
```

### 4.4 Checkout (atomic)
```
Review → collect customer info + address + payment(COD|transfer)
  → orderService.checkout(payload)
  → supabase.rpc('create_order_checkout', payload)   // locks stock, creates order atomically
  result:
    ok   → invalidate cart+orders, clear cartDraft, route confirmation(orderId)
    stock conflict → AppError(OUT_OF_STOCK) → refresh affected items, prompt
```
The RPC is the **only** writer of inventory. Client never decrements stock.

### 4.5 Admin product edit + image upload
```
Edit form (rhf+zod) → save
  if new images: pick (expo-image-picker) → storageService.upload(path, blob)
     → supabase.storage.from('product-images').upload(...)  // RLS: admin path
  → productService.update(id, dto) → invalidate product + list
```

---

## 5. State Management Contract

- **Server state** lives ONLY in TanStack Query. Persisted to MMKV → warm-start, stale-while-revalidate.
  - Defaults: `staleTime` 60s for catalog, 0 for cart/orders; `retry` 2 with backoff; `gcTime` 24h.
  - Query keys centralized (`qk`) and identical in shape to web.
- **Client state** in Zustand: `cartDraft` (pre-auth/pending selections), `filters`, `ui` (sheets, toasts).
  - Persist `cartDraft` + `filters` to MMKV; never persist server data into Zustand.
- Single source of truth rule: if it comes from the DB, it lives in Query, not Zustand.

---

## 6. Error Handling

- Services throw `AppError { code, message, cause }`. Codes: `AUTH_REQUIRED`, `FORBIDDEN`,
  `OUT_OF_STOCK`, `NOT_FOUND`, `VALIDATION`, `NETWORK`, `RATE_LIMITED`, `UNKNOWN`.
- A `mapSupabaseError()` util normalizes PostgREST/Storage/Auth errors → `AppError`.
- UI layer maps code → toast + recovery action; never shows raw Supabase errors.
- Global: React error boundary per stack + Sentry capture with breadcrumbs (no PII).

---

## 7. Offline & Resilience

- Query cache hydrates from MMKV → app usable read-only when offline.
- Mutations queued? v1: block with "no connection" toast (NetInfo). v2: optimistic offline queue.
- Image cache (expo-image disk) keeps product imagery available offline.
- Idempotency: checkout passes a client-generated `idempotency_key`; RPC ignores duplicates.

---

## 8. Performance Budgets (enforced in QA)

| Metric | Budget |
|---|---|
| Cold start to interactive | < 2.5s mid-tier Android |
| Catalog scroll | 60fps, no blank cells (FlashList) |
| Product detail TTI | < 800ms warm cache |
| Add-to-cart perceived | instant (optimistic) |
| Crash-free users | > 99.5% |
| Bundle (JS) | track per release, alert on +10% |

Levers: Hermes, FlashList, keyset pagination, image CDN resize, column-scoped selects,
memoization, prefetch-on-near-end, query persistence. (Details in PLAN §6.)

---

## 9. Security Design

- Anon key only in bundle. Service-role key **never** ships. Secrets → Edge Functions.
- **RLS** policies are authoritative; client role checks are UX only. Each new write path
  ships with a verified policy. Admin = `profiles.role` enforced in policy, not UI.
- Tokens at rest in SecureStore (Keychain/Keystore). Optional biometric gate for admin.
- All inputs Zod-validated pre-network. Storage uploads: mime/size validated + RLS path scoping.
- Sentry/analytics scrub PII in `beforeSend`. HTTPS only.

---

## 10. Observability & Ops

- Sentry: crashes, perf traces, release health; sourcemaps uploaded by EAS.
- Analytics funnel: `view_product → add_to_cart → begin_checkout → purchase`; admin events.
- Release: EAS Build profiles (dev/preview/prod), EAS Submit to TestFlight/Play,
  EAS Update (OTA) for JS fixes. Env per channel via `app.config.ts` + EAS secrets.
- Feature flags (simple `store_settings`/remote config) gate risky features for staged rollout.

---

## 11. Non-Functional Requirements

Availability inherits Supabase SLA · p95 API < 400ms (server) · supports 10k+ SKU catalog ·
concurrent-checkout safe via RPC lock · GDPR-minded (no needless PII) · a11y WCAG AA targets ·
i18n-ready (vi default, en keys) · testable domain layer (≥80% coverage).

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| RLS gap exposes data/writes | Policy audit checklist in DoD; test as anon + non-admin |
| Stock race at checkout | All inventory through `create_order_checkout` RPC + idempotency key |
| Large lists jank | FlashList + keyset paging + budgets in CI smoke |
| Secret leakage | No service key in app; secrets only in Edge Functions; secret-scan in CI |
| Web/mobile domain drift | Shared key shapes now; extract `@resey/core` monorepo in v2 |
| Store rejection | Pre-submit checklist (privacy, ATT, perms rationale) |
