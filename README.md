# PPRA PDE4 Exam Prep MVP

Local MVP for the PPRA PDE4 Exam Prep Android app concept.

## What is included

- 750 imported questions from the Excel question bank
- 14 topic sections
- Free tier gate at 50 questions
- RevenueCat + Google Play Billing paywall wiring
- Topic practice mode
- Mixed 10-question practice
- 100-question exam simulation for Pro
- Immediate answer feedback and explanations
- Local progress and session tracking in browser storage

## Run locally

From this folder:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 4184 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4184/
```

## Re-import questions

If the Excel workbook changes, run:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" ".\scripts\import_questions.py"
```

## Production next steps

- Add your real RevenueCat Android public SDK key to `assets/revenuecat-config.json`.
- Create matching Google Play subscription products and RevenueCat offering.
- Add Supabase or Firebase user sync.
- Add privacy policy and account deletion flow.
- Prepare Play Store screenshots from the real UI.
- Run closed testing with genuine PDE4 candidates.

## Android build

The app is wrapped with Capacitor using:

```text
App ID: za.co.ppra.pde4prep
App name: PPRA PDE4 Exam Prep
```

Verify the web bundle:

```powershell
npm.cmd run verify:www
```

Sync web changes into Android:

```powershell
npm.cmd run sync
```

Build debug APK:

```powershell
npm.cmd run android:assemble
```

Latest debug APK:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Latest signed release bundle:

```text
android/app/build/outputs/bundle/release/app-release.aab
```
