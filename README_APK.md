# Mikis13 AI - APK & App Installatie Handleiding 📱

Deze handleiding legt uit hoe je de **Mikis13 AI-assistent** als een app installeert op je Android- of iOS-apparaat, en hoe je zelf een native Android **APK-bestand** kunt bouwen.

---

## Methode 1: Direct installeren via de "Installeer App" knop (PWA / WebAPK) - *Aanbevolen* 🌟

Dankzij de Progressive Web App (PWA) ondersteuning kun je de app met één klik installeren zonder handmatig een APK te hoeven downloaden. Op Android wordt deze automatisch omgezet naar een native WebAPK!

### Voor Android (Chrome / Edge / Firefox):
1. Open de live website van **Mikis13 AI** in je browser op je telefoon.
2. Je ziet nu bovenaan of in het menu een knop **"📱 Installeer App"**.
3. Tik op deze knop en bevestig de installatie.
4. De app staat nu direct op je startscherm met het Mikis13 AI-icoon en opent in zijn eigen venster (zonder browserbalken)!

*Opmerking: Als de knop niet verschijnt, kun je op de **3 puntjes** rechtsboven in Chrome tikken en kiezen voor **"App installeren"** of **"Toevoegen aan startscherm"**.*

### Voor iOS (Safari op iPhone/iPad):
1. Open de website in **Safari**.
2. Tik op de **Deel-knop** (vierkantje met pijl omhoog) onderin het scherm.
3. Scroll naar beneden en tik op **"Zet op startscherm"**.
4. Tik op **"Voeg toe"** rechtsboven. De app staat nu op je startscherm!

---

## Methode 1.5: Direct downloaden van GitHub (Rechtstreeks APK) 📥

Dankzij de nieuwe geautomatiseerde GitHub Actions workflow wordt er bij elke update automatisch een up-to-date APK-bestand voor Android gebouwd en gepubliceerd.

### Hoe direct te installeren:
1. Klik op de website op de knop **"📥 Download APK (Rechtstreeks)"** of ga rechtstreeks naar de [Laatste GitHub Release APK downloadlink](https://github.com/Ice1984m/mikis13-ai/releases/latest/download/mikis13-ai.apk).
2. Sla het bestand `mikis13-ai.apk` op je Android-apparaat op.
3. Volg de stappen in **Methode 3** hieronder om het bestand op je telefoon te installeren.

---

## Methode 2: Zelf een native Android APK-bestand bouwen 🛠️

Als je een fysiek `.apk`-bestand wilt hebben om te delen of te installeren, kun je dit heel eenvoudig en gratis genereren.

### De makkelijkste manier (via PWABuilder):
1. Zorg dat je website live staat (bijvoorbeeld via Cloudflare of GitHub Pages).
2. Ga op je computer of telefoon naar [PWABuilder.com](https://www.pwabuilder.com/).
3. Voer de URL van je live website in en klik op **"Start"** of **"Test"**.
4. PWABuilder analyseert de site (onze nieuwe PWA-manifest en service worker worden automatisch herkend!).
5. Klik op **"Package for Store"**.
6. Kies bij **Android** voor **"Generate Package"**.
7. Download het ZIP-bestand. Pak dit uit en je vindt hierin je kant-en-klare `.apk` bestand!

---

## Methode 3: Het APK-bestand installeren op je apparaat (Sideloading) 🚀

Als je een `.apk` bestand hebt gedownload of gebouwd, volg je deze stappen om het te installeren:

1. **Zet het bestand op je telefoon**: Stuur de APK naar je telefoon via USB-kabel, e-mail, Google Drive, WhatsApp of Telegram.
2. **Open de Bestandsbeheer-app**: Open de app *Bestanden*, *Downloads* of *Mijn Bestanden* op je Android-telefoon.
3. **Zoek de APK**: Ga naar de map waar je de APK hebt opgeslagen (meestal de map *Downloads*).
4. **Tik op de APK**: Tik op het bestand om de installatie te starten.
5. **Onbekende bronnen toestaan**:
   - Als dit de eerste keer is dat je een APK installeert, krijg je een beveiligingsmelding dat installatie uit onbekende bronnen is geblokkeerd.
   - Tik op **"Instellingen"** in de melding.
   - Schakel de optie **"Toestaan van deze bron"** of **"Onbekende bronnen toestaan"** in voor je bestandsbeheerder of browser.
6. **Voltooi de installatie**: Ga terug en tik nogmaals op de APK. Tik op **"Installeren"**.
7. **Open de app**: Zodra de installatie klaar is, tik je op **"Openen"**. De app is nu succesvol geïnstalleerd op je apparaat!
