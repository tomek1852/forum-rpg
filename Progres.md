# Progres projektu

## 2026-03-17 - Faza 1 - Autoryzacja i podstawy systemu

- Przebudowano projekt do ukladu `Next.js + TypeScript + Tailwind CSS + shadcn/ui` na froncie oraz `NestJS + Prisma + PostgreSQL` na backendzie w katalogu `server`.
- Dodano pelny modul autoryzacji: rejestracja, logowanie, odswiezanie sesji przez refresh token, wylogowanie, pobieranie profilu i reset hasla z developerskim tokenem do testow bez emaila.
- Przygotowano modele `User`, `RefreshToken` i `PasswordResetToken`, migracje Prisma oraz `docker-compose.yml` z PostgreSQL.
- Zaimplementowano landing page, widoki `login`, `register`, `reset-password` i chroniony `dashboard` z React Query oraz Zustand.
- Dodano testy `Jest` dla backendu i `React Testing Library` dla frontendu oraz konfiguracje pod `Playwright`.
- Zweryfikowano faze poleceniami: `npm run lint`, `npm run test:web`, `npm --prefix server run test`, `npm --prefix server run build`, `npm run build:web`.

## 2026-03-28 - ETAP 1 - profile i postacie - IN PROGRESS

- Przeanalizowano nowa dokumentacje etapow i dostosowano dalszy kierunek prac do rozszerzonego `ETAPU 1`.
- Rozszerzono model danych o `GM`, statusy kont (`PENDING_APPROVAL`, `ACTIVE`, `BLOCKED`), pola profilu uzytkownika oraz encje `Character`.
- Dodano backend dla profili i postaci: endpointy `users/me`, `users/:userId`, `characters/my`, `characters/user/:userId`, `characters/:id`, `POST/PATCH characters`.
- Zaimplementowano frontend dla profilu gracza i postaci: `profile/[userId]`, `character/new`, `character/[charId]`, `character/[charId]/edit`, a dashboard pokazuje teraz wlasne postacie.
- Dodano testy backendowe dla modulu postaci oraz utrzymano zielone linty, testy i buildy dla `web` i `api`.
- Zweryfikowano iteracje poleceniami: `npm --prefix server run prisma:generate`, `npm --prefix server run test`, `npm --prefix server run build`, `npm run lint`, `npm run test:web`, `npm run build:web`.

## 2026-03-28 - ETAP 1 - weryfikacja email i aktywacja kont - IN PROGRESS

- Dodano model `EmailVerificationToken` oraz migracje pod flow aktywacji konta po rejestracji.
- Przebudowano auth: rejestracja tworzy konto w `PENDING_APPROVAL`, logowanie blokuje konta niezweryfikowane i zablokowane, a endpointy `request-email-verification` i `verify-email` obsluguja aktywacje.
- Dodano frontendowy ekran `verify-email` oraz dostosowano formularze `register` i `login` do nowego przeplywu aktywacji.
- Utrzymano zielone: `npm --prefix server run test`, `npm --prefix server run build`, `npm run lint`, `npm run test:web`, `npm run build:web`.
- Uwaga operacyjna: `npm --prefix server run prisma:generate` moze na Windows zwrocic `EPERM` gdy aktywny proces Node blokuje plik `query_engine-windows.dll.node`; w takim przypadku trzeba zatrzymac dzialajacy backend i ponowic komende.
