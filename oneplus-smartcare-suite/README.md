# OnePlus SmartCare Security Suite

Open-source MVP for Android + Termux, designed for OnePlus devices including Nord 5.

## Modules
- **Android app**: user-selected files via Android Storage Access Framework; SHA-256 integrity checks; AES-256-GCM encryption using Android Keystore.
- **Termux tool**: read-only inventory, file-type overview, SHA-256 checksums for selected files, timestamped reports.
- **Privacy-first**: no network permission, no broad storage permission, no automatic deletion, no execution of scanned files.

## Safety notes
- A SHA-256 checksum is an integrity fingerprint, not malware detection.
- Encryption keys remain in Android Keystore and are not exportable by this app.
- Encrypted files can only be decrypted while the original app installation and its Keystore key remain available. Back up the original file before encryption.
- The first MVP does not claim antivirus protection or full device hardening.
- The app never encrypts files in place: output is a separate user-selected document.

## Build Android APK
Open `android/` in Android Studio and build the `app` debug variant, or use the included GitHub Actions workflow. Debug APKs are for testing and are not Play Store releases.

## Termux install
In Termux:
```bash
termux-setup-storage
pkg update
pkg install -y coreutils findutils file openssl
mkdir -p "$HOME/smartcare"
curl -fsSL https://raw.githubusercontent.com/Ice1984m/mikis13-ai/main/oneplus-smartcare-suite/termux/smartcare.sh -o "$HOME/smartcare/smartcare.sh"
chmod 700 "$HOME/smartcare/smartcare.sh"
bash "$HOME/smartcare/smartcare.sh"
```

The script writes new timestamped reports to `~/storage/shared/Download/` and does not overwrite earlier reports.

## License
MIT. See the repository's root LICENSE.
