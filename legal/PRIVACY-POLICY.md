# BuildOne Privacy Policy

**Product:** BuildOne
**Operator:** BuildOne / EarnPlayApps
**Effective date:** 11 September 2026
**Version:** 1.0

> This document is the product privacy-policy baseline. Before public release, the operator must replace the contact placeholders in `legal/CONTACT-CONFIG.md` with a real privacy/support contact and publish this policy at a stable public HTTPS URL. BuildOne's release gate must block publication until that configuration is complete.

## 1. Scope
This policy explains how BuildOne handles information when a person uses the BuildOne application, website, build service, editor, build pipeline, artifact service or related support functions.

## 2. Data minimisation
BuildOne is designed to collect only information needed to provide the requested service. A project may contain HTML, CSS, JavaScript and assets supplied by the user. BuildOne does not intentionally request contacts, precise location, microphone, camera, SMS, call logs or other sensitive permissions unless a future BuildOne feature genuinely requires them and the user is clearly informed first.

## 3. Project and build data
Depending on features enabled by the user, BuildOne may process project name, package identifier, version, source files, build configuration, build ID, build status, error/log information, workflow/run identifiers, artifact metadata and verification hashes. Source code and uploaded assets are processed only for the build functions requested by the user.

## 4. Account and authentication data
If BuildOne enables accounts, authentication providers may process an identifier such as an email address and authentication/session information. BuildOne will not use authentication metadata as an authorization substitute. Account data must be protected by server-side access controls.

## 5. GitHub, Cloudflare and Supabase
BuildOne may use GitHub Actions and a Cloudflare Worker to execute and verify builds. If the optional dedicated BuildOne Supabase service is enabled, it may store project/build/history records. Service-role credentials remain server-side and are never placed in public app HTML. Third-party providers process data according to their own terms and privacy documentation.

## 6. Advertising
BuildOne supports Google Mobile Ads Banner and Interstitial advertising. Advertising identifiers and ad requests may be processed by Google according to Google's policies and the configuration selected by the app operator. Test ads must be used during development. Production advertising requires the appropriate disclosures and Play Console declarations.

## 7. Cookies and local storage
The BuildOne web interface may use local storage for local project state, preferences, temporary backup state and build history. If cookies or similar technologies are introduced, the public privacy notice must be updated before the feature is released where disclosure or consent is required.

## 8. Security
BuildOne uses least-privilege permissions, HTTPS, secret separation, server-side tokens, artifact verification, build gates, backup and rollback controls. Build secrets and signing credentials must not be stored in source code, public HTML or build logs.

## 9. Retention
BuildOne should retain project/build information only for as long as necessary for the requested service, security, legal obligations, dispute handling or recovery. Artifact retention is limited by configured CI retention and may expire. Exact retention periods must be configured in `legal/CONTACT-CONFIG.md` before production launch.

## 10. Deletion and user requests
Where BuildOne stores account or project information, the user must have a practical way to request access, correction or deletion where applicable. Deletion requests must be verified, logged and handled without exposing another person's data. Legal retention requirements may limit immediate deletion.

## 11. Data breaches
BuildOne maintains an incident-response process. Suspected security incidents are contained, investigated, documented and escalated according to applicable law and contractual requirements. Applicable Malaysian personal-data breach notification requirements must be followed where they apply.

## 12. Children
BuildOne is not designed to require children to provide personal data. If a distribution channel imposes age-related requirements, BuildOne must follow that channel's current rules and configure the product accordingly.

## 13. International processing
BuildOne may use service providers operating in other countries. Where personal data is transferred cross-border, the operator must use an appropriate legal and contractual mechanism and update this notice when required.

## 14. Changes
This policy may be updated when BuildOne changes its data practices, providers, legal obligations or security controls. Material changes should be communicated through an appropriate notice.

## 15. Contact
Privacy questions, data requests and security reports must use the real contact configured in `legal/CONTACT-CONFIG.md`. BuildOne must not publish a made-up email address.

## 16. Legal note
This policy is a compliance baseline, not a guarantee that every possible law in every country is satisfied. The operator remains responsible for reviewing the jurisdictions, business model, data flows and distribution channels in which BuildOne is actually offered.
