# Android Internal Testing Release Runbook (RevenueCat Enabled)

This is the fastest path to ship to **Google Play Internal Testing**.

## 1) One-time setup

1. Install EAS CLI and login:
   - `npm i -g eas-cli`
   - `eas login`
2. Install dependencies:
   - `npm install`
3. Copy env template and fill in keys:
   - `cp .env.example .env`

## 2) Environment strategy (.env vs EAS env)

Use both local and EAS-managed environment variables intentionally:

- `.env` is for local development on your machine (Expo start/dev workflows).
- EAS-managed env vars are for cloud builds/submissions and should be created with `eas env:create`.
- Any variable needed in client code must be prefixed with `EXPO_PUBLIC_` and contain only client-safe values.
- Keep secrets private/server-side only. `OPENAI_API_KEY` must **not** be exposed as `EXPO_PUBLIC_*`.

For phone/internal testing builds, `EXPO_PUBLIC_API_BASE_URL` must point to a backend URL reachable from the device. Do not use `localhost` for physical phones unless you are intentionally tunneling.

Example commands for a production environment:

- `eas env:create --scope project --environment production --name EXPO_PUBLIC_API_BASE_URL --value https://api.your-domain.com`
- `eas env:create --scope project --environment production --name EXPO_PUBLIC_OPENAI_MODEL --value gpt-4.1-mini`
- `eas env:create --scope project --environment production --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value goog_xxxxxxxxxxxxxxxxxxxxx`
- `eas env:create --scope project --environment production --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value appl_xxxxxxxxxxxxxxxxxxxxx`
- `eas env:create --scope project --environment production --name EXPO_PUBLIC_RC_ENTITLEMENT_ID --value unlimited_messages`
- `eas env:create --scope project --environment production --name EXPO_PUBLIC_RC_OFFERING_ID --value default`
- `eas env:create --scope project --environment production --name EXPO_PUBLIC_RC_MONTHLY_PRODUCT_ID --value monthly`
- `eas env:create --scope project --environment production --name OPENAI_API_KEY --value <server-secret> --type secret`

## 3) OpenAI model setup (quality + stability)

In `.env`:
- `OPENAI_API_KEY=<your key>`
- `OPENAI_MODEL=gpt-4.1-mini` (recommended default)
- Optional premium quality mode: `OPENAI_MODEL=gpt-4.1`

Notes:
- `gpt-4.1-mini` is better for cost/latency in MVP.
- `gpt-4.1` gives better answer quality but costs more and can be slower.

## 4) RevenueCat + Play billing setup

In RevenueCat:
1. Create app for Android.
2. Add entitlement: `unlimited_messages`.
3. Add offering: `default`.
4. Add package/product for monthly plan id: `monthly`.
5. Copy Android public SDK key into `.env` as `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`.

In Google Play Console:
1. Create app with package `com.kavanah.coaching`.
2. Create subscription product `monthly`.
3. Set app to use Google Play Billing and keep the subscription active.
4. Add internal testers (emails or Google Group).

## 5) EAS submit credentials for Play Console

You need a Play service account JSON for `eas submit`:
1. Google Cloud Console → Service Accounts → create one.
2. Enable Google Play Android Developer API.
3. In Play Console → API access → link service account.
4. Grant at least release management permissions.
5. Save JSON key locally and configure EAS:
   - `eas credentials`
   - or set `GOOGLE_SERVICE_ACCOUNT_JSON` secret for CI.

## 6) Preflight checks

Run:
- `npm run check`
- `npm run preflight`

Both must pass before building.

## 7) Build and submit to internal track

1. Build Android artifact:
   - `npm run build:android`
2. Submit to Google Play internal track:
   - `npm run submit:android`

## 8) Verify monetization in internal testing

1. Install the internal testing build.
2. Open paywall and purchase via a tester account.
3. Confirm premium entitlement unlocks paid behavior.
4. Confirm restore purchases works.

## 9) Devpost submission payload

Include:
- Google Play Internal Testing access link.
- Audience-fit sentence (busy creators/followers need quick clarity coaching).
- Monetization sentence (RevenueCat subscription unlocks unlimited coaching).
