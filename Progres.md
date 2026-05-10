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
- Uwaga operacyjna: migracja `202604181000_notifications` przechodzi poprawnie po uruchomieniu lokalnego PostgreSQL pod `localhost:5433`; lokalny flow `npm --prefix server run prisma:migrate:dev` zostal ponownie zweryfikowany na tej konfiguracji.

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

## 2026-05-04 - ETAP 2 - swiaty i dynamiczne statystyki - IN PROGRESS

- Dodano fundament domenowy pod `ETAP 2`: modele `World`, `StatDefinition`, `CharacterStatValue` oraz relacje swiata i statystyk do postaci.
- Rozszerzono backend o modul `worlds` z endpointami do listy swiatow, tworzenia swiata i dodawania definicji statystyk przez `GM` lub `ADMIN`.
- Przebudowano backend postaci tak, aby tworzenie i edycja zapisywaly `worldId`, dynamiczne wartosci statystyk oraz znormalizowany `statsJson` dla zgodnosci z dotychczasowym UI.
- Dodano frontendowy panel `mg` do zarzadzania swiatami i statystykami oraz skrot do niego z dashboardu dla moderatorow.
- Formularz i widok postaci przestawiono z recznego JSON-a na dynamiczne pola zalezne od wybranego swiata, a karty postaci pokazuja teraz rowniez przypisany swiat.
- Dodano workflow umiejetnosci: modele `SkillProposal` i `CharacterSkill`, endpointy do zglaszania propozycji przez gracza oraz review przez `GM` lub `ADMIN`.
- Karta postaci pokazuje teraz zatwierdzone umiejetnosci, pozwala wlascicielowi wyslac nowa propozycje i wyswietla historie review dla widocznych zgloszen.
- Panel `mg` zostal rozszerzony o kolejke propozycji umiejetnosci z akcjami zatwierdzenia i odrzucenia oraz komentarzem dla gracza.
- Powiadomienia in-app i e-mail obejmuja teraz rowniez nowe propozycje umiejetnosci oraz decyzje o ich zatwierdzeniu lub odrzuceniu.
- Zweryfikowano iteracje poleceniami: `npm --prefix server run prisma:generate`, `npm --prefix server run build`, `npm --prefix server run test`, `npm run lint`, `npm run test:web`, `npm run build:web`.
- Zweryfikowano rowniez lokalny flow Prisma na PostgreSQL pod `localhost:5433`: migracje `202605041930_worlds_stats` i `202605042100_skill_workflow` aplikuja sie poprawnie na czystej bazie, `prisma migrate status` jest zielone, a `npm --prefix server run prisma:migrate:dev` przechodzi bez bledu.

## 2026-05-10 - ETAP 2 - progres postaci EXP/PH - IN PROGRESS

- Dodano modele `ProgressEntry` i `ProgressRule` oraz liczniki `experiencePoints` i `heroPoints` na modelu `Character`.
- Zaimplementowano backendowy flow przyznawania progresu przez `GM` lub `ADMIN`: wpis historii powstaje w transakcji razem z automatyczna aktualizacja licznikow postaci.
- Dodano endpointy `GET /characters/:characterId/progress` i `POST /characters/:characterId/progress`; historia jest dostepna dla wlasciciela postaci oraz `GM/Admin`.
- Karta postaci pokazuje teraz EXP i PH, a `GM/Admin` widza prosty panel przyznawania progresu oraz historie zmian.
- Dodano podstawowy ranking postaci dla ETAPU 2: endpoint `GET /characters/rankings` sortuje po `EXP` i `PH`, obsluguje filtr `worldId` i zwraca pozycje w tabeli.
- Dodano frontendowy widok `/rankings` z lista postaci, swiatem, licznikami `EXP/PH`, pozycja w rankingu oraz skrotem z dashboardu.
- Cache rankingu odswieza sie po przyznaniu progresu, a backendowe testy obejmuja kolejnosc endpointu i aktualizacje rankingu po zmianie licznikow.
- Dodano testy backendowe dla zwiekszania EXP/PH, historii progresu oraz blokady dostepu dla zwyklych graczy.
- Zweryfikowano iteracje poleceniami: `npm --prefix server run test`, `npm --prefix server run build`, `npm run lint`, `npm run test:web`, `npm run build:web`.

## 2026-05-10 - ETAP 3 - podstawowe wiadomosci prywatne - IN PROGRESS

- Dodano modele `Conversation` i `PrivateMessage` wraz z migracja `202605101700_private_messages` oraz relacjami do `User`.
- Zaimplementowano backendowy modul `messages` z endpointami do tworzenia konwersacji, listy moich rozmow, pobierania historii, wysylania wiadomosci i oznaczania wpisow jako przeczytane.
- Logika backendu pilnuje unikalnosci rozmowy 1:1, aktualizuje `lastMessageAt`, zapisuje wiadomosci w transakcji i liczy nieprzeczytane wpisy na potrzeby listy konwersacji.
- Dodano frontendowy widok `/messages` z lista konwersacji, widokiem rozmowy, formularzem nowej konwersacji i formularzem wysylki wiadomosci.
- Dashboard dostal skrot do wiadomosci, a na profilu innego gracza pojawil sie przycisk do szybkiego rozpoczecia rozmowy.
- Dodano testy backendowe potwierdzajace wysylke wiadomosci, widocznosc rozmow uzytkownika, ponowne wykorzystanie istniejacej konwersacji i oznaczanie wiadomosci jako przeczytane.
- Zweryfikowano iteracje poleceniami: `npm --prefix server run prisma:generate`, `npm --prefix server run test`, `npm --prefix server run build`, `npm run lint`, `npm run test:web`, `npm run build:web`.

## 2026-05-10 - ETAP 3 - realtime wiadomosci prywatne - IN PROGRESS

- Rozszerzono system wiadomosci o realtime przez `Socket.io` po stronie backendu i frontendu.
- Dodano backendowy gateway `messages-realtime` z autoryzacja JWT w handshake oraz pokojami uzytkownika i konwersacji.
- Tworzenie konwersacji, wysylanie wiadomosci i oznaczanie jako przeczytane emituja teraz zdarzenia realtime do obu uczestnikow rozmowy.
- Frontend `/messages` utrzymuje polaczenie socketowe, dolacza do aktywnej rozmowy i odswieza liste konwersacji oraz widok czatu bez recznego odswiezania.
- Doinstalowano paczki `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io` oraz `socket.io-client`.
- Zweryfikowano iteracje poleceniami: `npm --prefix server run test`, `npm --prefix server run build`, `npm run lint`, `npm run test:web`, `npm run build:web`.

## 2026-05-10 - ETAP 3 - wyszukiwanie odbiorcy wiadomosci - IN PROGRESS

- Rozszerzono backend `users` o endpoint wyszukiwania odbiorcow do wiadomosci prywatnych, filtrujacy aktywne i zweryfikowane konta po `username` oraz `displayName`.
- Frontend `/messages` przestal wymagac recznego wpisywania `UUID` odbiorcy; formularz nowej rozmowy pozwala teraz wyszukac gracza po nazwie i wybrac go z listy wynikow.
- Skrzynka wiadomosci zachowuje dotychczasowy flow rozpoczecia rozmowy z profilu gracza, ale pozwala tez zalozyc nowa konwersacje bez znajomosci technicznego identyfikatora uzytkownika.
- Zweryfikowano iteracje poleceniami: `npx.cmd eslint components/messages/messages-shell.tsx lib/api.ts lib/types.ts --max-warnings=0`, `npm.cmd --prefix server run build`, `npm.cmd run build:web`.

## 2026-05-10 - ETAP 3 - realtime notifications i odswiezanie dashboardu - IN PROGRESS

- Dodano backendowy gateway `notifications-realtime` w NestJS z autoryzacja JWT w handshake i pokojami per uzytkownik, bez przebudowy istniejacych endpointow REST.
- `NotificationsService.createForUsers` zapisuje teraz powiadomienia w transakcji, liczy aktualny `unreadCount` i emituje event `notification.created` do odbiorcy zaraz po utworzeniu wpisu.
- Frontend dostal klienta Socket.io dla powiadomien oraz wspolny helper aktualizacji cache, dzieki czemu `/notifications` odswieza liste i licznik bez recznego refreshu.
- Dashboard pokazuje teraz realtime badge nieprzeczytanych powiadomien, a logika aktualizacji `/messages` zostala wydzielona do testowalnych helperow cache bez zmian w REST API.
- Dodano testy dla helperow realtime po stronie frontendu i rozszerzono test `NotificationsService` o emisje `notification.created`; smoke test Playwright zostal tez ustabilizowany pod aktualne etykiety CTA.
- Zweryfikowano iteracje poleceniami: `npm.cmd run lint`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run test:e2e`.

## 2026-05-10 - ETAP 3 - events MVP - IN PROGRESS

- Dodano modele `Event` i `EventParticipation` oraz migracje Prisma z prostym statusem uczestnictwa `PENDING / APPROVED / REJECTED`.
- Zaimplementowano backendowy modul `events` w NestJS: lista eventow, widok szczegolow, tworzenie i edycja eventu przez `GM/Admin`, zapis postaci do eventu oraz akceptacja lub odrzucenie uczestnictwa.
- Logika backendu pilnuje wlasciciela postaci przy zapisie, unikalnosci zgloszenia per `event + character`, poprawnej kolejnosci dat oraz limitu zaakceptowanych miejsc.
- Dodano frontendowe widoki `/events` i `/events/[eventId]` z lista wydarzen, formularzem tworzenia dla `GM/Admin`, formularzem zapisu postaci oraz panelem review uczestnikow dla moderatorow.
- Dashboard i panel `mg` dostaly skroty do eventow, a karta eventu pokazuje zaakceptowanych uczestnikow, oczekujace zgloszenia i podstawowe metadane terminu.
- Dodano testy backendowe potwierdzajace utworzenie eventu, zapis postaci do eventu i akceptacje uczestnictwa przez `GM/Admin`.
- Zweryfikowano iteracje poleceniami: `npx.cmd prisma generate --no-engine` w `server`, `npm.cmd run lint`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run test:e2e`.
