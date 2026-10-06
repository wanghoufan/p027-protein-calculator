# Protein Calculator

> No sign-up, no network. Figure out your daily protein target in seconds, then see how much protein your meal gives you.

[中文](./README.md)

<img src="docs/screenshots/home.png" alt="Home" width="200"> <img src="docs/screenshots/dark-home.png" alt="Dark home" width="200"> <img src="docs/screenshots/ranking.png" alt="High-protein ranking" width="200">

## What is this

Protein Calculator is an offline Android app (Expo + React Native). It answers one concrete question for people who work out or watch their diet: "roughly how much protein do I need a day, and how much protein is in a few pieces of chicken breast, eggs, or a bottle of milk?"

## What you can do

- **Daily target**: enter your weight, pick one of 4 goal modes (daily maintenance 0.8–1.0, fitness maintenance 1.2–1.6, muscle gain 1.6–2.0, fat loss 1.6–2.4 g/kg) plus a low/high tier, and get your daily grams instantly (60 kg × muscle-gain low 1.6 = 96 g/day). Mode explanations and data sources ship inside the app and work offline.
- **This meal's total**: adjust food amounts (by g / ml / piece, or handy servings like 块/瓶) and watch total intake, remaining amount, and progress update live.
- **Top 30 high-protein ranking**: 30 common foods ranked by protein per 100 g; tap `+` to add foods straight into the calculator without leaving the list.
- **Make values yours**: override preset nutrition values and servings to match package labels, add fully custom foods, restore defaults anytime.
- **Pick up where you left off**: weight, coefficient, amounts, and custom foods persist on-device and survive process kills; corrupted storage falls back to defaults instead of crashing.
- **Dark mode**: follows your system setting by default, or pick Follow system / Light / Dark manually in Settings; your choice is saved on-device.
- **Bilingual**: switch between Chinese and English in Settings; food names, rankings, and units follow along, and the preference is saved on-device.

## Quick start

Requirements: Node.js 22.13+, an Android phone/emulator (Expo Go works for preview).

```bash
# run inside protein-calculator/
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` for the emulator. Full installable build:

```bash
npx expo prebuild --platform android
./android/gradlew -p android :app:assembleRelease
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Data source

Ranking data comes from the China CDC Institute of Nutrition and Health's _China Food Composition Table_ lookup platform (verified 2026-09) and covers only the 30 common foods included in this app. The full source card ships inside the app and works offline.

## Limitations

- Android only (package `com.proteincalculator.app`); no verified iOS build.
- Fully offline: no accounts, no sync, no network features; data does not migrate between phones.
- Nutrition values are estimates — package labels win; no calories/fat/carbs, no medical advice.

## Development

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # jest (non-watch)
npm run format:check
npx expo-doctor
```

## License

This repo ships with a `LICENSE` file (Expo scaffold default text).
