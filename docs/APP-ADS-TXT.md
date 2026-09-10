# BuildOne — app-ads.txt

BuildOne supports generating and validating the Google AdMob `app-ads.txt` entry.

## Required value

Use the AdMob **Publisher ID**, not the App ID or Ad Unit ID.

Publisher ID format:

`pub-XXXXXXXXXXXXXXXX`

## Standard Google entry

```text
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

## Hosting

The file must be publicly reachable as:

`https://YOUR-DEVELOPER-DOMAIN/app-ads.txt`

Do not put the file only inside the APK/AAB. AdMob crawlers need to reach it from the developer website associated with the app.

BuildOne should generate the file, allow the user to copy/download it, and verify the hosted file before release where server-side verification is available.
