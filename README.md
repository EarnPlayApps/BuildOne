# BuildOne

**BuildOne v1.0 — Real Android Build System**

BuildOne converts editable HTML projects into real Android APK/AAB artifacts through a guarded pipeline.

## Pipeline

`Project → Editor → Analyze → Smart Core → Auto Repair → Backup → Generate Android → Auto Version → Gradle → GitHub Actions → Build Gate → Real Build → Artifact Verification → APK/AAB → AdMob → Signing → Publish → History → Rollback`

## Core rules

- BuildOne is a standalone project. Other product names are not part of its architecture.
- No fake Success and no fake APK Ready state.
- Exact `build_id → trigger_sha → GitHub run → run SHA → artifact` tracking.
- APK/AAB download is blocked until the artifact is verified.
- Build failures are recorded and can be retried; the last backup remains available for rollback.
- HTML preview is sanitized for WebView compatibility and does not depend on Android SDK metadata.
- Release signing uses GitHub Secrets, never public HTML.

## Services

- Cloudflare Worker: BuildOne API and verification layer.
- GitHub Actions: BuildOne's real Android build engine.
- Supabase: optional persistent BuildOne database using the dedicated schema under `supabase/migrations/`.
- Firebase and FlutterFlow are not required by the core pipeline.

## Android compatibility baseline

- JDK 17
- Gradle 8.7
- Android Gradle Plugin 8.6.1
- compileSdk 35
- targetSdk 35
- minSdk 23
- Google Mobile Ads SDK 25.4.0

## AdMob

BuildOne supports Banner + Interstitial. The UI validates App ID and Ad Unit ID formats before build generation.

## Signed releases

Configure GitHub repository secrets:

`BUILDONE_KEYSTORE_BASE64`, `BUILDONE_KEYSTORE_PASSWORD`, `BUILDONE_KEY_ALIAS`, `BUILDONE_KEY_PASSWORD`

## Setup

See [`docs/BUILDONE-SETUP.md`](docs/BUILDONE-SETUP.md).
