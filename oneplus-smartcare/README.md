# OnePlus SmartCare Security Suite

Open-source Android security companion for OnePlus devices, with a companion Termux scanner.

## Features in this first build
- User-selected files via Android Storage Access Framework (no broad storage permission).
- Streaming SHA-256 integrity hashes.
- AES-256-GCM encryption using a non-exportable Android Keystore key.
- Encrypted copies are written only to the app's private storage; source files are never modified.
- Termux read-only inventory and hash report.
- GitHub Actions builds a debug APK and publishes it as a workflow artifact.

## Build the Android app
Open the `android/` directory in Android Studio, or run:
```bash
gradle -p android assembleDebug
```
APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.

GitHub Actions runs on pushes and pull requests. Download the APK from the workflow run's Artifacts section.

## Install on a test device
Transfer the debug APK to your OnePlus Nord 5 and install it after reviewing Android's installation prompt. Debug builds are for testing, not public release.

## Current scope / limitations
This is a starter security utility, not an antivirus or a complete device-hardening product. A SHA-256 digest verifies identity/integrity only when compared with a trusted expected digest. Encryption is one-way in this initial UI; keep the original file and a secure backup. The app does not upload files or request network access.

## Inventory integration
The device inventory report has not yet been supplied to this development session. Add a sanitized copy under `docs/inventory/` only after checking it contains no private paths, personal filenames, tokens, or other sensitive information.
