# BuildOne v1.0 — production setup

BuildOne is the only product name used by this project. The repository is `EarnPlayApps/BuildOne`.

## Core services

- **Cloudflare Worker:** BuildOne API layer, exact build tracking, artifact gate and app-ads.txt verification.
- **GitHub Actions:** BuildOne Android build engine using JDK 17, Gradle 8.7, AGP 8.6.1 and Android SDK 35/minSdk 23.
- **Supabase:** optional persistent database for BuildOne. Use a dedicated BuildOne Supabase project; do not point BuildOne at an unrelated project.
- **Firebase / FlutterFlow:** not required by the BuildOne core pipeline.

## Cloudflare Worker secrets

Set these as Worker secrets/environment variables:

- `GITHUB_TOKEN` — GitHub token with the repository permissions required by the Worker.
- `BUILDONE_KEY` — optional private API key for BuildOne UI → Worker calls.
- `SUPABASE_URL` — optional dedicated BuildOne Supabase URL.
- `SUPABASE_SERVICE_ROLE_KEY` — optional server-side Supabase service-role key. Never put this in `index.html`.

## Signed release secrets

For the **Signed release** build mode, configure these GitHub Actions repository secrets:

- `BUILDONE_KEYSTORE_BASE64`
- `BUILDONE_KEYSTORE_PASSWORD`
- `BUILDONE_KEY_ALIAS`
- `BUILDONE_KEY_PASSWORD`

The workflow imports the keystore only during the job and removes it after the build. Secrets are never printed by BuildOne.

## Real build gate

A BuildOne download is valid only after all of these are true:

1. The request has a unique BuildOne `build_id`.
2. `.buildone/trigger.json` was committed and produced a `trigger_sha`.
3. GitHub Actions has a BuildOne workflow run whose `head_sha` exactly matches that `trigger_sha`.
4. The run conclusion is `success`.
5. The artifact exists, is non-empty, is not expired, and its type matches APK/AAB.
6. The artifact is associated with the exact workflow run and commit.

The UI must not show a verified download when any gate is missing.

## AdMob

BuildOne uses Banner + Interstitial. Development builds should use Google test ads until production release testing is complete. The BuildOne AdMob configuration is validated by format before packaging.

## app-ads.txt

The publisher entry must be hosted publicly at `https://YOUR-DOMAIN/app-ads.txt`. BuildOne can verify the exact publisher line through the Worker.

## Backup / rollback

BuildOne backs up the project before repair or build preparation. Migration/repair/build failures must leave the previous backup available for rollback.

## Migration scope

Migration is deliberately bounded: backup → analyze → compatibility plan → repair/apply → build → verify. Unsupported Android-native structures should be reported instead of silently rewritten.
