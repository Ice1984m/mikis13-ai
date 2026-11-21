# OnePlus SmartCare — build status

## Source
The Android Kotlin source, Gradle configuration, read-only Termux scanner, security notes, and GitHub Actions workflow are committed under `oneplus-smartcare/`.

## APK status
A debug APK build is configured in `.github/workflows/oneplus-smartcare-android.yml`. This session cannot execute Android Gradle builds on the OnePlus phone, and a successful GitHub Actions run/artifact has not yet been verified. Do not treat the APK as installed or ready until the workflow succeeds and the APK is tested on the device.

## Inventory
The earlier inventory file is still on the phone and was not available to this development session. Device-specific findings have therefore not been added. Upload a sanitized inventory report to continue integration.

## Safety
The app uses Android's file picker, requests no broad storage or network permission, reads the original file, and stores an AES-GCM encrypted copy in app-private storage. The Termux script is read-only and computes SHA-256 hashes for selected file types. Neither component deletes, moves, or executes user files.
