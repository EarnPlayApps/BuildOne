# BuildOne User Requirements Standard

## What the user should experience

The user should not need to understand Gradle, JDK, AGP, GitHub Actions, Cloudflare, database internals or artifact hashes to make a normal app.

### Normal path

`Create Project → Edit → Analyze → Fix if needed → Backup → Build → Verify → Download`

### Release path

`Analyze → Security → Privacy/Terms → AdMob if enabled → Signing → Build AAB → Verify → Release Gate → Publish`

## User controls

- Cancel queued work where technically possible.
- See exactly why a build failed.
- Retry a failed build with bounded retries.
- Restore the last safe backup.
- Export/download verified artifacts only.
- See build history and artifact metadata.
- Change or delete their project according to the configured account/data model.
- Receive clear notices for material errors, security issues and required actions.

## No surprise behaviour

BuildOne must not:

- silently upload project content for unrelated purposes;
- silently enable dangerous permissions;
- silently replace a project without backup;
- call an artifact verified before verification;
- hide an external provider failure;
- expose secrets in logs;
- force an update that can destroy project data;
- claim universal legal compliance.

## Accessibility and simplicity

Use plain-language status messages, visible progress stages, safe defaults, mobile-friendly controls and clear recovery actions. Advanced diagnostics may be available behind an optional details view rather than forcing technical information on every user.

## User data ownership principle

A user's project is treated as user-controlled content. BuildOne's processing rights are limited to providing the requested service and the lawful purposes disclosed in the privacy policy and applicable agreements.
