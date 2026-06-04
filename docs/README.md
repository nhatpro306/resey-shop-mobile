# RESEY Shop Mobile — Documentation

Production-grade Expo / React Native client for [RESEY Shop](https://github.com/nhatpro306/resey-shop).
Shares the existing Supabase backend (Auth · Postgres+RLS · Storage · RPC). Scope: storefront + admin.

## Read order
1. [PLAN.md](PLAN.md) — goals, architecture, stack, milestones M0–M8, DoD.
2. [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) — C4 views, data model, sequence flows, state/error/security/perf contracts.
3. [UI_UX.md](UI_UX.md) — design tokens, component library, navigation map, screen-by-screen specs.
4. [AGENT_PLAYBOOK.md](AGENT_PLAYBOOK.md) — how an AI agent executes this on GitHub (epics→issues→PRs, gates, guardrails).
5. [../CLAUDE.md](../CLAUDE.md) — enforceable working rules for the coding agent.

## Core invariants (don't violate)
- Layering: Route → hooks → services → Supabase. `src/domain` stays framework-free.
- RLS is the security boundary; anon key only; secrets in Edge Functions.
- Inventory only via `create_order_checkout` RPC.
- Lists: FlashList + keyset pagination + column-scoped selects.
- Server state in TanStack Query; client-only state in Zustand.
