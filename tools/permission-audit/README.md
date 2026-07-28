# Permission / RBAC UI audit harness

Browser-level test that walks every list page **as each role** and asserts that every RBAC-gated
action (edit / delete / issue / return / approve / reject / export) is shown **iff** the role's
permissions allow it. Catches the class of bug unit tests miss — they mock permissions, this renders
the real app (the export-button "не нажимается" and the delete-gated-by-edit fail-opens both passed
565 green vitest tests but were visibly broken).

## Why it exists
`GenericList` gates row actions two ways:
1. `resource: 'X'` on the list config → `enrichActionWithPermissions` auto-assigns `X.{edit,delete}`
   per action key → `filterActionsByPermissions` (honours `_own` scope) + `canPerformActionOnItem`.
2. explicit `permission:` / `disabled:` per action.

Lists that set **neither** a `resource` nor a correct `permission` fall back to a hand-written
`disabled: () => !canEdit` — which gates **delete** by the **edit** permission (fail-open for any
role with edit-but-not-delete), or nothing at all (WriteOffs edit). This harness pins that down.

## Run
```bash
# 1) mint role tokens (Django shell), e.g. into /tmp/.../role-toks.json:
#    { "qa_admin": {access,refresh}, "qa_manager": {...}, "qa_warehouse": {...},
#      "qa_brigadier": {...}, "qa_requester": {...} }
#    RefreshToken.for_user(User.objects.get(username='qa_admin'))
# 2) run:
node tools/permission-audit/audit.mjs --base https://elom.uz --toks /path/role-toks.json
# exit code 1 if any FAIL-OPEN found.
```

## What it checks
- **Seeded roles** (real tokens): ground truth is FETCHED live from `/rbac/my-permissions/` — the
  exact source the FE uses — so it can never drift from a hand-maintained list. `_own`-scoped perms
  (`edit_own`) satisfy the base requirement.
- **Synthetic scenarios** ("для ВСЕХ разрешений"): mocks `/rbac/my-permissions` to craft **arbitrary**
  narrow permission sets (e.g. `materials.edit` without `materials.delete`) and asserts the mutating
  action stays hidden. This is how the latent fail-opens are caught without needing a seeded role that
  happens to trigger them. Add a scenario to the `SYNTH` array to cover a new (page, action, perm).

## Findings history
- `F-863` — fixed 4 fail-opens found here: WriteOffs edit ungated; Materials/Objects/Units delete gated
  by `.edit` instead of `.delete`. (Employees/Purchases already correct via `resource:`; Suppliers via
  `!canDelete`.) After the fix: 0 FAIL-OPEN across all roles + synthetic scenarios.
