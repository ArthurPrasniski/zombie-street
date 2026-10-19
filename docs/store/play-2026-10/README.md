# Google Play — visual assets

Prepared on 2026-10-16. No Play Console changes or app releases were submitted.

## Upload

In Play Console, select Zombie Road, then **Grow users → Store presence → Main store listing** (Portuguese: **Aumentar número de usuários → Presença na loja → Página principal do app**; labels can vary by console language).

- App icon: `icon-512.png` — 512 × 512 PNG, based on the approved alternative `apps/mobile/assets/pixel16-detailed/app-icon-v2.png`.
- Feature graphic: `feature-graphic-1024x500.png` — 1024 × 500 opaque PNG. `feature-graphic-source.png` preserves the generated source; upload the sized export.
- Phone screenshots: numbered PNG files — 1080 × 1920. Check these against the current Android release before uploading. These are real captures of the shared app UI rendered locally on the web, not captures from an Android device. Native billing, account and ad screens are excluded.

Save changes and submit them through Publishing overview. Updating listing graphics does not require a new AAB. The launcher icon installed on Android is a separate asset: update the source/build pipeline and adaptive-icon configuration, then build and publish a new AAB. The current Android adaptive foreground still uses the existing zombie artwork.

Official requirements: https://support.google.com/googleplay/android-developer/answer/9866151

## Capture provenance

Phone viewport: 432 × 768 CSS pixels at device scale factor 2.5, Portuguese locale, no device frame. Isolated browser profile and offline demo progress. External requests blocked; no production account or purchase was created. Native billing/ad/sign-in modules excluded from the local capture bundle through a temporary Metro configuration outside the repository. A temporary image metadata shim supports the native image API on the web. The app's UI and gameplay source were not modified for the captures. Screens show home, deck, stages and garage. Combat requires a native Android capture: the local web renderer did not initialize Skia, so no combat screenshot is included. Add native combat captures to the listing to highlight the game's core experience.

## Feature graphic prompt

Generated with the built-in imagegen tool. References: `apps/mobile/assets/pixel16-detailed/app-icon-v2.png` and `apps/mobile/assets/pixel16-detailed/home.png`.

Use case: ads-marketing. Create a production Google Play FEATURE GRAPHIC for the mobile game ZOMBIE ROAD, landscape aspect ratio 1024:500 (2.048:1). Detailed crisp 16-bit RPG pixel art matching the supplied reference art and recognizable characters, sophisticated small pixel clusters, golden farm sunset, cornfields, dirt road, American farmhouse. Left 45%: an atmospheric dark blue shaded cornfield with very large readable cream and warm gold pixel lettering, EXACT text on two lines 'ZOMBIE' then 'ROAD'. No other text. Right 55%: memorable expressive green farmer zombie with messy auburn hair and denim overalls in foreground, orange pickup in middle distance and farmhouse behind. Keep all important text and zombie face within central 80% of canvas, generous margins. Strong contrast and clear silhouette, harmonious game key art. Warm dramatic sunset lighting, high quality handcrafted pixel illustration, family friendly menacing, no graphic gore. Full bleed opaque art, no rounded corners, no device mockup, no fake gameplay UI, no badge, no store logo, no claims about rankings, no watermark. Image1 reference zombie/style, image2 reference environment and game identity.
