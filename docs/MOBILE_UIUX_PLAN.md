# Mobile UI/UX Audit & Refactor Plan

Goal: raise the mobile-app UI/UX taste — adapt patterns from reference ecommerce/Expo repos
(React Native Reusables, Obytes template, Expo shadcn demo, ecommerce templates) without
copying code. Brand: RESEY maroon `#6E0F11`, square corners, dark base, streetwear.

## Current state (audit)

Good bones already: design tokens (`src/config/theme.ts` + `tailwind.config.js`), typed
primitives (`Text`, `Button`, `Badge`, `ProductCard`, `EmptyState`, `Skeleton`), feature-based
structure, React Query, safe-area in screens.

Gaps found:

| Area | Issue |
|---|---|
| Bottom tabs | **No icons** — labels only; looks unfinished. No safe-area/elevation polish. |
| Typography | No streetwear treatment (uppercase/tracking) for headings; flat scale. |
| Skeleton | Static block, no shimmer/pulse — weak loading feedback. |
| ProductCard | No sale/new badge, no out-of-stock image overlay, generic fallback. |
| Auth | Functional but plain — no brand mark, no password visibility toggle. |
| Spacing | Inconsistent vertical rhythm across screens. |
| Empty states | Present but minimal; could use icon + tone. |

## Refactor plan (screen by screen, shippable PRs)

1. **Foundations (app-wide, highest leverage)**
   - Bottom tab icons (`@expo/vector-icons`) + active maroon + safe-area inset.
   - Typography: add brand heading treatment (uppercase, tracking) via `Text` variant.
   - Animated shimmer `Skeleton` (reanimated).
   - `ProductCard`: sale/new `Badge`, out-of-stock overlay, square corners.
2. **Auth (login/register/forgot)** — brand mark, spacing, password show/hide, button states.
3. **Catalog + Home** — thumb-optimized 2-col grid, sticky filter, skeleton grid, empty states.
4. **Product detail** — gallery, variant chips, sticky add-to-cart CTA, stock states, related.
5. **Cart + checkout** — qty steppers, sticky order summary, safe-area, empty states.

## Constraints / verification

- Live app on Vercel; brand tokens + CI already in place.
- **Visual preview limited to auth screens** — inner screens are auth-gated and accounts can't
  be created by the agent, so inner-screen changes are verified via typecheck/lint/build +
  Vercel preview deployment for manual review.
- Each step: typecheck + lint pass, ships as its own PR, CI-gated.
