# Deployment Runbook — RESEY Shop Mobile

Goal: **internal / direct distribution**, no public App Store or Google Play release.
Three surfaces: **Web/PWA (Vercel)**, **Android APK (internal)**, **iOS (Expo Go / internal)**.

Code-side is ready. Steps below need **your accounts** (Vercel, Expo, optionally Apple/Sentry).

Related docs: [PRODUCT_LAUNCH_CHECKLIST.md](../PRODUCT_LAUNCH_CHECKLIST.md) · [SUPABASE_SETUP.md](../SUPABASE_SETUP.md)

---

## 0. Env vars (all surfaces)

Public client values only — never the service-role key.

```
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
EXPO_PUBLIC_WEB_URL=https://<your-web-app>   # resolves relative product image paths
EXPO_PUBLIC_SENTRY_DSN=                       # optional; empty disables Sentry
```

---

## 1. Web / PWA → Vercel

Build is configured in [`vercel.json`](../vercel.json):
- Install: `pnpm install --frozen-lockfile`
- Build: `expo export --platform web && node scripts/inject-web-pwa.mjs`
- Output: `dist/` (SPA, `output: "single"`)
- Rewrites: all client routes → `/` (refresh-safe deep links)

Steps:
1. Import the repo in Vercel (or `vercel` CLI). Framework preset: **Other** (vercel.json drives it).
2. Set the env vars from §0 in Vercel → Project → Settings → Environment Variables (Production + Preview).
3. Deploy. Verify:
   - App loads, refresh on `/product/<slug>` works (no 404).
   - DevTools → Application → Manifest: no errors, installable.
   - Mobile browser → Add to Home Screen → opens standalone, dark theme color.
   - Images load (needs `EXPO_PUBLIC_WEB_URL`), cart + checkout work, admin gated.

Local equivalent: `pnpm build:web` then serve `dist/` (e.g. `npx serve dist`).

---

## 2. Android APK (internal, no Play Store)

`eas.json` `preview` profile builds a direct-install **APK** (`android.buildType: apk`, `distribution: internal`).

```bash
npm install -g eas-cli
eas login
eas init                      # one-time: creates EAS project id
# env as EAS secrets (repeat per environment):
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://<ref>.supabase.co" --environment preview
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon>" --environment preview
eas env:create --name EXPO_PUBLIC_WEB_URL --value "https://<web>" --environment preview

eas build --platform android --profile preview
```

- Download the `.apk` from the EAS build page.
- Install directly on a device (enable **Install unknown apps**) or share the link.
- **Google Play account is not required** for this internal flow.
- Verify on a real device: login, product list/detail, add to cart, checkout, order history, admin image upload.

---

## 3. iOS (test / internal)

| Path | Needs Apple Developer? | How |
|---|---|---|
| Expo Go | No | `pnpm start`, scan QR with the Expo Go app |
| iOS Simulator (Mac) | No | `pnpm ios` |
| Real-device internal build | **Yes ($99/yr)** | `eas build --platform ios --profile preview` (signing) |

App Store submission is **out of scope**. For day-to-day internal iOS testing, Expo Go covers most flows; a real-device internal build only matters if you need native modules / standalone behavior, and that requires Apple signing.

---

## 4. Supabase

See [SUPABASE_SETUP.md](../SUPABASE_SETUP.md). Before launch:
- [ ] Tables, `create_order_checkout` RPC, `product-images` + `avatars` buckets exist.
- [ ] RLS verified as anon and non-admin.
- [ ] Auth redirect URLs include `resey://` and the Vercel web URL.
- [ ] At least one `store_settings` row.

---

## 5. Test checklist (every surface)

Auth (register/login/logout) · product list · product detail · add to cart · cart respects stock ·
checkout · order history · profile/address · admin login + protection · admin add/edit product ·
admin image upload · admin orders.

---

## 6. Rollback

- **Web**: Vercel → Deployments → promote the previous deployment (instant).
- **APK**: re-distribute the previous `.apk` (keep prior builds in EAS).
- **JS-only OTA** (if EAS Update configured): `eas update --branch preview --message "rollback"`; native changes still need a rebuild.

---

## 7. Limitations / risks

- iOS real-device distribution needs an Apple Developer account.
- Web JS bundle ~4.3 MB (acceptable internally; lazy-load later if needed).
- PWA icons derived from the 1024² app icon (installable; regenerate for crisper small sizes if wanted).
- Static (prerendered) web export is intentionally **not** used — the Supabase client requires runtime env, so the app ships as a client-rendered SPA.

---

## 8. Optional — Sentry sourcemaps

Crash reporting works at runtime when `EXPO_PUBLIC_SENTRY_DSN` is set (`src/lib/sentry.ts`).
For readable stack traces: `npx @sentry/wizard@latest -i reactNative` (adds the config plugin + metro wrap; needs your Sentry org/project).
