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

## 2) OpenAI model setup (quality + stability)

In `.env`:
- `OPENAI_API_KEY=<your key>`
- `OPENAI_MODEL=gpt-4.1-mini` (recommended default)
- Optional premium quality mode: `OPENAI_MODEL=gpt-4.1`

Notes:
- `gpt-4.1-mini` is better for cost/latency in MVP.
- `gpt-4.1` gives better answer quality but costs more and can be slower.

## 3) RevenueCat + Play billing setup

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

## 4) EAS submit credentials for Play Console

You need a Play service account JSON for `eas submit`:
1. Google Cloud Console → Service Accounts → create one.
2. Enable Google Play Android Developer API.
3. In Play Console → API access → link service account.
4. Grant at least release management permissions.
5. Save JSON key locally and configure EAS:
   - `eas credentials`
   - or set `GOOGLE_SERVICE_ACCOUNT_JSON` secret for CI.

## 5) Preflight checks

Run:
- `npm run check`
- `npm run preflight`

Both must pass before building.

## 6) Build and submit to internal track

1. Build Android artifact:
   - `npm run build:android`
2. Submit to Google Play internal track:
   - `npm run submit:android`

## 7) Verify monetization in internal testing

1. Install the internal testing build.
2. Open paywall and purchase via a tester account.
3. Confirm premium entitlement unlocks paid behavior.
4. Confirm restore purchases works.

## 8) Devpost submission payload

Include:
- Google Play Internal Testing access link.
- Audience-fit sentence (busy creators/followers need quick clarity coaching).
- Monetization sentence (RevenueCat subscription unlocks unlimited coaching).
