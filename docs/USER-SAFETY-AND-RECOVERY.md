# BuildOne User Safety, Backup, Update and Recovery Standard

## User-first rules

1. Technical complexity stays behind BuildOne's UI wherever possible.
2. Destructive actions require a clear explanation and recoverable backup.
3. BuildOne must never claim Success until the real external result is verified.
4. A failed repair must leave the last known-good backup available.
5. A user can cancel a queued build before the real build starts where the provider permits it.
6. Errors must explain what happened, what BuildOne already tried, and the next safe action.
7. Secrets are never requested in normal project HTML fields.
8. Permissions are requested only when the generated app actually needs them.

## Automatic backup

Before any migration, automatic repair, generated-project replacement or major configuration change:

`Validate → Backup → Change → Analyze → Build → Verify`

If Change/Analyze/Build/Verify fails:

`Stop → Preserve logs → Restore backup when safe → Mark FAILED/ROLLED_BACK`

## Automatic recovery

Recovery uses bounded attempts. BuildOne must not retry forever. Recommended policy:

- attempt 1: original build
- attempt 2: safe compatibility repair
- attempt 3: dependency/version repair
- then stop and require user review

Each attempt gets its own event and error record.

## Auto-update of BuildOne

BuildOne updates must be staged:

`Check update → verify signature/source → backup local state → install update → health check → rollback if health check fails`

An update must not delete a user's project. Project migration must be versioned and reversible.

For Google Play distributed BuildOne, normal Play update mechanisms should be preferred over bypassing Android's package/update protections.

## Incident response

For a system issue BuildOne should:

1. detect the failed component;
2. stop unsafe downstream actions;
3. capture a minimal diagnostic record without secrets;
4. retry only when safe and bounded;
5. rollback user project changes if necessary;
6. mark the actual state;
7. notify the user in plain language;
8. keep a support/recovery reference.

No system can honestly guarantee that every possible external failure can be fixed automatically. BuildOne therefore guarantees the **process**: detect, protect, explain, recover where safe, and never hide failure.

## Privacy by design

BuildOne should minimise data, avoid unnecessary permissions, separate secrets from project content, use server-side credentials, protect database rows with ownership controls, and update the privacy notice whenever data flows change.
