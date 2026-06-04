# RESEY Shop — Mobile App Engineering Plan

Production-grade Expo / React Native client for the [RESEY Shop](https://github.com/nhatpro306/resey-shop)
Vietnamese streetwear e-commerce platform. Scope: customer storefront **and** mobile admin.
Backend stays the existing Supabase project (Postgres + Auth + Storage + RLS + RPC).

---

## 1. Goals & Non-Goals

### Goals
- One TypeScript codebase shipping to **iOS + Android** from Expo.
- **Reuse** the web repo's domain layer (`types.ts`, Zod schemas, service logic, query keys).
- No new backend — talk to the same Supabase project; RLS is the security boundary.
- Production qualities from day one: typed, tested, observable, CI/CD, OTA updates, crash-free.
- Scale to large catalogs (10k+ products) and concurrent checkout without UI jank.

### Non-Goals (v1)
- No custom Node/API gateway (revisit only if we need server-side secrets or webhooks).
- No web build of the mobile app (Expo web is dev-only convenience, not shipped).
- No multi-tenant / multi-store. No internationalization beyond vi/en copy keys.

---

## 2. Architecture

### 2.1 High-level
```
┌─────────────────────────────────────────────┐
│  Expo App (iOS / Android)                     │
│                                               │
│  UI layer        → screens + components       │
│  State (server)  → TanStack Query             │
│  State (client)  → Zustand (cart draft, UI)   │
│  Domain layer    → services/ + schemas/ + types│  ← shared with web
│  Data client     → supabase-js (anon key)     │
└──────────────────────┬────────────────────────┘
                       │ HTTPS + JWT (RLS enforced)
                       ▼
┌─────────────────────────────────────────────┐
│  Supabase (existing)                          │
│  Postgres + RLS · Auth · Storage              │
│  RPC: create_order_checkout (atomic)          │
│  Edge Functions (optional: payments, push)    │
└─────────────────────────────────────────────┘
```

### 2.2 Layering rules (enforced by lint boundaries)
- **UI** never imports `supabase-js` directly. It calls **hooks**.
- **Hooks** (TanStack Query) wrap **services**.
- **Services** are the only place that touches the Supabase client; they accept/return domain types validated by **Zod**.
- **Domain** (`types`, `schemas`) is framework-free and portable — the unit we share with web.

This makes the data layer testable in isolation and swappable (e.g. if a service later moves behind an Edge Function, only the service changes).

### 2.3 Code-sharing strategy
- **v1:** copy `types.ts`, `schemas/`, and `services/` from the web repo into `src/domain`. Fast, no infra.
- **v2 (when churn hurts):** promote to a **Turborepo + pnpm** monorepo with a `@resey/core` package consumed by both web and mobile. Plan the folder names now so the later extraction is mechanical. See §11.

---

## 3. Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Runtime | Expo SDK (latest), React Native, Hermes engine | Managed builds, OTA, EAS |
| Routing | Expo Router (file-based) | Mirrors web App Router; deep linking for free |
| Server state | TanStack Query | Same hooks/keys as web; caching, retries, pagination |
| Client state | Zustand | Tiny, for cart draft + ephemeral UI; persisted via MMKV |
| Styling | NativeWind (Tailwind) + design tokens | Reuse web's Tailwind theme values |
| Forms | react-hook-form + Zod resolver | Same schemas as web |
| Storage (kv) | react-native-mmkv | Fast sync storage; query persistence + cart |
| Secure storage | expo-secure-store | Auth token at rest (Keychain/Keystore) |
| Images | expo-image | Caching, blurhash placeholders, perf |
| Lists | @shopify/flash-list | Virtualized; required for big catalogs |
| Notifications | expo-notifications | Order status push |
| Errors/Perf | Sentry (`@sentry/react-native`) | Crash + perf monitoring |
| Analytics | PostHog or Firebase Analytics | Funnels, retention |
| Tests | Jest + React Native Testing Library; Maestro (E2E) | Unit/integration + flows |
| Lint/format | ESLint (typescript, import boundaries), Prettier | Consistency |
| CI/CD | EAS Build + EAS Submit + GitHub Actions | Builds, OTA, store submit |

---

## 4. Folder Structure

```
resey-shop-mobile/
├── app/                          # Expo Router routes (thin; compose features)
│   ├── (auth)/                   # login, register, forgot-password
│   ├── (tabs)/                   # home, catalog, cart, orders, account
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # home
│   │   ├── catalog/
│   │   ├── product/[slug].tsx
│   │   ├── cart.tsx
│   │   ├── orders/
│   │   └── account/
│   ├── (admin)/                  # role-gated stack
│   │   ├── products/
│   │   ├── orders/
│   │   ├── users/
│   │   └── settings.tsx
│   ├── _layout.tsx               # providers root
│   └── +not-found.tsx
├── src/
│   ├── domain/                   # ← portable, shared-with-web unit
│   │   ├── types.ts
│   │   ├── schemas/              # Zod
│   │   └── services/             # product, cart, order, auth, admin, ...
│   ├── data/
│   │   ├── supabase.ts           # client + session persistence
│   │   └── queryClient.ts        # TanStack config + persister
│   ├── features/                 # feature-scoped UI + hooks
│   │   ├── catalog/{components,hooks,screens}
│   │   ├── product/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── account/
│   │   └── admin/
│   ├── ui/                       # design-system primitives (Button, Text, ...)
│   ├── stores/                   # Zustand (cartDraft, ui)
│   ├── lib/                      # utils, formatters (currency vi-VN), guards
│   ├── config/                   # env, theme tokens, constants
│   └── i18n/                     # vi/en copy
├── __tests__/ or *.test.ts       # colocated unit tests
├── e2e/                          # Maestro flows
├── assets/                       # icon, splash, fonts
├── app.config.ts                # dynamic config (env per channel)
├── eas.json                      # build/submit profiles
├── .github/workflows/            # CI
├── CLAUDE.md
└── docs/PLAN.md
```

---

## 5. Data Layer Details

### 5.1 Supabase client
- Single client in `src/data/supabase.ts`, session persisted to MMKV/SecureStore, `autoRefreshToken: true`, `detectSessionInUrl: false`.
- App-state listener: `AppState` → `supabase.auth.startAutoRefresh()` / `stopAutoRefresh()` on foreground/background.
- Anon key only. **Never** ship the service-role key in the app.

### 5.2 Services (ported)
Mirror web service modules: `product, category, cart, order, address, profile, review, auth, admin, storage, subscription, settings`. Strip any `next/*`, server-action, or cookie-based code; replace with direct `supabase` calls. Each service:
- validates inputs/outputs with Zod,
- returns typed domain objects,
- throws typed errors (`AppError` with code) for the UI to map to toasts.

### 5.3 Hooks & query keys
Centralize keys in `src/domain/services/keys.ts` to match web exactly:
```ts
export const qk = {
  products: (filters) => ['products', filters] as const,
  product: (slug) => ['product', slug] as const,
  cart: (userId) => ['cart', userId] as const,
  orders: (userId) => ['orders', userId] as const,
  // ...
}
```
- Lists use `useInfiniteQuery` with keyset (cursor) pagination, not offset (scales).
- Cart mutations are **optimistic** with rollback on error.

### 5.4 Checkout
- Call `create_order_checkout` RPC (atomic stock lock) — do **not** re-implement client-side. The RPC is the single source of truth for inventory consistency under concurrency.
- On success: invalidate cart + orders, clear cart draft, navigate to confirmation.
- COD and bank transfer; bank details pulled from store settings.

---

## 6. Performance & Scale

- **FlashList** for all long lists (catalog, orders, admin tables) — virtualized, stable item sizing.
- **Keyset pagination** + `useInfiniteQuery`; prefetch next page on scroll threshold.
- **expo-image** with `cachePolicy="memory-disk"` and blurhash placeholders; request resized images from Supabase Storage transform CDN (`?width=`).
- **Query persistence** (MMKV persister) → instant warm start, stale-while-revalidate.
- Select only needed columns in Supabase queries; avoid `select('*')` on list endpoints.
- DB indexes (verify on backend): `products(is_active, created_at)`, `products(category_id)`, `product_variants(product_id)`, `orders(user_id, created_at)`, full-text/`pg_trgm` index for search.
- Memoize heavy rows, stable `keyExtractor`, `getItemType` for mixed lists.
- Hermes + RAM bundle; enable Reanimated for 60fps gestures.
- Track JS/UI frame drops and TTI via Sentry performance.

---

## 7. Security

- **RLS is the boundary.** Every table the app reads/writes must have policies; admin gating in UI is convenience only. Audit policies before launch.
- Anon key only; secrets (Resend, payment) live in **Supabase Edge Functions**, never the bundle.
- Auth tokens in SecureStore; biometric lock (expo-local-authentication) optional for admin.
- Validate all user input with Zod before hitting the network.
- Enforce HTTPS only; certificate behavior via Expo defaults.
- Storage upload policies must authorize per-user/admin paths; validate mime/size client-side too.
- Rate-limit sensitive RPCs at the DB/Edge layer.
- No PII in logs/analytics; scrub in Sentry `beforeSend`.

---

## 8. Observability

- **Sentry**: crashes, JS errors, performance traces, release health, sourcemaps via EAS.
- **Analytics**: funnel events — `view_product`, `add_to_cart`, `begin_checkout`, `purchase`, plus admin actions. Centralize in `src/lib/analytics.ts` (typed event map).
- Structured `AppError` codes surfaced to toasts + breadcrumbs.
- Dashboards: crash-free users %, checkout funnel conversion, p95 screen load.

---

## 9. Testing Strategy

| Layer | Tool | What |
|---|---|---|
| Domain/services | Jest | Pure logic, Zod parsing, error mapping (mock supabase) |
| Hooks | RNTL + Query test utils | Cache behavior, optimistic updates |
| Components | RNTL | Render, interaction, a11y roles |
| E2E flows | Maestro | Login → browse → add to cart → checkout; admin edit product |
| Static | tsc `--noEmit`, ESLint boundaries | Types + layering rules |

Coverage gate on domain layer (≥80%). E2E smoke runs on every release build.

---

## 10. CI/CD & Release

- **GitHub Actions** on PR: install, typecheck, lint, unit tests, (optional) Maestro on cloud device.
- **EAS Build** profiles in `eas.json`: `development` (dev client), `preview` (internal QA, ad-hoc/internal track), `production`.
- **EAS Submit** to TestFlight + Play internal testing.
- **EAS Update** (OTA) for JS-only fixes per channel; native changes require a store build.
- **Env per channel** via `app.config.ts` + EAS secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SENTRY_DSN`, analytics keys.
- Semantic version + build number auto-increment; release notes from conventional commits.
- Staged rollout on Play; phased release on App Store.

---

## 11. Scaling the Codebase (v2 monorepo)

When `domain/` changes need to land in web + mobile together:
```
repo/
├── apps/web        (existing Next.js)
├── apps/mobile     (this app)
└── packages/core   (types, schemas, services, query keys)  ← @resey/core
```
- Turborepo for task caching; pnpm workspaces.
- `@resey/core` exports framework-free domain; each app injects its own supabase client instance (dependency injection) so server vs. client differences stay at the edges.
- This is why services take the client as a parameter / read from a provided instance rather than importing a hard-coded one — design for it now.

---

## 12. Milestones & Deliverables

| # | Milestone | Deliverable | Exit criteria |
|---|---|---|---|
| M0 | Foundation | Expo Router app, Supabase client, theme, providers, CI skeleton | App boots; lint/typecheck/test green in CI |
| M1 | Domain layer | Ported types/schemas/services + hooks + query keys | Service unit tests pass; can fetch products in a dev screen |
| M2 | Auth + shell | Auth flows, session persistence, tab + admin nav, role gating | Login/logout works; protected routes enforced |
| M3 | Storefront | Home, catalog+filters, product detail+variants, cart | Browse→add to cart works on device; perf budget met |
| M4 | Checkout + account | Checkout via RPC, orders, profile, addresses, reviews | Place real COD + transfer order; appears in admin web |
| M5 | Mobile admin | Products CRUD + image upload, orders status, users, settings | Admin can manage store from phone; RLS verified |
| M6 | Polish | States, optimistic UX, push, deep links, i18n, a11y | No P0/P1 bugs; crash-free >99.5% in QA |
| M7 | Observability+CI/CD | Sentry, analytics, EAS profiles, OTA | Dashboards live; signed builds to TestFlight/Play |
| M8 | Beta → Launch | Closed beta, fixes, store assets, submission | Approved on both stores; staged rollout |

---

## 13. Open Questions / Pre-work
- Confirm Supabase Auth method (email/password vs. magic link vs. OAuth) — drives M2.
- Confirm Storage bucket policies allow authenticated mobile uploads (multipart/base64).
- Confirm existence/cost of payment integration beyond COD/transfer (gateway → Edge Function).
- Confirm whether image transform CDN is enabled on the Supabase plan (perf §6).
- Decide v1 copy: vi-only or vi/en toggle.

---

## 14. Definition of Done (per feature)
Typed · Zod-validated I/O · loading/empty/error states · optimistic where it matters ·
unit test on logic · a11y roles + labels · analytics event · no `select('*')` on lists ·
works offline-degraded · reviewed against RLS.
