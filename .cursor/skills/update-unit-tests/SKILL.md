---
name: update-unit-tests
description: Updates the Vitest unit test suite after new features are added to the door-parkour project. Use when the user asks to update tests, asks if the test suite needs updating, or has just built a new feature and wants meaningful test coverage added.
---

# Update Unit Tests

## Test suite location

`src/app/api/__tests__/` — one file per API route or server action group.

Run with: `npm test` (use `required_permissions: ["all"]` due to sandbox restrictions).

## Workflow

1. Run `git diff --name-only` to identify exactly which files changed
2. Map changed files to their corresponding test file(s) — ignore changes with no test counterpart (migrations, types, UI components)
3. Read only the relevant test file(s) and the changed source file(s)
4. Update fixtures if field shapes changed
5. Update assertions if field names or expected values changed
6. Add new tests only for new branches or guards — one test per meaningful condition
7. Run `npm test` and confirm all pass

## What to test (and what not to)

**Test:**
- Auth/role guards — correct redirect or status code
- Input coercion — price cents math, inventory fallback, boolean flag parsing (`"on"` → `true`)
- Branching behavior — e.g. `on_demand` bypasses out-of-stock check
- Error shapes — correct status codes and `error` field content per failure mode
- Side effects — `revalidatePath` and `redirect` called with correct arguments

**Skip:**
- Pure UI changes (pages, layout, styling)
- Passthrough fields with no logic (plain text stored as-is)
- Tests that only assert what the mock returns — if the test can't fail, it has no value

## Mocking conventions

See the `testing.mdc` rule — it covers Supabase chain mocking, hoisted mocks, `redirect` behavior, and fixture completeness. That rule is automatically active when test files are open.
