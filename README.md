# RESEY Shop — Mobile

Expo / React Native client for [RESEY Shop](https://github.com/nhatpro306/resey-shop).
Shares the existing Supabase backend (Auth · Postgres+RLS · Storage · RPC). iOS + Android.

## Quick start
```bash
pnpm install
cp .env.example .env   # fill in EXPO_PUBLIC_SUPABASE_URL + ANON_KEY
pnpm start             # then press i / a, or scan with Expo Go (dev build needed for some native libs)
```

## Connecting the backend
This app points at the **same Supabase project as the web app** — tables, the
`create_order_checkout` RPC, and RLS policies already exist there. Two things must be
present for the mobile-specific features to work:

1. **Env vars** (`.env`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. **Storage buckets** (the app uploads to these):
   - `avatars` — public read; authenticated users write only under `avatars/<their-uid>/…`
   - `product-images` — public read; **admin-only** write under `products/<product_id>/…`

   Both must have RLS storage policies matching those paths. The anon key ships in the app,
   so these policies are the actual security boundary — not the UI role checks.

> Verify before launch: read as anon and as a non-admin user to confirm RLS blocks
> writes you expect to be blocked (see [docs/AGENT_PLAYBOOK.md](docs/AGENT_PLAYBOOK.md) §10).

## Scripts
| Command | What |
|---|---|
| `pnpm start` | Expo dev server |
| `pnpm ios` / `pnpm android` | Run on simulator/device |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (incl. layering boundaries) |
| `pnpm test` | Jest unit tests |
| `pnpm format` | Prettier |

## Architecture (one rule)
`Route (app/) → hooks → services (src/domain) → supabase (src/data)`. UI never imports the
Supabase client. `src/domain` stays framework-free. Full docs in [docs/](docs/README.md).

## Status
**Feature-complete (M0–M6).** Storefront + admin, COD + bank-transfer checkout. Bundles cleanly
(`expo export`, 1447 modules). Typecheck/lint/tests green in CI.

- **Done:** auth, catalog (FlashList + keyset paging + filters/search), product detail + variants,
  optimistic cart, checkout via `create_order_checkout` RPC, orders + status timeline, profile +
  avatar upload, address CRUD, admin (dashboard, product CRUD + image upload, orders, users, settings),
  error boundary, typed analytics scaffold.
- **M7 wired (client-side, guarded):** Sentry crash reporting (no-ops until DSN set),
  push-notification registration (activates once an EAS project exists), typed analytics.
- **Remaining (need your accounts):** EAS build + store submission, Sentry sourcemaps,
  i18n vi/en. Step-by-step in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Security
Anon key only. RLS is the security boundary. Secrets live in Supabase Edge Functions, never the app.
