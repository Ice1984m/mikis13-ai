# Android release — Mikis13 AI

Package: `com.mikis13.ai`  
Version: `1.1.0` (versionCode `2`)  
Java: 17 · Android Gradle Plugin: 8.7.3 · Gradle: 8.10.2

## GitHub Actions secrets voor ondertekende release

Maak in GitHub: **Settings → Secrets and variables → Actions → New repository secret** deze vier secrets aan:

- `ANDROID_KEYSTORE_BASE64`: base64-inhoud van de release-keystore (geen newline nodig).
- `ANDROID_KEYSTORE_PASSWORD`: keystore-wachtwoord.
- `ANDROID_KEY_ALIAS`: alias van de upload key.
- `ANDROID_KEY_PASSWORD`: wachtwoord van de alias.

Genereer de upload-keystore lokaal en bewaar de originele JKS/P12 veilig buiten GitHub. Verlies van de sleutel kan toekomstige updates blokkeren. Upload de keystore nooit naar de repository of als workflow-artifact.

Voorbeeld op een lokale computer (bewaar wachtwoorden in een wachtwoordmanager):
```bash
keytool -genkeypair -v -keystore mikis13-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mikis13-upload
base64 -w 0 mikis13-upload.jks
```

Kopieer de base64-uitvoer naar `ANDROID_KEYSTORE_BASE64`; voeg de drie bijbehorende wachtwoord-/aliaswaarden afzonderlijk toe als secrets.

## Build

Een push met wijzigingen onder `android-app/**` start automatisch de workflow. Handmatig kan dit via **Actions → Mikis13 AI Android build en releasecontrole → Run workflow**.

Zonder signing secrets bouwt de workflow een debug-APK en een unsigned release-AAB voor buildvalidatie. Met alle vier secrets bouwt en verifieert hij daarnaast de ondertekende release-APK en release-AAB.

## Google Play

De AAB is pas klaar voor Play-upload wanneer de workflow de ondertekende releasebestanden heeft geproduceerd. Google Play App Signing en de Play Console-upload key moeten in Play Console worden ingesteld. Publiceren gebeurt afzonderlijk na controle van store listing, privacyverklaring, content rating, data safety en test-track vereisten.
