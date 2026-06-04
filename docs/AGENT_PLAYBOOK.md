# AI Agent Playbook — Building RESEY Shop Mobile on GitHub

How an autonomous coding agent (Claude Code / Codex / similar) executes this project on GitHub.
Read order: [PLAN.md](PLAN.md) → [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) → [UI_UX.md](UI_UX.md) → this file → [../CLAUDE.md](../CLAUDE.md).

---

## 1. Operating Rules for the Agent
1. **One issue → one branch → one PR.** Keep PRs < ~400 lines of diff where possible.
2. **Never break the layering** (Route→hooks→services→data; domain is pure). See CLAUDE.md.
3. **Always** run `pnpm typecheck && pnpm lint && pnpm test` before opening a PR. Red = not done.
4. **RLS check is part of every data-touching PR** — verify a policy exists; test as anon + non-admin.
5. No secrets in code. Anon key only. Service-role/secret work → Edge Function issue, flagged.
6. Update docs when behavior changes. Each PR links its issue and states acceptance criteria met.
7. If blocked by a §13 open question (PLAN), open a `needs-decision` issue instead of guessing.

---

## 2. Repository Setup (first issue)
- Init Expo Router + TS app; commit `CLAUDE.md` + `docs/`.
- Add tooling: ESLint (with `import/no-restricted-paths` to enforce layering), Prettier,
  Jest + RNTL, Husky pre-commit (typecheck+lint+test on staged), commitlint (Conventional Commits).
- `.github/`: PR template, issue templates, `CODEOWNERS`, labels, branch protection on `main`
  (require CI + 1 review), Dependabot.
- `eas.json` profiles (dev/preview/prod) + EAS secrets placeholders.
- CI workflow: install → typecheck → lint → test → (preview EAS build on tag).

---

## 3. Epic → Issue Breakdown (maps to PLAN milestones)

Create one **Epic** (GitHub milestone) per Mx, each with child issues. Suggested labels:
`epic`, `feature`, `chore`, `bug`, `needs-decision`, `security`, `perf`, `a11y`, `good-first-agent-task`.

**M0 Foundation** — `chore`
- Expo Router scaffold · tooling + lint boundaries · CI pipeline · theme tokens + `src/ui` base
  (Button/Text/Input/Card/Skeleton) · providers (Query, theme, Sentry) · MMKV + secure store.

**M1 Domain layer** — `feature`
- Port `types.ts` · port Zod schemas · port services (product, category, cart, order, address,
  profile, review, auth, admin, storage, settings) stripping `next/*`/server actions ·
  `mapSupabaseError` + `AppError` · query keys `qk` · unit tests (≥80%).

**M2 Auth + shell** — `feature`/`security`
- Supabase client + session persistence + AppState auto-refresh · auth screens · role gating ·
  tab + admin navigators · auth-gate sheet.

**M3 Storefront** — `feature`
- Home · Catalog (FlashList + filters sheet + keyset infinite query) · Search · Product detail
  (gallery + VariantPicker + sticky CTA) · Cart (optimistic).

**M4 Checkout + account** — `feature`
- Checkout steps + `create_order_checkout` RPC + idempotency + OUT_OF_STOCK handling ·
  confirmation · Orders list/detail (snapshots + StatusTimeline) · Profile · Addresses CRUD · Reviews.

**M5 Mobile admin** — `feature`/`security`
- Dashboard KPIs · Products list + edit + variants + multi-image upload (expo-image-picker → Storage)
  · Orders manage (status) · Users · Store settings. RLS verified per write path.

**M6 Polish** — `a11y`/`perf`
- Empty/error/loading catalog · toasts from AppError · haptics · pull-to-refresh · deep links ·
  i18n vi/en · a11y pass · push notifications (order status).

**M7 Observability + CI/CD** — `chore`
- Sentry releases + sourcemaps · analytics funnel events · EAS Submit · EAS Update (OTA) ·
  perf budgets in smoke · feature flags.

**M8 Beta → Launch** — `chore`
- Closed beta (TestFlight/Play internal) · bug burn-down · store assets/privacy/ATT · staged rollout.

---

## 4. Issue Template (each child issue should contain)
```
## Goal
<one sentence>

## Context
Links: PLAN §_, SYSTEM_DESIGN §_, UI_UX §_

## Scope (in)
- ...
## Out of scope
- ...

## Acceptance criteria
- [ ] Behavior: ...
- [ ] Typed + Zod-validated I/O
- [ ] States: loading / empty / error handled
- [ ] a11y roles + labels
- [ ] Analytics event(s): ...
- [ ] No select('*') on lists; column-scoped
- [ ] RLS verified (if data-touching)
- [ ] Unit test on logic
- [ ] typecheck + lint + test green

## Notes / files
src/...
```

## 5. PR Template
```
Closes #<issue>

### What & why
### How (key decisions)
### Screens / screenshots (if UI)
### Checklist
- [ ] DoD met (PLAN §14)
- [ ] Layering respected (no supabase-js in UI)
- [ ] RLS verified / N-A
- [ ] No secrets added
- [ ] Docs updated if behavior changed
```

---

## 6. Branch & Commit Conventions
- Branches: `feat/<scope>-<slug>`, `fix/...`, `chore/...`, `perf/...`.
- Conventional Commits: `feat(catalog): keyset pagination`; commitlint enforced.
- Squash-merge; PR title = changelog line.

---

## 7. CI Gates (block merge)
typecheck · ESLint (incl. layering boundaries) · unit tests + coverage threshold ·
secret scan · (on release tag) EAS preview build + Maestro smoke.

---

## 8. Definition of Done (global)
A PR is done when: acceptance criteria checked · DoD (PLAN §14) met · CI green ·
no new RLS gap · docs current · reviewer (or self-review checklist for solo agent) signed off.

---

## 9. Agent Self-Verification Loop (per issue)
```
read issue + linked spec → plan files to touch → implement
→ pnpm typecheck && pnpm lint && pnpm test → fix until green
→ verify acceptance criteria one by one → (UI) run on simulator / screenshot
→ RLS check if data-touching → open PR with template → link issue
```
If a criterion can't be met, comment why and either split the issue or open `needs-decision`.

---

## 10. Guardrails (hard stops — open an issue instead of proceeding)
- Need a service-role key or server secret on device → STOP, design an Edge Function.
- A write path has no RLS policy → STOP, add/verify policy first.
- Re-implementing stock/inventory outside the RPC → STOP, use `create_order_checkout`.
- Adding offset pagination / `select('*')` on a large list → STOP, use keyset + column scope.
- Importing `next/*` or shadcn/ui from the web repo → STOP, rebuild with RN/NativeWind.
