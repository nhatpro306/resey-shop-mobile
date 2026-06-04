# RESEY Shop Mobile — Product Launch Checklist

Target: internal / direct distribution. **No public App Store or Google Play submission.**
Three supported surfaces: **Web/PWA (Vercel)**, **Android APK (internal)**, **iOS (Expo Go / internal)**.

Stack: Expo SDK 56 · expo-router · React Native 0.85 · React 19 · NativeWind 4 · Supabase (Auth + Postgres/RLS + Storage + RPC) · pnpm 10.

---

## 1. Already ready (verified in this repo)

- [x] `pnpm install` works (pnpm 10, `node-linker=hoisted` for Metro).
- [x] `pnpm typecheck` (tsc --noEmit) — passes, 0 errors.
- [x] `pnpm lint` (eslint) — passes, 0 errors (a few library-inherent React-Hook-Form warnings).
- [x] `pnpm test` (jest) — 4 suites, 19 tests pass.
- [x] `expo export --platform web` — builds `dist/` successfully.
- [x] Supabase client uses **anon key only** (`src/data/supabase.ts`); eslint boundary keeps it inside `src/domain/services`.
- [x] Env validation (`src/config/env.ts`) fails loud in dev, never throws in prod.
- [x] `.env.example` documents only public `EXPO_PUBLIC_*` values, warns against service-role key.
- [x] Admin screens self-guard on `isAdmin` (`profile.role === 'admin'`); admin link hidden for non-admins.
- [x] Checkout via atomic `create_order_checkout` RPC (stock-safe, server-side).
- [x] Native app config complete: `ios.bundleIdentifier` + `android.package` = `com.resey.shop`, adaptive icon, splash, scheme `resey`, typed routes.
- [x] EAS profiles: `development`, `preview` (internal), `production`.

## 2. Missing before production (manual — needs your accounts)

- [ ] Supabase **production** project env values set (URL + anon key) — see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).
- [ ] `eas init` to create the EAS project id (enables push + builds).
- [ ] EAS secrets created for `EXPO_PUBLIC_*` (preview + production environments).
- [ ] Vercel project linked + env vars set (web target).
- [ ] Verify storage buckets + RLS in the target Supabase project.

## 3. Web / PWA tasks

- [x] `react-dom` + `react-native-web` added (SDK-56 pinned).
- [x] `app.config.ts` web → `bundler: metro`, `output: static`.
- [x] `app/+html.tsx` injects viewport, `manifest.json`, theme-color, apple-touch-icon.
- [x] `public/manifest.json` + `public/icons/icon-1024.png` (installable PWA).
- [x] `vercel.json` — build `expo export --platform web`, output `dist`, SPA rewrite for client routes.
- [ ] Deploy to Vercel + set env vars (see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)).
- [ ] Smoke test on a phone browser: install to home screen, refresh deep links, image load, cart, checkout.

## 4. Android APK tasks (internal install, no Play Store)

- [x] `eas.json` `preview` profile builds an **APK** (`android.buildType: apk`, `distribution: internal`).
- [x] `android.package` + adaptive/monochrome icons set.
- [ ] `eas build --platform android --profile preview` → download APK → install directly (enable "Unknown sources").
- [ ] Confirm Supabase auth + image upload work on a real device.

## 5. iOS limitations

- iOS **Expo Go**: works immediately, no Apple Developer account — `pnpm start` then scan QR.
- iOS **Simulator** (Mac only): `pnpm ios`.
- **Real-device internal build** (`eas build -p ios --profile preview`): requires an **Apple Developer account ($99/yr)** for signing — unavoidable Apple restriction.
- App Store submission: **out of scope** for this project.

## 6. Supabase tasks (see SUPABASE_SETUP.md)

- [ ] Tables: `products, product_variants, product_images, categories, profiles, addresses, orders, order_items, store_settings`.
- [ ] RPC: `create_order_checkout(payload jsonb)`.
- [ ] Buckets: `product-images`, `avatars` (path-scoped RLS).
- [ ] RLS verified as anon and as non-admin user (no unauthorized read/write).
- [ ] Auth redirect URLs include the `resey://` scheme + the Vercel web URL (for password reset / deep links).

## 7. Remaining risks

- Web JS bundle is large (~4.3 MB) — acceptable for internal use; consider route-level lazy loading later.
- React-Hook-Form `watch()` triggers React-Compiler "incompatible library" warnings (non-blocking).
- PWA icons are derived from the single 1024² app icon (no separate 192/512 raster); fine for install, regenerate if crisper small icons are wanted.
- iOS real-device distribution gated by Apple Developer account.
- Sentry only active when `EXPO_PUBLIC_SENTRY_DSN` is set; app must keep working without it (it does).
