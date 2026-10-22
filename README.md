# RESEY Shop — Mobile

Expo / React Native client for [RESEY Shop](https://github.com/nhatpro306/resey-shop), with storefront and admin screens. It shares the web app's Supabase Auth, PostgreSQL, Storage and checkout RPC.

The current distribution target is **Web/PWA, internal Android APK and internal iOS development**. See [PRODUCT_LAUNCH_CHECKLIST.md](PRODUCT_LAUNCH_CHECKLIST.md) for release prerequisites; public store submission is outside that checklist's scope.

## Stack and prerequisites

- Expo SDK 56, React Native 0.85, React 19 and TypeScript.
- Expo Router, NativeWind, TanStack Query, Zustand and Zod.
- Node.js 20 as used by CI, and pnpm 10. Use pnpm with the committed lockfile.
- A Supabase backend matching [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
- Android emulator/device for Android development; macOS with Xcode for the iOS simulator. A physical-device iOS build needs the appropriate signing setup.

## Quick start

```powershell
git clone https://github.com/nhatpro306/resey-shop-mobile.git
cd resey-shop-mobile
pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`, then choose a target:

```powershell
pnpm web
# Or:
pnpm android
# iOS simulator on macOS:
pnpm ios
```

`pnpm start` opens the Expo development server. Expo Go compatibility depends on the native modules used; use a development build when required. Keep the repo's `.npmrc` hoisted linker configuration for Metro.

## Environment and backend

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Shared Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anon key; never a service-role key |
| `EXPO_PUBLIC_SENTRY_DSN` | Optional crash-reporting configuration |
| `EXPO_PUBLIC_WEB_URL` | Web URL used by configured app flows |

`app.config.ts` reads these values into Expo configuration. Public environment values are bundled into the client. Server-only credentials belong in backend services.

The target database must provide the tables, RLS policies and `create_order_checkout` RPC documented in [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Do not assume a newly created Supabase project already has the web app's schema.

Storage expectations:

- `avatars`: public reads, authenticated writes scoped to the user's own directory.
- `product-images`: public reads, admin-only writes scoped to the product path.

Verify the actual upload paths and storage policies using the setup guide. RLS and RPC authorization enforce access; hiding admin screens is only a UI measure.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm start` | Expo development server |
| `pnpm web` | Web development target |
| `pnpm android` / `pnpm ios` | Open Android / iOS target |
| `pnpm build:web` | Export web app and inject PWA support into `dist/` |
| `pnpm typecheck` | TypeScript validation |
| `pnpm lint` | ESLint, including import boundaries |
| `pnpm test --ci` | Jest unit tests without watch mode |
| `pnpm format` | Format source files; modifies files |

CI also runs an iOS export to catch Metro resolution errors. Passing automated checks does not verify a real-device checkout, image upload or production policies.

## Architecture

```text
app/ routes → feature hooks → src/domain/services → src/data/supabase.ts
```

UI calls hooks and services rather than importing the Supabase client directly. Domain types and schemas stay independent of React Native. Server data uses TanStack Query; client state uses Zustand.

## Features and release status

The source includes catalog search/filtering, product variants, cart, COD/bank-transfer checkout, orders, profiles, addresses and admin screens. Checkout uses the shared `create_order_checkout` RPC rather than calculating authoritative prices or stock on the device.

Sentry and notification integration still require their external configuration. Before distributing a build, complete the launch checklist and test auth, non-admin access, uploads and checkout against the intended backend. Existing checklist results are historical evidence, not a fresh verification of every environment.

For an internal Android APK, configure the EAS project and environment, then follow [deployment instructions](docs/DEPLOYMENT.md) for the `preview` profile in `eas.json`. Web deployment uses `pnpm build:web` and `vercel.json`.

## Documentation

- [Documentation index](docs/README.md)
- [Supabase setup](SUPABASE_SETUP.md)
- [Product launch checklist](PRODUCT_LAUNCH_CHECKLIST.md)
- [Architecture and system design](docs/SYSTEM_DESIGN.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Development and verification playbook](docs/AGENT_PLAYBOOK.md)

This repository does not include a standalone LICENSE file.
