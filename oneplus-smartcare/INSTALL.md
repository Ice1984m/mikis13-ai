# Install and test

## Android debug APK
1. Open the repository's [Actions page](https://github.com/Ice1984m/mikis13-ai/actions).
2. Open the latest **OnePlus SmartCare Android APK** run.
3. Wait for the build to finish successfully.
4. Download the `OnePlus-SmartCare-debug-apk` artifact and extract `app-debug.apk`.
5. Transfer it to the OnePlus Nord 5 and open it from Downloads.
6. Approve installation only if the APK came from this repository's successful workflow.

If no run is present, open the workflow and choose **Run workflow**.

## Termux scanner
The script is at `oneplus-smartcare/termux/smartcare-scan.sh`. From Termux, after installing Git and granting shared-storage access:
```bash
pkg install -y git
termux-setup-storage
git clone https://github.com/Ice1984m/mikis13-ai.git
cd mikis13-ai/oneplus-smartcare/termux
bash smartcare-scan.sh
```
It writes a timestamped report under `Download`. It reads file names and metadata and computes hashes for selected file types; it does not execute or delete files.

## Important encryption recovery warning
The AES key is held by Android Keystore on this device. The app can restore files encrypted by the same app installation. **Uninstalling the app, clearing its app data, or resetting the device may destroy the key and make encrypted copies unrecoverable.** Keep original files and independent backups. Test with a disposable sample file before encrypting anything important.
