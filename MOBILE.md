# Publishing Sales Tax Saver to the App Store & Google Play

The app is a single web build wrapped in a native shell with **[Capacitor](https://capacitorjs.com/)**.
Capacitor is already configured (`capacitor.config.json`, deps in `package.json`). The native
projects (`/android`, `/ios`) are **not committed** — you generate them locally with the commands
below, then build/submit from Android Studio / Xcode.

App identity (edit in `capacitor.config.json` before first build):
- **appId**: `com.salestaxsaver.app`  ← change to a domain you control if you prefer
- **appName**: `Sales Tax Saver`

---

## One-time prerequisites

- **Node 20+** and this repo (`npm install`)
- **Android:** [Android Studio](https://developer.android.com/studio) + a Google Play
  Developer account ($25, one-time)
- **iOS:** a **Mac** with **Xcode** + **CocoaPods** (`sudo gem install cocoapods`) + an Apple
  Developer account ($99/yr). iOS cannot be built on Windows/Linux.

---

## Build + run

```bash
npm install                 # installs deps incl. Capacitor

# Add the native platforms once (creates /android and, on a Mac, /ios)
npx cap add android
npx cap add ios             # macOS only

# Each time you change the web app, rebuild + copy into the native shells:
npm run cap:sync            # = vite build (base "/") + cap sync

# Open the native IDEs to run / archive / submit:
npm run cap:android         # opens Android Studio
npm run cap:ios             # opens Xcode (macOS)
```

> The Capacitor build uses the default web base (`/`), which is what the native WebView needs.
> The GitHub Pages site is a separate build (it sets `BASE_PATH=/landed-tax-router/`) — unaffected.

---

## App icon & splash screen

A ready-made source icon ships at **`resources/icon.svg`** (the green price-tag mark).
Capacitor's asset generator needs a **1024×1024 PNG**, so export it once, then generate every size:

```bash
# Export resources/icon.svg -> resources/icon.png at 1024x1024 (any editor, or:)
#   npx svgexport resources/icon.svg resources/icon.png 1024:1024
npm i -D @capacitor/assets
npx capacitor-assets generate          # writes all icon/splash sizes into /android and /ios
```

Optionally add `resources/splash.png` (2732×2732) for a custom launch screen.

---

## Permissions (required for the "My location" feature)

The native **`@capacitor/geolocation`** plugin is already wired in (the app uses it on device, and the
browser Geolocation API on the web). You still must declare the OS permission strings or it won't prompt:

- **iOS** — in Xcode, add to `Info.plist`:
  `NSLocationWhenInUseUsageDescription` = "Used to find tax-free pickup locations near you."
- **Android** — `android/app/src/main/AndroidManifest.xml`:
  `<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />`

---

## Live tax rates in the native app

The web app gets exact live rates through a same-origin `/api/taxrate` proxy
(`netlify/functions/taxrate.js`). A native app has no same-origin server, so:

- **By default the app ships with bundled estimates** (Florida is exact per county; other states
  show the state base rate). This works fully offline and needs no setup.
- **To enable live rates in the app**, deploy the proxy (e.g. on Netlify) and change the client to
  call its absolute URL instead of the relative `/api/taxrate`, then build with `VITE_LIVE_RATES=1`.
  Keep the `TAXJAR_API_KEY` on the server only — never bundle it into the app.

---

## Store submission checklist

Both stores also require, beyond the build:

- A **privacy policy URL** (the app uses location + sends a ZIP to the rate service when live).
- **Screenshots** for each required device size, an app description, and a category.
- **Versioning**: bump `version` in `package.json` and the native version/build numbers each release.

**Android (Google Play):** Android Studio → *Build → Generate Signed Bundle/AAB* → upload the
`.aab` in the [Play Console](https://play.google.com/console).

**iOS (App Store):** Xcode → set your Signing Team + Bundle Identifier → *Product → Archive* →
*Distribute App* → upload to [App Store Connect](https://appstoreconnect.apple.com).
