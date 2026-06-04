# RESEY Shop — Mobile

Expo / React Native client for [RESEY Shop](https://github.com/nhatpro306/resey-shop).
Shares the existing Supabase backend (Auth · Postgres+RLS · Storage · RPC). iOS + Android.

## Quick start
```bash
pnpm install
cp .env.example .env   # fill in EXPO_PUBLIC_SUPABASE_URL + ANON_KEY
pnpm start             # then press i / a, or scan with Expo Go (dev build needed for some native libs)
```

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
**M0 Foundation** complete — Expo Router shell, providers, design tokens, domain skeleton,
data layer, CI. Next: M1 (port domain) → M2 (auth) → M3 (storefront). See
[docs/AGENT_PLAYBOOK.md](docs/AGENT_PLAYBOOK.md).

## Security
Anon key only. RLS is the security boundary. Secrets live in Supabase Edge Functions, never the app.
