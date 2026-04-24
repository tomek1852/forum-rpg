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

## 2026-03-29 - ETAP 1 - forum, watki i posty - IN PROGRESS

- Dodano modele `ForumCategory`, `ForumThread` i `ForumPost` wraz z migracja `202603291030_forum_mvp`, relacjami do uzytkownika i wsparciem cytowania postow.
- Przygotowano backend forum w NestJS: endpointy do listy kategorii, widoku kategorii, szczegolow watku, zakladania nowych watkow i odpowiadania w watkach.
- Dodano domyslne kategorie forum po migracji, aby lokalne srodowisko bylo od razu gotowe do testowania bez recznego seedowania.
- Zaimplementowano frontendowe widoki `forum`, `forum/[categoryId]`, `forum/[categoryId]/[threadId]` i `forum/new` z React Query, formularzem nowego watku oraz odpowiedziami z cytowaniem.
- Dashboard dostal bezposredni skrot do forum, a wpisy i watki wyswietlaja autora, aktywnosc i podstawowe statusy watku.
- Zweryfikowano iteracje poleceniami: `npm --prefix server run prisma:migrate:dev`, `npm --prefix server run prisma:generate`, `npm --prefix server run test`, `npm --prefix server run build`, `npm run lint`, `npm run test:web`, `npm run build:web`.

## 2026-04-18 - ETAP 1 - podstawowe powiadomienia - IN PROGRESS

- Dodano model `Notification` oraz enum `NotificationType` pod podstawowe powiadomienia in-app zwiazane z forum.
- Przygotowano backend `notifications` w NestJS: lista powiadomien uzytkownika, oznaczanie pojedynczego wpisu jako przeczytany oraz oznaczanie wszystkich jako przeczytane.
- Powiadomienia zostaly podlaczone do forum: nowy watek moze powiadomic `GM/Admin`, a odpowiedzi i cytaty tworza powiadomienia dla wlasciciela watku lub autora cytowanego posta.
- Dodano frontendowy widok `notifications`, klienta API oraz wejscie do powiadomien z dashboardu.
- Zweryfikowano iteracje poleceniami: `npm --prefix server run prisma:generate`, `npm --prefix server run test`, `npm --prefix server run build`, `npm run lint`, `npm run test:web`, `npm run build:web`.
- Uwaga operacyjna: migracja `202604181000_notifications` nie zostala jeszcze zastosowana, poniewaz lokalna baza pod `localhost:5433` nie byla uruchomiona w momencie weryfikacji. Po starcie Dockera/PostgreSQL trzeba wykonac `npm --prefix server run prisma:migrate:dev`.

## 2026-04-18 - ETAP 1 - mailer auth i powiadomienia email - IN PROGRESS

- Dodano backendowy modul `mailer` oparty o `nodemailer` z konfiguracja SMTP przez `.env` oraz fallbackiem developerskim do logow serwera.
- Rejestracja i ponowna weryfikacja email wysylaja teraz wiadomosci aktywacyjne z linkiem do `verify-email`.
- Reset hasla wysyla wiadomosc z linkiem do `reset-password`, bez zrywania obecnego developerskiego token flow.
- Powiadomienia forum moga wysylac rowniez kopie emailowe do aktywnych i zweryfikowanych odbiorcow.
- Zaktualizowano `server/.env.example` o `APP_URL`, `MAIL_FROM_*` i ustawienia `SMTP_*`.
- Zweryfikowano iteracje poleceniami: `npm --prefix server run test`, `npm --prefix server run build`.

## 2026-04-24 - ETAP 1 - workflow zatwierdzania kont - DONE

- Zmieniono flow auth tak, aby po weryfikacji email konto pozostawalo w `PENDING_APPROVAL` do czasu zatwierdzenia przez `GM` lub `Admin`.
- Dodano backendowe endpointy moderacyjne do listy kont, zmiany statusu (`PENDING_APPROVAL` / `ACTIVE` / `BLOCKED`) oraz zmiany roli uzytkownika dla administratora.
- Dodano frontendowy panel `moderation` z podgladem kont oczekujacych, akcjami aktywacji i blokowania oraz zarzadzaniem rolami.
- Dashboard dostal bezposredni skrot do moderacji dla uzytkownikow z rola `GM` lub `ADMIN`.
- Poprawiono widoki auth tak, aby opisy odpowiadaly nowemu przeplywowi zatwierdzania kont.
- Zweryfikowano iteracje poleceniami: `npm --prefix server run test`, `npm --prefix server run build`, `npm run lint`, `npm run test:web`, `npm run build:web`.
