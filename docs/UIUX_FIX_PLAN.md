# RESEY Mobile — UI/UX Fix Plan (UI/UX Pro Max)

Audit of the shipped design-handoff app against the UI/UX Pro Max skill rules
(UX guidelines, React Native stack, pre-delivery checklist). RESEY brand
(maroon `#6E0F11`, Geist, square) stays authoritative over the skill's generic
color/font suggestions. Mobile-repo only — no web/DB changes.

## P0 — CRITICAL (accessibility / touch)
- **Touch targets ≥44pt** (`touch-target-size`): qty steppers (PDP 38px, Cart 32px) → 44; add `hitSlop` to small icon Pressables.
- **accessibilityLabels** (`aria-labels`, `voiceover-sr`): cart qty +/- and any unlabeled icon buttons.

## P1 — HIGH (forms / perceived quality)
- **Autofill** (`autofill-support`): `Input` → `autoComplete` + `textContentType` (email/password/name/tel).
- **Inline validation on blur** (`inline-validation`): auth + checkout.
- **Tabular numbers** (`number-tabular`): `Price` + totals → `fontVariant: tabular-nums`.
- **Uniform press feedback** (`press-feedback`/`scale-feedback`).

## P2 — polish
- Haptics on wishlist toggle (sparingly).
- Empty/error retry paths verified on every screen.
- Reduced-motion audit (skeleton done in #20).
- `expo-image` fixed dimensions → no CLS.

## Execution
1 PR per band, each green on typecheck + lint + jest + expo-doctor + web build, auto-merged.
