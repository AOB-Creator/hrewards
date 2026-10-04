# Escape — hotel booking & rewards app (iOS + Android)

Mobile app for the Marmaris / Lavanda Marmaris Rakat hotel network, built from the
technical specification (*TZ: Mehmonxonalar tarmog'i uchun onlayn bron va sodiqlik tizimi*)
and the "Escape°" UI mockups.

**Design:** grey background (#F2F3F5), white cards, near-black controls, lavender (#5B4BA6) for points only, Manrope, pill buttons, floating tab bar (Bosh sahifa · Bronlarim · Ballarim · Profil). Default language: Uzbek.

**Stack:** Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · Expo Router · Zustand.
One codebase ships to the latest iOS and Android.

## Features (TZ mapping)

| TZ | Feature |
| --- | --- |
| 5.1 | Home: hotels, destinations, search, Rewards banner · hotel page with gallery, description, amenities, rating breakdown, reviews, map, contacts · room cards (m², beds, capacity, rates) · **uz / ru / en** · **UZS** with USD/EUR from the Central Bank API |
| 5.2 | Search by location/hotel, dates, adults, children, rooms · only available rooms with live price · filters (price histogram, type, breakfast, free cancellation, rating, amenities) and sorting · **4-step booking** (room & rate → guest → payment → confirmation) · full / partial (deposit %) / pay-at-hotel per rate · Payme, Click, Uzum, Uzcard, Humo, Visa/MC · promo codes · booking number + PDF voucher · cancel / change dates with automatic refund calculation · **15-minute room hold** against overbooking |
| 5.3 | Silver / Gold (5+ nights) / Platinum (15+ nights) over 12 months · 5 pts per 100 000 so'm (+25% / +50%) · member price −5% · points credited only after check-out, none for cancellations · redeem 1 pt = 1 000 so'm up to 50%, or a free night · 24-month expiry · points history · one account per phone · perks attached to bookings |
| 5.4 | Phone + SMS OTP sign-in (attempt limit, resend cooldown) · current/past/cancelled bookings · find a guest booking by number + phone · balance, tier, nights to next tier · personal data & notification settings · favourites · reviews within 30 days after check-out |
| 5.6 | In-app inbox: confirmation, day-before reminder, points credited, thank-you/review request, cancellation |

## Architecture

```
src/
  app/          Expo Router screens (tabs, search sheet, hotel, booking flow, rewards, auth…)
  domain/       Pure business rules: pricing, loyalty, cancellation, availability, validation
  data/         HotelApi contract · HttpApi (REST backend) · MockApi (on-device demo backend) · seed
  store/        Zustand stores persisted to AsyncStorage (session, search, settings)
  ui/ components/  Design system from the mockups (pill buttons, chips, cards, price slider…)
  i18n/         en / ru / uz dictionaries
  __tests__/    Unit + integration tests of the business logic
```

The app talks to the backend only through `HotelApi` (`src/data/api.ts`), the same REST contract the
website and back-office use (TZ §8). Without configuration it runs on `MockApi`, which enforces the same rules
on the device so every flow works offline for demos. To use the real server:

```bash
EXPO_PUBLIC_API_URL=https://api.example.uz npx expo start
```

**Demo account:** `+998 90 123 45 67` — the SMS code is shown on screen in demo mode.
Promo codes: `WELCOME10`, `MARMARIS15` (3+ nights, Marmaris hotels), `LAVANDA200`.

## Run

```bash
npm install
npx expo start          # scan with Expo Go or a dev build
npm test                # business-logic tests
npm run typecheck && npm run lint
```

## Installable builds

- **Android APK:** every push runs `.github/workflows/build.yml`; download the `escape-android-apk`
  artifact from the workflow run and install it on any Android device. Locally: `npx expo run:android --variant release`.
- **iOS (and store builds):** with an Expo account and Apple Developer account:
  ```bash
  npx eas-cli build --platform ios --profile preview      # ad-hoc install on registered iPhones
  npx eas-cli build --platform all --profile production   # App Store / Google Play
  npx eas-cli submit --platform all
  ```
  Or add an `EXPO_TOKEN` repository secret and run the workflow manually.

Bundle IDs: `uz.marmaris.escape` (iOS and Android).
