# BuildOne Firebase setup

BuildOne uses Firebase Cloud Functions 2nd gen as the backend API and Firestore for build records. GitHub Actions remains the real Android Gradle build engine.

## 1. Select/create the Firebase project

Open Firebase Console and select the project that will host BuildOne. Enable:
- Cloud Functions
- Cloud Firestore
- Authentication (recommended before production)

## 2. Install/login to Firebase CLI

From the `firebase/` directory:

```bash
npm install -g firebase-tools
firebase login
firebase use <YOUR_FIREBASE_PROJECT_ID>
```

## 3. Install function dependencies

```bash
cd functions
npm install
cd ..
```

## 4. Add secrets

Do not put a GitHub token in `index.html`, Firestore, or the repository.

```bash
firebase functions:secrets:set GITHUB_TOKEN
firebase functions:secrets:set BUILDONE_API_KEY
```

`GITHUB_TOKEN` needs repository Contents write access and Actions read access for `EarnPlayApps/BuildOne`.
`BUILDONE_API_KEY` is the private API key used by the current BuildOne frontend while the Firebase/Auth migration is being completed.

## 5. Deploy

```bash
firebase deploy --only functions,firestore:rules,storage
```

The deployed function is named `buildoneApi`.

## 6. Connect BuildOne

The existing BuildOne backend URL field can point to the deployed Firebase function URL. Use the `BUILDONE_API_KEY` value in the existing backend-key field. The repository remains `EarnPlayApps/BuildOne` and branch `main`.

## Security

The GitHub token is server-side only. Firestore and Storage rules in this scaffold are deny-by-default. Before public production use, add Firebase Authentication/App Check and replace the temporary browser API-key mechanism. Firebase documents App Check enforcement for Cloud Functions and recommends it before launch.
