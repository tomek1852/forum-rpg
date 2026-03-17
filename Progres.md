# Progres projektu

## 2026-03-17 - Faza 1 - Autoryzacja i podstawy systemu

- Przebudowano projekt do ukladu `Next.js + TypeScript + Tailwind CSS + shadcn/ui` na froncie oraz `NestJS + Prisma + PostgreSQL` na backendzie w katalogu `server`.
- Dodano pelny modul autoryzacji: rejestracja, logowanie, odswiezanie sesji przez refresh token, wylogowanie, pobieranie profilu i reset hasla z developerskim tokenem do testow bez emaila.
- Przygotowano modele `User`, `RefreshToken` i `PasswordResetToken`, migracje Prisma oraz `docker-compose.yml` z PostgreSQL.
- Zaimplementowano landing page, widoki `login`, `register`, `reset-password` i chroniony `dashboard` z React Query oraz Zustand.
- Dodano testy `Jest` dla backendu i `React Testing Library` dla frontendu oraz konfiguracje pod `Playwright`.
- Zweryfikowano faze poleceniami: `npm run lint`, `npm run test:web`, `npm --prefix server run test`, `npm --prefix server run build`, `npm run build:web`.
