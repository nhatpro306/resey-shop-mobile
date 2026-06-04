# RESEY Shop Mobile — UI/UX Specification

Implementation-ready spec for an AI agent. Pair with [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md).
Brand: RESEY — Vietnamese streetwear. Tone: bold, urban, minimal, high-contrast.

---

## 1. Design Principles
1. **Product-first** — imagery dominates; chrome recedes.
2. **Thumb-reachable** — primary actions in the bottom third; sticky CTAs.
3. **One primary action per screen** — clear hierarchy, no competing buttons.
4. **Fast-perceived** — skeletons, optimistic cart, cached images, no spinners-of-death.
5. **Trust at checkout** — show price breakdown, stock, and payment clearly before commit.
6. **Accessible** — WCAG AA contrast, 44pt touch targets, dynamic type, screen-reader labels.

---

## 2. Design Tokens

Mirror the web Tailwind theme; expose via NativeWind + `src/config/theme.ts`.

```
Color
  bg            #0A0A0A (dark default)   / #FFFFFF (light)
  surface       #141414 / #F5F5F5
  text          #FAFAFA / #0A0A0A
  text-muted    #A1A1AA
  primary       <brand accent from store_settings>   (CTA, links)
  primary-fg    contrast on primary
  border        #262626 / #E5E5E5
  success #22C55E  warning #F59E0B  danger #EF4444  info #3B82F6
Typography  (system + brand display font)
  display 32/700 · h1 24/700 · h2 20/600 · body 16/400 · small 14 · caption 12
Spacing  4-pt scale: 4 8 12 16 20 24 32 40 48
Radius   sm 8 · md 12 · lg 16 · pill 999
Elevation  card: subtle shadow / 1px border in dark
Motion   fast 150ms · base 250ms · spring for sheets/gestures (Reanimated)
```
Dark mode is default (streetwear aesthetic); support system light/dark.

---

## 3. Component Library (`src/ui`)

Primitives: `Text`, `Button` (primary/secondary/ghost/destructive, loading state),
`IconButton`, `Input`, `Select`, `Chip`/`FilterChip`, `Badge` (status colors),
`Card`, `Price` (sale strikethrough), `Rating`, `Avatar`, `Skeleton`, `EmptyState`,
`ErrorState`, `Toast`, `Sheet` (Gorhom bottom sheet), `Stepper` (qty), `Tabs`,
`SegmentedControl`, `ProductCard`, `VariantPicker`, `QuantityStepper`, `ImageGallery`,
`PriceSummary`, `StatusTimeline` (order), `SearchBar`, `FilterBar`.

Every component: typed props, `testID`, a11y role/label, loading + disabled states.

---

## 4. Navigation Map

```
Root
├─ (auth)            Login · Register · Forgot password           [unauthenticated]
├─ (tabs)            Bottom tab bar (customer)                    [authenticated]
│   ├─ Home
│   ├─ Catalog ─ Filters(sheet) ─ Search
│   ├─ Cart
│   ├─ Orders ─ Order detail
│   └─ Account ─ Profile · Addresses · Settings
│   └─ (modal) Product detail · Checkout · Auth-gate
└─ (admin)           Admin stack (role=admin)                     [admin only]
    ├─ Dashboard
    ├─ Products ─ Product edit
    ├─ Orders   ─ Order manage
    ├─ Users
    └─ Store settings
```
Deep links: `resey://product/:slug`, `resey://order/:id`, `resey://cart`.
Guests can browse catalog/product; cart & checkout trigger an auth gate.

---

## 5. Screen Specs

Each: purpose · layout · key components · states (loading/empty/error/success) · actions · events.

### 5.1 Home (`(tabs)/index`)
- **Purpose:** entry, brand, discovery.
- **Layout:** hero banner (store_settings) → featured/new arrivals horizontal rails → category grid → promo.
- **States:** skeleton rails; empty → "Coming soon"; error → retry.
- **Events:** `view_home`, `tap_banner`, `tap_category`.

### 5.2 Catalog (`(tabs)/catalog`)
- **Layout:** sticky `SearchBar` + `FilterBar` (category, size, color, in-stock, sort) → 2-col `FlashList` of `ProductCard`.
- **Filters** open in a bottom `Sheet`; active filters shown as removable chips.
- **Pagination:** infinite scroll (keyset); footer skeleton while loading next.
- **States:** grid skeletons; empty → "No products match" + clear-filters; error → retry.
- **Events:** `view_catalog`, `apply_filter`, `tap_product`.

### 5.3 Product detail (modal `product/[slug]`)
- **Layout:** swipeable `ImageGallery` (blurhash) → title, `Price` (sale) → `VariantPicker`
  (size chips, color swatches; disable/strike out-of-stock) → stock badge → description/material
  accordion → reviews summary → sticky bottom bar: `QuantityStepper` + **Add to cart** CTA.
- **Logic:** CTA disabled until valid in-stock variant chosen; price reflects `price_override`.
- **States:** image skeleton; out-of-stock → CTA "Notify me"/disabled; error → retry.
- **Events:** `view_product`, `select_variant`, `add_to_cart`.

### 5.4 Cart (`(tabs)/cart`)
- **Layout:** line items (image, title, variant, `QuantityStepper`, line price, swipe-to-remove)
  → `PriceSummary` (subtotal, shipping, total) → sticky **Checkout** CTA.
- **Logic:** optimistic qty/remove; re-validate stock on focus.
- **States:** empty → illustration + "Browse catalog"; item-unavailable inline warning.
- **Events:** `view_cart`, `update_qty`, `remove_item`, `begin_checkout`.

### 5.5 Checkout (modal, multi-step or single scroll)
- **Steps:** 1 Contact (name/phone/email) · 2 Address (select/add) · 3 Payment (COD | Bank transfer)
  · 4 Review → **Place order**.
- **Bank transfer:** show bank details from store_settings + copy buttons + note that order is
  pending until transfer confirmed.
- **Logic:** rhf + Zod per step; submit → `create_order_checkout` RPC; handle `OUT_OF_STOCK`
  by surfacing affected items and returning to cart.
- **States:** submitting (disable, spinner on CTA); success → confirmation screen with order #.
- **Events:** `add_shipping_info`, `add_payment_info`, `purchase`.

### 5.6 Orders + detail (`(tabs)/orders`)
- **List:** cards with order #, date, total, `Badge` status. Pull-to-refresh.
- **Detail:** `StatusTimeline` · items rendered from **snapshots** · totals · payment method ·
  reorder button. 
- **Events:** `view_orders`, `view_order`, `reorder`.

### 5.7 Account (`(tabs)/account`)
- Profile (avatar, username, email) · Addresses (CRUD, default) · Settings (theme, language,
  notifications, biometric for admin) · Sign out · entry to **Admin** if role=admin.

### 5.8 Auth (`(auth)`)
- Login (email/pw), Register, Forgot password. Inline validation, friendly errors, social later.
- Auth-gate sheet appears when a guest hits cart/checkout: "Sign in to continue".

### 5.9 Admin (`(admin)`)
- **Dashboard:** KPI cards (today orders, revenue, low-stock, pending) + recent orders list.
- **Products:** searchable `FlashList`; row → edit. Edit form: fields, variants editor,
  multi-image upload (reorder, set primary), active toggle, stock. Validation via Zod.
- **Orders:** filter by status; detail → change status (guarded), customer info, items.
- **Users:** list, toggle active/role (RLS-enforced).
- **Store settings:** branding, hero, contact, banking, shipping config form.
- Admin uses denser layout, tables, and explicit confirm dialogs for destructive actions.

---

## 6. Global UX Patterns
- **Toasts** for all async outcomes (success/error), mapped from `AppError` codes.
- **Skeletons** over spinners for content; spinner only on button CTAs.
- **Optimistic** cart and qty; rollback + toast on failure.
- **Pull-to-refresh** on all lists; **infinite scroll** for catalog/orders/admin.
- **Sticky primary CTA** at bottom on product/cart/checkout.
- **Confirm dialogs** for destructive/admin-status changes.
- **Haptics** on add-to-cart, place-order, errors.

---

## 7. Accessibility
- All interactive elements: `accessibilityRole` + `accessibilityLabel`, ≥44pt targets.
- Contrast AA against tokens; never color-only status (pair icon/label with Badge color).
- Support dynamic type scaling; test with largest font.
- Respect reduce-motion (disable spring flourishes).
- Screen-reader order verified on product, cart, checkout.

---

## 8. Empty / Error / Loading Catalog (reusable)
| Context | Empty | Error |
|---|---|---|
| Catalog | "No products match" + Clear filters | "Couldn't load" + Retry |
| Cart | Illustration + Browse CTA | Retry |
| Orders | "No orders yet" + Shop now | Retry |
| Network | Banner "You're offline" (NetInfo) | Cached read-only |

---

## 9. Deliverable for the agent
For each screen produce: route file in `app/`, screen in `src/features/<feature>/screens`,
feature hooks, and reused `src/ui` primitives — matching tokens, states, a11y, and events above.
No business logic in route files. Definition of Done per [PLAN.md](PLAN.md) §14.
