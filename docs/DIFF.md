# RESEY Shop Mobile — Full Build Diff

Detailed record of every decision, file, and change made across the two-commit build.
GitHub: https://github.com/nhatpro306/resey-shop-mobile
Web repo: https://github.com/nhatpro306/resey-shop

---

## Commit 1 — `df85165` M0: Foundation

**+60 files · ~900 lines**

### What was decided before writing a line

1. **Framework:** Expo (Managed Workflow) over Flutter/native — the web repo is TypeScript with Supabase; all services, types, Zod schemas, and query keys can be ported nearly verbatim. No Dart rewrite.
2. **Routing:** Expo Router (file-based) mirrors Next.js App Router: `(tabs)`, `(auth)`, `(admin)` groups map 1:1 to the web route groups.
3. **Backend:** zero new server — same Supabase project. Anon key only. RLS is the security boundary. Admin writes are enforced by Postgres policies, not hidden UI.
4. **State split:** TanStack Query (server state, persisted to MMKV/AsyncStorage) + Zustand (client-only: cart draft, UI flags). No duplicating server data into Zustand.
5. **Code-sharing path:** copy `types` + `services` into `src/domain` first (fast, zero infra); extract to `@resey/core` monorepo in v2 when dual-repo churn hurts.

### Files created

| Path | Purpose |
|---|---|
| `app.config.ts` | Dynamic Expo config; reads env from `EXPO_PUBLIC_*` via `expo-constants` |
| `babel.config.js` | NativeWind JSX import source + babel preset |
| `metro.config.js` | `withNativeWind` for Tailwind CSS processing |
| `tailwind.config.js` | Design tokens (dark bg #0A0A0A, primary crimson, spacing 4pt scale) |
| `global.css` | Tailwind directives entry for NativeWind |
| `nativewind-env.d.ts` | TypeScript declarations for NativeWind + CSS modules |
| `tsconfig.json` | Strict mode, `noUncheckedIndexedAccess`, `@/*` path alias, `types: ["jest"]` |
| `eas.json` | Build profiles: development (dev client), preview (internal), production |
| `eslint.config.js` | Flat config (ESLint 9); extends `eslint-config-expo`; **custom layering rule** that errors if UI files import `@supabase/supabase-js` or `@/data/supabase` directly |
| `.prettierrc` | Semi, double quotes, trailing commas, tailwind class sorting |
| `.gitignore` | node_modules, .expo, dist, .env, native build artifacts |
| `.env.example` | Documents required env vars; comments warn never to include service-role key |
| `jest.config.js` | `jest-expo` preset, `@/` alias, coverage from `src/domain/**` |
| `jest.setup.js` | Placeholder for future global mocks |
| `.github/workflows/ci.yml` | GitHub Actions: install (frozen lockfile) → typecheck → lint → test |
| `.github/pull_request_template.md` | PR checklist aligned to DoD |
| `.github/ISSUE_TEMPLATE/feature.md` | Agent-executable issue template |
| `src/config/env.ts` | Type-safe env reader from `expo-constants`; warns in dev if keys missing |
| `src/config/theme.ts` | Design token constants (mirrors tailwind.config.js values) |
| `src/data/supabase.ts` | Single Supabase client; AsyncStorage session; `AppState` auto-refresh wiring |
| `src/data/queryClient.ts` | TanStack QueryClient (staleTime 60s, gcTime 24h, retry 2) + AsyncStorage persister |
| `src/domain/types.ts` | Core subset: CartStatus, OrderStatus, PaymentMethod, ProductFilters |
| `src/domain/errors.ts` | `AppError` class + `mapSupabaseError` covering 401/403/404/stock/429/5xx |
| `src/domain/pagination.ts` | `toPage<T>()` keyset helper — pure, testable, no I/O |
| `src/domain/pagination.test.ts` | 5 unit tests covering cursor math and error mapping |
| `src/domain/services/keys.ts` | Central `qk` query-key registry |
| `src/domain/services/product.ts` | `listProducts` (keyset, column-scoped), `getProductBySlug` |
| `src/stores/cartDraft.ts` | Zustand store for pre-auth cart selection |
| `src/ui/Text.tsx` | Typed variant Text primitive (display/h1/h2/body/small/caption) |
| `src/ui/Button.tsx` | Typed variant Button (primary/secondary/ghost/destructive) with loading state |
| `src/ui/ScreenPlaceholder.tsx` | Temporary scaffold screen used by placeholder routes |
| `app/_layout.tsx` | Root layout: GestureHandler → SafeArea → PersistQueryClientProvider → Stack |
| `app/index.tsx` | Entry redirect → `/(tabs)` |
| `app/(tabs)/_layout.tsx` | Tab bar (theme colors wired) |
| `app/(tabs)/index|catalog|cart|orders|account.tsx` | Placeholder screens |
| `app/(auth)/_layout.tsx` | Auth modal stack |
| `app/(auth)/login.tsx` | Placeholder |
| `docs/README.md` | Docs index + core invariants |
| `docs/PLAN.md` | Full engineering plan (goals, stack, folder layout, perf, security, CI/CD, milestones) |
| `docs/SYSTEM_DESIGN.md` | C4 views, data model, 5 sequence flows, state/error/offline/perf contracts |
| `docs/UI_UX.md` | Design tokens, component library, navigation map, screen-by-screen specs |
| `docs/AGENT_PLAYBOOK.md` | Agent operating rules, epic→issue breakdown, gates, hard-stop guardrails |
| `CLAUDE.md` | Enforceable working rules for the coding agent |
| `README.md` | Project readme |

### Key version decisions (resolved by actually running installs, not guessed)
- **jest 29** not 30 — jest-expo 56 pins `@jest/*@^29`; jest 30 breaks preset
- **ESLint 9** not 10 — ESLint 10 breaks `eslint-plugin-react` context API used by eslint-config-expo
- **AsyncStorage** (not MMKV) for session and query persist in M0 — runs in Expo Go without a native build; MMKV is noted as a later swap behind the data layer

---

## Commit 2 — `edd6367` M1–M5: Full domain layer, auth, storefront, checkout, orders, admin

**+59 files modified/created · +3,366 lines · −65 lines (placeholder replacements)**

---

### M1 — Domain layer port

All 11 services fetched from `https://github.com/nhatpro306/resey-shop` and ported.

**What was stripped:**
- `import { toast } from 'sonner'` → replaced with `throw new AppError(...)` — UI maps codes to toasts
- `import { supabase } from '@/lib/supabase/client'` → `import { supabase } from '@/data/supabase'`
- `getClientUser()` (Next.js client util) → `supabase.auth.getUser()` directly
- `next/headers`, `next/cache`, `'use server'`, `'use client'` directives — all removed
- Demo/sample data fallbacks (`useDemoData`, `sampleProducts`, `mergeWithSampleProducts`) — removed; mobile always talks to real Supabase
- `withTimeout()` wrapper — removed; `supabase-js` handles network errors natively
- Server-only admin helpers using service-role key — removed; mobile uses anon key + RLS
- `console.error` scattered error logging — consolidated into `mapSupabaseError` + structured `AppError`

**What was kept / ported verbatim:**
- All Supabase table/column names and query shapes
- Cart `addItemToCart` legacy variant_id fallback (graceful schema degradation)
- `create_order_checkout` RPC call with exact payload shape (no inventory logic on client)
- `out of stock` / `authentication required` RPC error message detection and mapping

#### `src/domain/types.ts` — expanded to full domain

Added/corrected vs M0 subset:

| Type | Change |
|---|---|
| `CategoryType` | `id: number` (not string — matches Postgres int4) |
| `ProductType` | Added `category_id?: number`, confirmed `product_id: string` (UUID) |
| `CartItemType` | `id: number`, `cart_id: number`, `variant_id?: number | null` |
| `CartType` | `id: number` — cart IDs are int4 in the web schema |
| `OrderItemType` | Added all snapshot fields: `product_title_snapshot`, `product_image_snapshot`, `sku_snapshot`, `size_snapshot`, `color_snapshot` |
| `OrderType` | `id: number`, `shipping_address_id?: number` |
| `StoreSettingsType` | Full — hero, social, contact, banking, shipping config |
| `CheckoutPayload` | New — typed input for `create_order_checkout` RPC |
| `CheckoutItem` | New — item shape the RPC expects |

#### `src/domain/services/auth.ts`
8 methods: `signIn`, `signUp`, `signOut`, `resetPassword`, `getSession`, `getUser`, `updatePassword`.
No admin client — client-side email/password only. All errors → `mapSupabaseError`.

#### `src/domain/services/product.ts` — expanded
Added `getProductById`, `searchProducts`. `listProducts` now handles `sort` filter (price_asc/desc via Supabase `.order()`). Column list tightened to exact needed fields.

#### `src/domain/services/cart.ts`
Full port of `cartService.ts`. Key decisions:
- `resolveCartUserId` removed — caller passes userId explicitly (no implicit auth resolution in services)
- `isMissingVariantIdColumn` legacy fallback kept — handles older DB schema gracefully
- Variant stock merged into product stock in `getCartItems` response (same logic as web)

#### `src/domain/services/order.ts`
`createOrder` calls `create_order_checkout` RPC. Error message detection preserved from web. Added `sanitizedItems` filter. `shippingFee` safety check kept. `getOrders` / `getOrderById` include snapshots + address join.

#### `src/domain/services/address.ts`
Added `setDefaultAddress` (not in web) — unsets all then sets chosen. Returns `true` not `void` to signal success.

#### `src/domain/services/profile.ts`
`uploadAvatar` simplified vs web — tries one bucket (`avatars`) with `upsert: true`. Web tried 5 buckets; mobile only needs one configured correctly.

#### `src/domain/services/review.ts`
All 5 methods ported. `getClientUser()` replaced with explicit `userId` param — no implicit auth.

#### `src/domain/services/settings.ts`
New (no direct equivalent in web services — web used server actions). `getStoreSettings` + `updateStoreSettings`.

#### `src/domain/services/storage.ts`
New. `uploadProductImage` (fetch → blob → Storage upload → public URL), `deleteProductImage`, `getResizedImageUrl` (Supabase Storage transform CDN `?width=&format=webp`).

#### `src/domain/services/admin/product.ts`
Ported from `adminProductService.ts`. Changes:
- `getAllProducts` → `adminListProducts` with page/limit params
- `getSellableStock` utility removed — inline stock check
- `bulkUpdateProducts` removed (out of scope for mobile)
- Added `adminUpsertVariant`, `adminDeleteVariant`, `adminAddProductImage`, `adminDeleteProductImage`

#### `src/domain/services/admin/order.ts`
Ported from `adminOrderService.ts`. Removed `getOrderAnalytics`, `getOrdersRequiringAttention`, `topCustomers` — dashboard shows practical subset. `getDashboardAnalytics` simplified to 5 parallel queries.

#### `src/domain/services/admin/user.ts`
New (web used server-only `adminUserServerService`). RLS-gated reads of `profiles` table. `adminToggleUserActive`, `adminSetUserRole`.

---

### M2 — Auth + navigation shell

#### `src/features/auth/AuthContext.tsx`
- Session hydrated on mount via `supabase.auth.getSession()`
- `onAuthStateChange` listener updates session + profile live
- `loadProfile` declared before `useEffect` to avoid temporal dead zone lint error
- `isAdmin` derived from `profile.role === "admin"` — no separate admin session
- `eslint-disable react-hooks/exhaustive-deps` on the effect — `loadProfile` is stable (not in deps array would warn without it)

#### `app/_layout.tsx` — redesigned
Added `NavigationGuard` component: reads `segments[0]`, `session`, `isLoading` and redirects:
- No session + not in `(auth)` → `/(auth)/login`
- Session + in `(auth)` → `/(tabs)`
- Runs in `useEffect` on auth state change — no flash of wrong screen

#### Auth screens (Login / Register / ForgotPassword)
- `react-hook-form` + `zodResolver` on all three
- Inline field errors below each input
- `Alert.alert` for async errors (no toast lib yet — M6 concern)
- `router.replace` after login (not push — no back to login)
- `router.push` for register/forgot from login

---

### M3 — Storefront

#### `src/features/catalog/hooks.ts`
- `useProducts`: `useInfiniteQuery` with `initialPageParam: null as Cursor | null`; `getNextPageParam` returns `nextCursor ?? undefined` (undefined = no more pages)
- `useProduct`: staleTime 60s; `enabled: !!slug`
- `useProductSearch`: enabled only when `query.length >= 2` — no round-trip on single chars
- `useCategories`: staleTime 5 min (rarely changes)

#### `src/features/catalog/CatalogScreen.tsx`
- `FlashList` with `numColumns={2}` for 2-col grid
- Category chips: `[{ id: null, name: "All" }, ...categories]` prepend — clears category filter
- Sort chips: 3 options (newest / price↑ / price↓)
- `onEndReachedThreshold={0.3}` — prefetch next page when 30% from bottom
- Filters combined into single `activeFilters` object; one query key per filter combo
- Clear-filters resets both state and search simultaneously

#### `src/features/catalog/ProductDetailScreen.tsx`
- Images: sorted by `sort_order`, falls back to `product.image`, then hardcoded placeholder
- `selectedVariant` resolved by matching both `size` AND `color` against active variants
- `displayPrice` = `variant.price_override ?? product.sale_price ?? product.price`
- `inStock` = `selectedVariant.stock > 0 ?? product.stock > 0` — variant stock takes priority
- Haptics on successful add-to-cart (`NotificationFeedbackType.Success`)
- Sizes/colors deduplicated from variants using `Set`
- Out-of-stock size chips `disabled` — cannot be selected
- Reviews preview: first 3, star glyphs (✦/☆)

#### `src/features/home/HomeScreen.tsx`
- Hero: full-width image from `store_settings.hero_image` with dark overlay + title/CTA
- Fallback hero: plain text (store_name / store_description)
- New arrivals: first 6 from newest sort, 2-col flex-wrap grid (not FlashList — small fixed count)

---

### M4 — Checkout + account

#### `src/features/cart/hooks.ts`
Optimistic updates on `useUpdateCartItem` and `useRemoveCartItem`:
1. `cancelQueries` on the cart key
2. `setQueryData` with the optimistic new state
3. `onError`: restore from `ctx.prev`
4. `onSettled`: invalidate to sync from server

#### `src/features/cart/CartScreen.tsx`
- Qty stepper uses `useUpdateCartItem`; quantity 0 triggers remove via service
- Remove has `Alert.alert` confirmation (destructive action)
- Total computed client-side from `item.price * item.quantity` — price authority is server at checkout

#### `src/features/checkout/CheckoutScreen.tsx`
Key design decisions:
- `selectedAddressId` initialized from `addresses.find(a => a.is_default)?.id` — picks default automatically
- `shippingFee` computed from `store_settings.free_shipping_threshold` and `store_settings.shipping_fee` — matches web behavior
- Bank details shown conditionally: only when `paymentMethod === "bank_transfer" && settings?.bank_name`
- `items` mapped from cart with `variant_id: i.variant_id ? String(i.variant_id) : null` — RPC expects string
- Haptics success → `router.replace` to confirmation (replace removes checkout from back stack)
- `AppError("OUT_OF_STOCK")` surfaces from order service → `Alert.alert`

#### `src/features/orders/OrderDetailScreen.tsx`
- Status timeline: progress bar segments (filled up to `stepIndex`, grey after)
- Items rendered from **snapshots** (`product_title_snapshot`, `size_snapshot`, etc.) — not live product joins. This is intentional: order history must reflect what was purchased, not what the product is now.
- `StatusTimeline` STATUS_STEPS = `["pending", "processing", "confirmed", "shipping", "delivered"]` — excludes cancelled/completed (edge states)

#### `src/features/account/hooks.ts`
- `useUploadAvatar`: after upload, calls `updateProfile` via dynamic import to update `avatar_url` in DB
- `useSetDefaultAddress`: optimistic is not applied (two-step DB operation — not worth the race risk)

---

### M5 — Mobile admin

#### `src/features/admin/AdminDashboardScreen.tsx`
- KPI cards in a flex-row — 3 cards per row
- Two parallel queries: `adminGetDashboard` (orders) and `adminGetProductAnalytics` (products)
- `isAdmin` guard: shows EmptyState "Access denied" instead of crashing or showing partial data
- Recent orders list below KPIs — clickable → order detail

#### `src/features/admin/AdminProductsScreen.tsx`
- Toggle active uses `Alert.alert` with confirm — admin intent confirmation
- Pagination: client-side page state; `data.products.length === 30` heuristic for "has more"
- Edit route: `router.push("/admin/product/:id")` — screen not yet built (M6 scope)

#### `src/features/admin/AdminOrdersScreen.tsx`
- `NEXT_STATUSES` map: only valid forward transitions shown — prevents setting "shipped" back to "pending"
- Status change via `Alert.alert` button list (native action sheet feel)
- Status filter + pagination both reset when filter changes: `setPage(1)` on filter change

---

### UI kit additions

| Component | Design notes |
|---|---|
| `Skeleton` | Accepts `style?: ViewStyle` for aspect-ratio shapes |
| `EmptyState` | Optional action button; centered layout |
| `Badge` | 5 variants mapped from token colors; `orderStatusVariant()` helper |
| `ProductCard` | Sale price strikethrough; blurhash placeholder; `getResizedImageUrl` for CDN |

---

### ESLint layering boundary

The custom rule in `eslint.config.js` enforces the architecture:

```
UI files (app/, src/ui/, src/features/) that import
  @supabase/supabase-js  →  error
  @/data/supabase        →  error
except src/features/auth/AuthContext.tsx (legitimate exception — manages session state)
```

This catches accidental bypasses of the hook → service → data layering at lint time, not code review.

---

### What is NOT built yet (M6–M8)

| Feature | Notes |
|---|---|
| Product edit form (admin) | Image upload via expo-image-picker → Storage; variant CRUD |
| User management screen (admin) | Shell exists at `app/(admin)/users.tsx` |
| Store settings editor (admin) | Shell exists at `app/(admin)/settings.tsx` |
| Push notifications | expo-notifications; order status triggers |
| Deep links | `resey://product/:slug`, `resey://order/:id` |
| i18n | vi/en key file; `Intl.NumberFormat` already used for VND |
| a11y audit | Roles/labels in place; needs screen-reader walkthrough |
| Sentry wiring | DSN in env; needs `@sentry/react-native` install + `app.config.ts` plugin |
| MMKV swap | Replace AsyncStorage persister for faster cache reads |
| EAS Submit | Signed builds to TestFlight / Play internal |
| Address add/edit screens | CheckoutScreen references `/add-address` route (not yet built) |
| Profile edit screen | AccountScreen references `/edit-profile` route (not yet built) |

---

## Stats

| | M0 | M1–M5 | Total |
|---|---|---|---|
| Commits | 1 | 1 | 2 |
| Files | 60 | 59 | ~119 |
| Lines added | ~900 | ~3,370 | ~4,270 |
| Services | 2 (skeleton) | 12 + 3 admin | 15 |
| Screens | 7 (placeholder) | 18 (real) | 18 real |
| Tests | 5 | 5 (domain, new needed) | 5 |
| Typecheck errors | 0 | 0 | 0 |
| Lint errors | 0 | 0 | 0 |
