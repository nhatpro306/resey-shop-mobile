# AGENTS.md — RESEY Shop Mobile

Expo / React Native client for the RESEY Shop e-commerce platform (Vietnamese streetwear).
Backend is the **existing Supabase project** shared with the web app (Next.js). No separate API.
Full plan: [docs/PLAN.md](docs/PLAN.md).

## Stack
Expo (Hermes) · Expo Router · TypeScript (strict) · TanStack Query (server state) ·
Zustand (client state) · NativeWind/Tailwind · react-hook-form + Zod · supabase-js ·
FlashList · expo-image · Sentry · Jest + RNTL + Maestro · EAS Build/Submit/Update.

## Commands
- Install: `pnpm install` (use pnpm, not npm/yarn)
- Dev: `pnpm start` (Expo dev server) · `pnpm ios` / `pnpm android`
- Typecheck: `pnpm typecheck` (`tsc --noEmit`)
- Lint: `pnpm lint` · Format: `pnpm format`
- Unit tests: `pnpm test` · single: `pnpm test <path>`
- E2E: `pnpm e2e` (Maestro)
- Build: `eas build --profile <development|preview|production>`
Always run typecheck + lint + test before declaring a task done.

## Architecture — layering (do not violate)
```
UI (app/, features/*/components, ui/)
  └─ calls → hooks (features/*/hooks, TanStack Query)
        └─ wrap → services (src/domain/services)
              └─ only place that touches → supabase client (src/data/supabase.ts)
domain (src/domain/types, schemas) = framework-free, portable, shared with web
```
Rules:
- UI and components **never** import `supabase-js` or call the client directly — use hooks.
- Only `src/domain/services/*` touch Supabase. Services validate I/O with Zod and return domain types.
- `src/domain/` must stay framework-free (no `expo-*`, no React) so it can be extracted to `@resey/core` later.
- Centralize query keys in `src/domain/services/keys.ts`; reuse the web app's key shapes.

## Conventions
- TypeScript strict; no `any` (use `unknown` + narrow). Prefer `type` for domain models.
- Validate every network/user input with Zod before use. Map errors to typed `AppError` codes → toast.
- Lists: use **FlashList**, **keyset (cursor) pagination** via `useInfiniteQuery`. Never offset pagination on big tables.
- Supabase queries: **select only needed columns** — no `select('*')` on list endpoints.
- Cart mutations are **optimistic** with rollback.
- Checkout goes through the `create_order_checkout` RPC — never re-implement stock/inventory logic client-side.
- Images: `expo-image` with blurhash + memory-disk cache; request resized variants (`?width=`) from Storage.
- Money: format with `Intl.NumberFormat('vi-VN')` via `src/lib/currency.ts`. Prices/stock come from the server, never computed authoritatively on device.
- Routes in `app/` are thin — compose feature screens from `src/features`, no business logic in route files.
- Colocate tests next to source (`*.test.ts`). Domain layer requires unit tests.

## Security (hard rules)
- Ship **only** the Supabase anon key. NEVER the service-role key.
- **RLS is the security boundary.** Admin/role checks in the UI are convenience only — assume any client call can be forged; rely on policies. When adding an admin write, confirm a matching RLS policy exists.
- Secrets (Resend, payment gateways) live in Supabase Edge Functions, never the bundle.
- Auth tokens in `expo-secure-store`. No PII in logs/Sentry/analytics (scrub in `beforeSend`).

## State
- Server data → TanStack Query (cached, persisted to MMKV). Don't duplicate it into Zustand.
- Zustand only for client-only state: cart draft, UI flags, filters.

## Env / config
- Read config via `expo-constants` from `app.config.ts`; values from EAS secrets per channel.
- Required: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SENTRY_DSN`, analytics key.
- Never hardcode URLs/keys in source.

## Definition of done (per feature)
Typed · Zod-validated I/O · loading/empty/error states · optimistic where it matters ·
unit test on logic · a11y roles + labels · analytics event emitted · no `select('*')` on lists ·
RLS-checked · typecheck + lint + test green.

## Gotchas
- shadcn/ui and any `next/*` imports from the web repo do **NOT** port — UI is a rebuild with RN/NativeWind.
- When porting web services, strip server actions / `next/headers` / cookie code; replace with direct client calls.
- Add `AppState` auto-refresh wiring for Supabase auth (foreground/background) or sessions go stale.
- Use pnpm; mixing package managers breaks the (future) monorepo workspace.
- `.npmrc` sets `node-linker=hoisted` — required so Metro can resolve modules (it can't follow pnpm's nested symlinks). `react-native-css-interop` (NativeWind's dep) is also pinned as a direct dep for the same reason. Don't remove either.
- After dependency changes, run `npx expo export --platform ios` as a bundle smoke test — typecheck/lint/tests do NOT catch missing-module / Metro resolution errors.
