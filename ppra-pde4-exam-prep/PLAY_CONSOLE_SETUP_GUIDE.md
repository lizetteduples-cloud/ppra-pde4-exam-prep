# Google Play Console Setup Guide

Use this guide to complete the remaining **Finish setting up your app** tasks for **PPRA PDE4 Exam Prep**.

## App Basics

- App name: `PPRA PDE4 Exam Prep`
- Package name: `za.co.ppra.pde4prep`
- App type: `App`
- Pricing: `Free`
- Category: `Education`
- Tags: `Exam preparation`, `Education`, `Property`

## 1. Privacy Policy

You need a public URL. Upload `privacy-policy.html` to a public page, for example Google Sites, Netlify, or your website.

Use this in Play Console:

```text
https://YOUR-DOMAIN-HERE/privacy-policy.html
```

## 2. Sign In Details

Choose:

```text
No, users do not need to sign in.
```

Reason: the current app has no account creation or login flow.

## 3. Content Rating

Choose the closest category:

```text
Education / Reference
```

Suggested answers:

- Violence: `No`
- Fear / horror: `No`
- Sexual content: `No`
- Profanity: `No`
- Alcohol, tobacco, drugs: `No`
- Gambling: `No`
- User-generated content: `No`
- Online interaction between users: `No`
- Location sharing: `No`
- In-app purchases / digital purchases: `Yes`

Expected outcome: low age restriction / general audience rating.

## 4. Target Audience

Choose:

```text
18 and over
```

If asked whether the app is designed for children:

```text
No
```

Reason: PDE4 preparation is for adult estate/property practitioners.

## 5. Data Safety

Current app facts:

- Uses `INTERNET` permission.
- No login.
- No location, contacts, camera, microphone, photos, health, SMS, or call log access.
- Quiz progress is stored locally on the device/browser WebView.
- RevenueCat and Google Play Billing handle subscriptions and purchase status.

Suggested Data Safety answers:

### Does your app collect or share user data?

Choose:

```text
Yes
```

Reason: RevenueCat / Google Play Billing may process purchase and app-user identifiers.

### Data Types

Declare:

```text
Financial info > Purchase history
Device or other IDs > Device or other IDs
App activity > App interactions
```

Use notes:

- Purchase history: used to manage Pro access.
- Device or other IDs: used by RevenueCat/Google Play to manage subscriptions.
- App interactions: may be processed by RevenueCat purchase SDK for subscription events/diagnostics.

### Is data shared?

Choose `Yes` for the above items if Google asks about third-party processing.

Reason: RevenueCat and Google Play process billing/subscription data.

### Is data encrypted in transit?

Choose:

```text
Yes
```

### Can users request deletion?

Choose:

```text
Yes
```

Use your developer support email or privacy policy contact.

### Is data required?

For purchase/subscription data:

```text
Required for Pro access
```

## 6. Government Apps

Choose:

```text
No
```

Reason: this is an independent exam preparation app, not an official government app.

## 7. Financial Features

Choose:

```text
No
```

Reason: in-app purchases are not the same as financial services. The app does not provide banking, loans, insurance, investments, crypto, trading, or money management.

## 8. Health

Choose:

```text
No
```

Reason: the app is not a health, medical, wellness, fitness, or clinical app.

## Remaining Before Production

- Replace the RevenueCat test key with the production Android public SDK key when ready.
- Add real Google Play subscription products and connect them in RevenueCat.
- Test purchases through Play Console internal testing.
- Add final screenshots, short description, full description, and feature graphic.
