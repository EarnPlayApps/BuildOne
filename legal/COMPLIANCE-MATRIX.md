# BuildOne Compliance Matrix

This is a release-control checklist, not a legal guarantee.

| Area | BuildOne control | Release state |
|---|---|---|
| Privacy notice | Public HTTPS privacy policy + matching data flows | BLOCK until URL/config complete |
| Terms | Public HTTPS Terms | BLOCK until URL/config complete |
| Contact | Real operator/support/privacy contacts | BLOCK until configured |
| Data minimisation | Permission/data-flow analysis | Required |
| Sensitive permissions | Core-functionality gate + disclosure | Required |
| AdMob | App ID/unit validation + ad disclosure | Required when ads enabled |
| app-ads.txt | Exact publisher entry verification | Required when applicable |
| Signing | GitHub Secrets only | Required for signed release |
| Secrets | No secret in HTML/log/artifact metadata | Required |
| Build verification | Exact run/commit/artifact/type/build ID | Required |
| Backup | Backup before destructive repair/migration | Required |
| Recovery | Bounded retry + rollback path | Required |
| Security | Unsafe resource/secret/dependency checks | Required |
| Target API | Current Google Play target requirement | Required |
| Data Safety | Store declaration must match actual app | Required before Play submission |
| Account deletion | Provide where account creation creates applicable deletion obligations | Required where applicable |
| Third-party disclosures | GitHub/Cloudflare/Supabase/Google disclosures when relevant | Required |
| Incident response | Detection, containment, record, notification process | Required |

## Current Play target requirement

As of 31 August 2026, new Google Play apps and updates generally need Android 16 / API 36 or higher. BuildOne therefore moves its generated Android baseline to API 36 for mobile Play releases. Exceptions apply to other form factors and Google policies; BuildOne must select the correct profile for the actual target form factor.

## Malaysia privacy baseline

Where Malaysia's Personal Data Protection Act 2010 applies to BuildOne's commercial processing, the operator must maintain appropriate privacy, security, retention, access, correction, deletion/other applicable rights and breach-response processes. The Personal Data Protection (Amendment) Act 2024 and its staged commencement dates must be considered for the live service.
