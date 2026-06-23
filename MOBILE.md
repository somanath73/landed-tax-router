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

## Permissions + required iOS Info.plist keys

The native **`@capacitor/geolocation`** plugin is already wired in (the app uses it on device, and the
browser Geolocation API on the web). You still must declare the OS permission strings or it won't prompt:

- **Android** — `android/app/src/main/AndroidManifest.xml`:
  `<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />`
- **iOS** — in Xcode, add to `ios/App/App/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Sales Tax Saver uses your location to find the local sales tax rate for your area.</string>
<!-- HTTPS-only app, no custom crypto: skips the export-compliance prompt on every upload -->
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

A vague location string (e.g. "this app needs your location") is rejected under 5.1.1 — keep it specific.

### Privacy manifest (required since May 2024 — rejected at UPLOAD if missing)

Capacitor does **not** auto-create your app's manifest. Add **`ios/App/App/PrivacyInfo.xcprivacy`** to the
App target (declares `localStorage`→UserDefaults under reason `CA92.1`, plus the location data type):

```xml
<plist version="1.0"><dict>
  <key>NSPrivacyTracking</key><false/>
  <key>NSPrivacyTrackingDomains</key><array/>
  <key>NSPrivacyCollectedDataTypes</key><array><dict>
    <key>NSPrivacyCollectedDataType</key><string>NSPrivacyCollectedDataTypePreciseLocation</string>
    <key>NSPrivacyCollectedDataTypeLinked</key><false/>
    <key>NSPrivacyCollectedDataTypeTracking</key><false/>
    <key>NSPrivacyCollectedDataTypePurposes</key>
    <array><string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string></array>
  </dict></array>
  <key>NSPrivacyAccessedAPITypes</key><array><dict>
    <key>NSPrivacyAccessedAPIType</key><string>NSPrivacyAccessedAPICategoryUserDefaults</string>
    <key>NSPrivacyAccessedAPITypeReasons</key><array><string>CA92.1</string></array>
  </dict></array>
</dict></plist>
```

After archiving, check Xcode's **Privacy Report** for any other required-reason APIs pulled in by deps.

---

## iOS in-app tipping (StoreKit IAP — replaces Buy Me a Coffee on iOS)

Apple Guideline **3.1.1** forbids the external "Buy Me a Coffee" link on iOS (tips must use IAP). The app
already routes by platform via `<TipOrCoffee />` in `landed-tax-router.jsx`: **web + Android keep Buy Me a
Coffee**; **iOS shows a StoreKit tip jar** (powered by `@revenuecat/purchases-capacitor`, already a dep).
Until you finish the setup below, the iOS tip buttons just say "coming soon" and charge nothing.

> Google Play is fine with the Buy Me a Coffee link because the tip unlocks nothing in the app
> (Google treats a 0%-unlock tip as an exempt peer-to-peer payment). Do **not** gate any feature behind it.

To activate iOS tipping (on the Mac, before submitting):

1. **App Store Connect → your app → In-App Purchases**: create three **Consumable** products with these
   exact IDs (match `TIP_TIERS` in `landed-tax-router.jsx`) and prices:
   - `com.salestaxsaver.tip.small` — $1.99
   - `com.salestaxsaver.tip.medium` — $4.99
   - `com.salestaxsaver.tip.large` — $9.99
2. **RevenueCat** (free tier is fine): create a project, add the iOS app (bundle `com.salestaxsaver.app`)
   and the three products, then copy the **iOS public SDK key** (`appl_…`).
3. Paste it into `REVENUECAT_IOS_API_KEY` in `landed-tax-router.jsx`, then `npm run cap:sync` (installs the
   RevenueCat pod). Test a purchase with a **Sandbox** Apple ID on a real device.
4. Declare RevenueCat in your **App Privacy** answers / privacy manifest if its SDK collects anything
   (a basic tip-jar config does not link data to the user).

If you'd rather not use a third-party SDK, swap to `@capacitor-community/in-app-purchases` (StoreKit direct)
— the `purchaseTip()` seam is the only function to change.

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

- A **privacy policy URL** — **mandatory for every App Store app** (even with no account). Host a short
  page (a static page on the GitHub Pages site works) and paste the public URL into App Store Connect.
- **Screenshots**, an app description (frame it as **estimates** / "not tax advice"), keywords (≤100 chars),
  support URL, and a category (Finance or Utilities).
- **Versioning**: set the public version to **1.0.0** and build to **1** for the first submission
  (don't ship `0.1.0`). Bump both each release.

### iOS (App Store) — verified requirements (2026)

- **Mac + Xcode 26+** — Apple requires building with the **iOS 26 SDK** for all uploads (since Apr 28, 2026);
  Capacitor 8 also needs Xcode 26 / Node 22+ / iOS 15.0 deployment target.
- Set **Version = 1.0.0**, **Build = 1** (General tab); enable **Automatically manage signing** + your Team.
- **App icon**: a **1024×1024 PNG with NO transparency** (see the icon section) — alpha is rejected.
- Add the **Info.plist keys** and **`PrivacyInfo.xcprivacy`** above; resolve the **iOS tipping** (tip jar, not
  the Buy Me a Coffee link) — both are already handled in code, you just finish the StoreKit setup.
- **App Privacy** questionnaire (App Store Connect → App Privacy): Data Collection = **Yes** → add
  **Location → Precise Location**, Purpose = **App Functionality**, Linked to identity = **No**, Used for
  tracking = **No** (the BigDataCloud reverse-geocoder is a processor, not a tracker; no ads/analytics SDKs).
- **Screenshots**: at least the **6.9″** iPhone set at exactly **1320×2868** (or 1290×2796), PNG/JPEG, RGB,
  **no alpha**, exact pixels (off-by-one is rejected); 1–10 images.
- Build: select **Any iOS Device (arm64)** → **Product → Archive** → Organizer → **Distribute App →
  App Store Connect → Upload**. Optionally smoke-test via **TestFlight** internal testing on a real device.
- Attach the processed build to the version, complete all metadata, and **Submit for Review**
  (first-time new-app review ≈ 2–5 days). Add review notes: works offline, uses device location → ZIP via a
  reverse-geocoder, and provides **estimates, not tax advice**.

### Android (Google Play)

Android Studio → *Build → Generate Signed Bundle/AAB* → upload the `.aab` in the
[Play Console](https://play.google.com/console). The Buy Me a Coffee link is allowed (it unlocks nothing).
