# App Store setup — Organization (LLC) route + ready-to-paste listing

This is the operator's checklist for publishing **Sales Tax Saver** under an **LLC** (organization
Apple account), plus copy you can paste straight into App Store Connect. For the technical iOS build
(Xcode, Info.plist, privacy manifest, screenshots), see **MOBILE.md**.

> **Who does this:** the LLC's owner/officer (e.g. your wife) enrolls and signs, using **her** Apple
> Account — Apple verifies that the enroller has legal authority to bind the entity. Keep the H‑1B
> holder out of the operating role (see the immigration note at the bottom).

---

## 1. D‑U‑N‑S number for the LLC  *(required, free)*

Apple uses it to verify the LLC's legal entity, name, and address.

1. Check if the LLC already has one with Apple's look‑up tool: <https://developer.apple.com/enroll/duns-lookup/>
2. If not, request one **free** from Dun & Bradstreet via that tool. Use the LLC's **exact legal name and
   address** (must match your state registration). New numbers can take a few days to a few weeks.
3. After you have it, allow **up to 2 business days** for Apple to receive it from D&B before enrolling.

## 2. LLC website  *(required for org verification)*

Apple requires the organization to have a **publicly available, functional website on a domain
associated with the LLC** — not a social‑media page, not a parked/registrar placeholder.
- If the LLC has no site yet, stand up a simple one on the LLC's own domain (a one‑pager is fine).
- Note: this is for *enrolling the LLC*. The app's **Support / Privacy / Marketing** URLs in the listing
  can be the GitHub Pages links below (or move them onto the LLC domain for consistency).

## 3. Enroll the LLC as an Organization

At <https://developer.apple.com/programs/enroll/> ($99/yr): choose **Company / Organization**, enter the
**legal entity name** (must match D&B exactly), the **D‑U‑N‑S number**, address, and website. Apple may
call or email to confirm the enroller's authority. Approval can take a few days.

## 4. Bundle ID

Keep **`com.salestaxsaver.app`** (already set in `capacitor.config.json`). It does **not** need to match
the LLC's domain — it only has to be unique, and it gets registered to the LLC's Team during signing.

---

## 5. Create the app in App Store Connect

Apps → **+** → New App:

| Field | Value |
|---|---|
| Platform | iOS |
| Name | **Sales Tax Saver**  *(check it's available; ≤30 chars)* |
| Primary language | English (U.S.) |
| Bundle ID | `com.salestaxsaver.app` |
| SKU | `salestaxsaver-001`  *(any private unique string)* |
| User access | Full Access |

---

## 6. Listing copy — paste these

**Subtitle** *(≤30 chars — pick one)*
- `Ship home or drive to save`
- `The true cost, after tax`

**Promotional text** *(≤170 chars)*
```
Before you buy, see the true cost — price + sales tax + gas + your time — and whether driving to a lower-tax pickup beats shipping it home. Works offline. No ads.
```

**Description**
```
Sales Tax Saver shows the real cost of buying — not just the sticker price, but the price plus sales tax, and whether driving to a lower-tax pickup nearby actually beats having it shipped home once gas and your time are counted.

Enter an item price and your ZIP (or use your location) and the app instantly compares:
• Ship to home — item + your local sales tax + shipping
• Pickup nearby — item + a lower-tax county's rate + gas + the value of your time

It then tells you the cheaper option and how much you'd save, with a full breakdown you can expand.

FEATURES
• Real per-county U.S. sales-tax rates (Florida down to the county surtax)
• "Should I drive?" math factoring in distance, gas, and your hourly time value — all adjustable
• A map of nearby lower-tax pickup areas with one-tap directions
• A U.S. sales-tax map you can drill into by state and county
• Works offline with bundled estimates — no account, no ads, no tracking

Sales Tax Saver provides estimates for general information only and is not tax, legal, or financial advice. Rates and routes are approximate.
```

**Keywords** *(≤100 chars, comma-separated)*
```
savings,tax rate,calculator,shopping,pickup,delivery,zip,county,budget,deal,store,compare,gas
```

**URLs**
- Support URL: `https://somanath73.github.io/landed-tax-router/support.html`
- Marketing URL (optional): `https://somanath73.github.io/landed-tax-router/`
- Privacy Policy URL: `https://somanath73.github.io/landed-tax-router/privacy.html`

**Category:** Primary **Finance** · Secondary **Shopping** (or Utilities)
**Age rating:** complete the questionnaire → expected **4+** (no objectionable content).

---

## 7. App Privacy ("nutrition label")

Data Collection = **Yes**. Add **Location → Precise Location**:
- Purpose: **App Functionality** (not advertising/analytics)
- Linked to the user's identity: **No** (no account)
- Used for tracking: **No**

No other data types apply (no name/email/contacts/usage/identifiers). This must match the
`PrivacyInfo.xcprivacy` manifest described in MOBILE.md.

---

## 8. Before you hit Submit

- [ ] iOS build done per **MOBILE.md** (Xcode 26, Info.plist location + encryption keys, `PrivacyInfo.xcprivacy`, version 1.0.0, 1024 no-alpha icon)
- [ ] Buy-Me-a-Coffee is hidden on iOS; tip jar uses the RevenueCat consumables (or ships free)
- [ ] At least one 6.9" screenshot set (1320×2868), no alpha
- [ ] Support + Privacy URLs load (they're live now)
- [ ] Review notes: mention it works offline, uses device location only to look up the local tax rate, and gives estimates (not tax advice)

---

## Immigration note (not legal advice)

This LLC/organization structure only helps if the **LLC's operator has independent work authorization**
(U.S. citizen / green card, or H‑4 with EAD) and **genuinely owns and runs** the company. An H‑1B holder
should stay in a **passive** role. Confirm your specific situation with an immigration attorney before
monetizing.
