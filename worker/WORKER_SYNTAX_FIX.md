BuildOne Worker syntax audit

The production worker is functionally live for /build, /status, /artifact and /health. A historical worker-check run exposed a syntax error inside an unused workflow() template containing GitHub Actions expressions. This note records the issue for the next Worker source update: remove the unused workflow() generator or escape GitHub Actions `${{ ... }}` expressions before Node syntax checking.

Required verification after source update:
- node --check worker/src/index.js
- /health returns artifactGate=strict
- /artifact requires successful run, matching artifact/run ID, matching commit, non-expired non-empty artifact
- /verify-app-ads-txt must be present before Publish can claim backend verification
