# PPRA PDE4 Exam Prep Play Store Checklist

## Current build status

- Capacitor Android project created.
- Debug APK builds successfully.
- Signed release AAB builds successfully.
- RevenueCat Capacitor SDK installed and synced.
- App ID: `za.co.ppra.pde4prep`
- App name: `PPRA PDE4 Exam Prep`
- Question bank: 750 questions, 14 sections.

## Before closed testing

- Add real subscription products in Play Console.
- Add the RevenueCat Android public SDK key in `assets/revenuecat-config.json`.
- Configure RevenueCat entitlement: `pro_access`.
- Add privacy policy URL.
- Add account deletion/data deletion wording if user accounts are added.
- Prepare Data Safety answers.
- Replace any fake/incentivised review plan with genuine beta tester feedback only.
- Test on at least one Android phone and one emulator.
- Create screenshots from the real app screens.

## Release build

- Private upload keystore generated at `android/ppra-pde4-upload-key.jks`.
- Signing properties stored locally in ignored file `android/keystore.properties`.
- Release signing wired in `android/app/build.gradle`.
- Run:

```powershell
npm.cmd run android:bundle
```

- Verify signed bundle with `jarsigner`.
- Upload `.aab` to Play Console internal or closed testing.

## Policy notes

- Do not seed reviews with fake Google accounts.
- Do not reward users for positive ratings.
- Ask real testers for honest feedback after they have used the app.
- Avoid guaranteed exam-pass claims unless the refund process and terms are legally clear.
