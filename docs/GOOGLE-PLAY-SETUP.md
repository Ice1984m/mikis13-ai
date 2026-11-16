# Google Cloud & Google Play Console — Mikis13 AI

This repository currently contains an Android WebView app (application ID: `com.mikis13.ai`).
The Android app does not currently implement Google Sign-In or Firebase. Do not add
`google-services.json` or OAuth client IDs unless a concrete Firebase or Google Identity
feature is added to the app.

## 1. Google Cloud project

1. Sign in to Google Cloud Console with the Google account that owns the Play developer account:
   https://console.cloud.google.com/
2. Create or select a dedicated project, for example `mikis13-ai-play`.
3. Enable **Google Play Android Developer API** (also called Android Publisher API):
   https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com
4. Open **IAM & Admin → Service Accounts** and create a service account, for example
   `mikis13-play-publisher`.
5. Create a JSON key only if GitHub Actions will upload releases automatically.
   Download it once and store it securely. Never commit it to this repository, an issue,
   chat, or an artifact.

## 2. Link the service account to Play Console

1. Open Google Play Console:
   https://play.google.com/console/
2. Open **Setup → API access** (menu wording may vary).
3. Link the Cloud project created above.
4. Grant the service account access to the Mikis13 AI app, using only the permissions
   required for the intended release workflow (normally release management / testing-track
   access first; production rollout only when explicitly authorized).
5. Confirm the app exists in Play Console with package name exactly
   `com.mikis13.ai`.

The Google account used for Play Console must have the required account permissions to
link the project and grant access. A service account alone cannot accept developer terms,
create the developer account, or complete identity/payment verification.

## 3. GitHub Actions secrets (only for automated publishing)

In GitHub → repository **Settings → Secrets and variables → Actions**, add:

- `PLAY_SERVICE_ACCOUNT_JSON`: the complete service-account JSON key, stored as a secret.
- `ANDROID_KEYSTORE_BASE64`: Base64-encoded release keystore (only after the release
  keystore has been created and backed up securely).
- `ANDROID_KEYSTORE_PASSWORD`: keystore password.
- `ANDROID_KEY_ALIAS`: signing key alias.
- `ANDROID_KEY_PASSWORD`: signing key password.

Do not create placeholder secrets and do not paste credentials into workflow YAML.
Restrict who can edit workflows and access environments/secrets. Use a protected GitHub
Environment (for example `play-internal`) with required reviewers before any upload.

## 4. Release prerequisites

- Confirm the final application ID: `com.mikis13.ai`.
- Confirm the Play Console app record uses the same package name.
- Choose and permanently back up the upload keystore; losing it can block future updates.
- Configure the Android release signing config to read credentials from environment variables.
- Build and validate a release AAB; do not publish a debug APK.
- Upload first to an internal testing track and verify installation, login, network/API
  behavior, privacy disclosures, data safety, content rating, store listing, and screenshots.
- Production rollout must remain a separate, explicitly approved action.

## 5. Current integration status

- Android application ID found in Gradle: `com.mikis13.ai`.
- Current Android app is a WebView wrapper pointing to the Mikis13 AI Worker URL.
- No Google Sign-In, Firebase SDK, `google-services.json`, Play Publisher credentials,
  release keystore, or automated Play upload configuration was found during preparation.
- No Google account or Play Console account has been connected by this repository change.

## Official documentation

- Google Play Developer API: https://developers.google.com/android-publisher
- Set up API access: https://support.google.com/googleplay/android-developer/answer/9844686
- Service accounts: https://cloud.google.com/iam/docs/service-accounts
- GitHub Actions encrypted secrets: https://docs.github.com/actions/security-guides/using-secrets-in-github-actions
