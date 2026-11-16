# Android release signing

The signed release workflow is `.github/workflows/android-release.yml`.
It builds a release APK and Android App Bundle (AAB), runs Android lint and
unit tests, verifies the APK signature with apksigner, verifies the AAB
signature with jarsigner, and uploads both files as a GitHub Actions artifact.

## One-time GitHub Actions secrets

Create these repository Actions secrets under Settings → Secrets and variables
→ Actions:

- `ANDROID_KEYSTORE_BASE64`: Base64-encoded JKS upload keystore.
- `ANDROID_KEYSTORE_PASSWORD`: keystore password.
- `ANDROID_KEY_ALIAS`: alias of the upload key.
- `ANDROID_KEY_PASSWORD`: upload key password.

Generate and store the upload key securely on a trusted computer. Example:

```bash
keytool -genkeypair -v -keystore mikis13-upload.jks -alias mikis13-upload -keyalg RSA -keysize 2048 -validity 10000
base64 -w 0 mikis13-upload.jks
```

Copy the Base64 output directly into the `ANDROID_KEYSTORE_BASE64` secret.
Do not commit the keystore, passwords, Base64 output, or signing files.
Keep an encrypted offline backup of the keystore and its credentials.

Use this upload key with Google Play App Signing. Google Play manages the
app-signing key after enrollment; the upload key is only used to authenticate
uploads. Never regenerate or replace the upload key casually after publishing.

## Run

Open Actions → “Mikis13 AI signed Android release” → Run workflow.
A successful run publishes APK, AAB, and SHA-256 checksum files as an artifact.
This workflow does not publish to Google Play automatically.
