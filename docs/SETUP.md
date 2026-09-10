# BuildOne Full Setup

1. Connect the repository and Worker.
2. The Worker stores the GitHub token as a secret; never put it in HTML.
3. BuildOne generates the Android project and workflow.
4. GitHub Actions uses JDK 17, Gradle 8.7 and AGP 8.6.1.
5. Build Gate stops missing/invalid projects.
6. Artifact Verification requires a non-empty APK/AAB and SHA-256 metadata.
7. Download is allowed only after real CI success and artifact verification.
8. Release signing credentials belong in GitHub Secrets, never source or logs.