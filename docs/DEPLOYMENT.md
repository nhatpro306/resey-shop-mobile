# Deployment & Release Runbook

Everything code-side is done. The steps below need **your accounts** (Expo, Apple, Google,
Sentry) — they can't be automated without credentials. Run them in order.

---

## 0. Prerequisites (one-time)
- [Expo account](https://expo.dev) (free)
- Apple Developer account ($99/yr) for iOS
- Google Play Developer account ($25 once) for Android
- (Optional) [Sentry](https://sentry.io) account for crash reporting

Install the CLI:
```bash
npm install -g eas-cli
eas login
```

---

## 1. Link the EAS project
```bash
eas init          # creates the project on expo.dev, writes projectId
```
This adds `extra.eas.projectId` to the Expo config. **Push notifications start working
automatically once this exists** — `src/lib/notifications.ts` is already guarded on it.

---

## 2. Environment variables (per build profile)
The app reads `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and
`EXPO_PUBLIC_SENTRY_DSN`. Set them as EAS secrets so they're injected at build time:
```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxx.supabase.co" --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "ey..." --environment production
eas env:create --name EXPO_PUBLIC_SENTRY_DSN --value "https://...@sentry.io/..." --environment production
```
(Repeat with `--environment preview` for QA builds. Leave the Sentry one empty to disable reporting.)

---

## 3. Sentry sourcemaps (optional — only if using Sentry)
Crash reporting already works at runtime (`src/lib/sentry.ts`, guarded on the DSN).
For readable stack traces, add the Sentry Expo plugin + wrap metro:
```bash
npx @sentry/wizard@latest -i reactNative
```
This adds the config plugin (needs your Sentry org/project slug) and `getSentryExpoConfig`
to `metro.config.js`. Until you do this, errors still report — just with minified frames.

---

## 4. Builds
```bash
# Internal QA (installable on registered devices / internal track)
eas build --profile preview --platform all

# Production store builds
eas build --profile production --platform all
```
Profiles are already defined in `eas.json`.

---

## 5. Submit to stores
```bash
eas submit --profile production --platform ios       # → TestFlight / App Store Connect
eas submit --profile production --platform android    # → Play internal testing
```
First submit will prompt for App Store Connect / Play Console credentials and create the listing.

---

## 6. OTA updates (JS-only changes, no rebuild)
```bash
eas update --branch production --message "Fix copy on checkout"
```
Native changes (new native module, icon, permissions) still require a new build.

---

## 7. Store listing assets (manual)
- App icon: `assets/icon.png` (already set)
- Screenshots: capture from a device/simulator per store size requirements
- Privacy policy URL (required by both stores) — the app collects email + order/address data
- iOS: App Privacy questionnaire (data used: email, name, address, purchase history; not for tracking)
- Android: Data safety form (same)

---

## Backend checklist before launch (see README "Connecting the backend")
- [ ] `avatars` + `product-images` storage buckets exist with path-scoped RLS
- [ ] RLS policies verified as anon and as non-admin (no unauthorized writes)
- [ ] `create_order_checkout` RPC present (shared with web — already there)
- [ ] At least one `store_settings` row (hero, banking, shipping) populated
