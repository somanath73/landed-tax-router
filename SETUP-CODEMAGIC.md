# Build & ship iOS with Codemagic — no Mac needed

`codemagic.yaml` builds, signs, and uploads **Sales Tax Saver** to TestFlight on
Codemagic's macOS machines. You do the one-time setup below; after that each build is one click.

## 1. App Store Connect API key (lets CI sign + upload without a Mac)
1. App Store Connect → **Users and Access → Integrations** (App Store Connect API) → **+**.
2. Name it, Access = **App Manager**, Generate.
3. **Download the `.p8` file** (downloadable only once) and note the **Key ID** and **Issuer ID**.

## 2. Register the bundle id + create the app record
1. Developer portal → **Certificates, Identifiers & Profiles → Identifiers → +** → App ID →
   bundle **`com.salestaxsaver.app`**.
2. App Store Connect → **Apps → + → New App**: iOS, name **Sales Tax Saver**, bundle
   `com.salestaxsaver.app`, primary language, any SKU. Note the app's numeric **Apple ID** — optionally
   paste it into `APP_STORE_APPLE_ID` in `codemagic.yaml` (auto-bumps the build number).

## 3. Codemagic
1. Sign up at **codemagic.io** with your **GitHub** account.
2. Connect the **landed-tax-router** repo.
3. Team settings → **Integrations → App Store Connect** → add the API key (`.p8` + Key ID + Issuer ID).
   **Name the integration `pixiy_asc`** so it matches `integrations.app_store_connect:` in
   `codemagic.yaml` (or rename it in both places).
4. Codemagic detects `codemagic.yaml` → start a build of the **ios-release** workflow.

## 4. What the pipeline does
Installs deps → builds the web app → generates the iOS project → adds the location purpose string,
the encryption-compliance flag, and the privacy manifest → signs with a cert/profile it fetches via
your API key → uploads the build to **TestFlight**.

## 5. After the first successful upload
- Install **TestFlight** on an iPhone, accept the invite, test on a real device.
- For the public App Store: finish the listing (screenshots, App Privacy, description — see
  `STORE-LISTING.md`), then set `submit_to_app_store: true` in `codemagic.yaml` (or submit from
  App Store Connect) and run again.

## Notes
- `/ios` is generated fresh each CI build (kept out of git); the pipeline re-applies the Info.plist
  keys + privacy manifest every time.
- **The first CI build usually needs 1–2 tweaks** (signing name, Xcode version, a path). Send me the
  build log and I'll fix `codemagic.yaml`.
- For future Pixiy apps: new repo, bundle id `dev.pixiy.<app>`, its own workflow — the Apple org
  account, D-U-N-S, and API key are shared.
