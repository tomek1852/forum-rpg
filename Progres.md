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

## 2026-05-17 - ETAP 3 - DONE

- Zaimplementowano system obecnosci (presence) przez Socket.io z nowym gateway `presence-realtime`, odrebnym od istniejacych gatewayow wiadomosci i powiadomien.
- Dodano enum `PresenceStatus` (`ONLINE`, `AWAY`, `OFFLINE`) i pole `presenceStatus` do modelu `User` wraz z migracja `202605171200_presence_status`.
- Backend gateway obsluguje JWT handshake, heartbeat od klientow co 30s, przejscie w `AWAY` po 60s braku sygnalu oraz `OFFLINE` po 5min; rozlaczenie socketa natychmiast ustawia `OFFLINE`.
- Frontend dostal klienta socket (`lib/presence-socket.ts`), hook `usePresence` z automatycznym heartbeatem i subskrypcja zmian statusu, oraz komponent `PresenceBadge` z kolorowym wskaznikiem i etykieta.
- Badge statusu obecnosci pojawia sie na stronie `/profile/:userId` obok roli uzytkownika (live aktualizacja przez socket) oraz na liscie kont w panelu moderacji (status z bazy danych).
- Zweryfikowano integracje WorldLog: endpoint `GET/POST /worlds/:worldId/world-log`, widok `/worlds/[worldId]` z pelna lista wpisow, formularzem dla GM/Admin i poprawnym routingiem.
- Zweryfikowano iteracje poleceniami: `npm.cmd --prefix server run build`, `npm.cmd --prefix server run test`, `npm.cmd run lint`, `npm.cmd run build:web`.

## 2026-05-31 - System zgłaszania treści (ModerationReport) - DONE

- Dodano modele `ModerationReportTargetType` (POST | THREAD | USER), `ModerationReportStatus` (OPEN | IN_REVIEW | RESOLVED | DISMISSED) oraz `ModerationReport` do `schema.prisma` wraz z migracją `202604_moderation_report`.
- Rozszerzono enum `NotificationType` o wartość `MODERATION_REPORT_RESOLVED` — powiadomienie in-app wysyłane do zgłaszającego po ustawieniu statusu `RESOLVED`.
- Zaimplementowano backendowy moduł `moderation` w NestJS z czterema endpointami: `POST /moderation/reports` (wymaga JWT), `GET /moderation/reports` z filtrem `status` i `targetType` (tylko GM/ADMIN), `GET /moderation/reports/:id` (GM/ADMIN) oraz `PATCH /moderation/reports/:id` (GM/ADMIN).
- Kontroler używa `JwtAuthGuard` na poziomie klasy oraz `RolesGuard + @Roles("GM", "ADMIN")` na chronionych metodach; po zmianie statusu na `RESOLVED` `ModerationService` wywołuje `NotificationsService.createForUsers`.
- Dodano testy backendowe (`moderation.service.spec.ts`) potwierdzające: gracz może zgłosić post, GM widzi listę zgłoszeń, GM może zmienić status na RESOLVED i wysłane zostaje powiadomienie, RolesGuard odrzuca żądanie bez roli GM/ADMIN.
- Na frontendzie panel moderacji (`/moderation`) dostał zakładkę "Zgłoszenia" z listą `ModerationReport`, filtrem statusu i przyciskami zmiany statusu (IN_REVIEW, RESOLVED, DISMISSED) z opcjonalnym polem decyzji.
- Dodano komponent `ReportModal` z polem `reason` (min. 10 znaków); modal pojawia się przy każdym poście i wątku forum (przycisk "Zgłoś" / "Zgłoś wątek") oraz na profilu innego użytkownika (przycisk "Zgłoś użytkownika").
- Zaktualizowano `lib/types.ts` o typy `ModerationReport`, `ModerationReportStatus`, `ModerationReportTargetType` oraz payloady; `lib/api.ts` dostał funkcje `createModerationReport`, `getModerationReports`, `getModerationReport`, `updateModerationReport`.
- Zweryfikowano iterację poleceniami: `npm --prefix server run prisma:generate`, `npm --prefix server run test` (49/49), `npm --prefix server run build`, `npm run lint`, `npm run build:web`.

## 2026-05-31 - ActivityLog — log aktywności moderatorów - DONE

- Dodano model `ActivityLog` do `schema.prisma` (pola: id, actorId FK User, action, targetType?, targetId?, meta Json?, createdAt) oraz ręczną migrację SQL `202604_activity_log`.
- Zaimplementowano backendowy moduł `activity-log` w NestJS z `ActivityLogService.log()` (tworzy wpis) i `ActivityLogService.list()` (paginacja cursor-based z filtrami actorId, action, targetType, zakres dat).
- Dodano endpoint `GET /admin/activity-log` dostępny tylko dla roli `ADMIN` (JwtAuthGuard + RolesGuard).
- Podpięto logowanie w istniejących serwisach: blokada/aktywacja/oczekujące konta i zmiana roli (`UsersService`), zatwierdzenie/odrzucenie umiejętności (`SkillsService`), zmiana statusu ModerationReport (`ModerationService`), przyznanie EXP/PH (`CharactersService`).
- Każdy z modułów (UsersModule, SkillsModule, ModerationModule, CharactersModule) importuje `ActivityLogModule` i wstrzykuje `ActivityLogService`.
- Dodano 5 testów backendowych w `activity-log.service.spec.ts`: log przy blokadzie konta, log przy zmianie statusu ModerationReport, RolesGuard odrzuca GM przy `/admin/activity-log`, paginacja cursor-based z nextCursor i bez.
- Zaktualizowano istniejące speki (users, moderation, skills, characters) o mock `ActivityLogService` — wszystkie 54 testy przechodzą.
- Na frontendzie dodano zakładkę "Log aktywności" w panelu `/moderation`, widoczną tylko dla roli `ADMIN`, z tabelą (czas, aktor, akcja, cel), filtrem akcji (select) i paginacją przyciskami.
- Dodano typy `ActivityLogEntry`, `ActivityLogActor`, `ActivityLogResponse`, `ActivityLogQueryParams` do `lib/types.ts` oraz funkcję `getActivityLog()` do `lib/api.ts`.
- Naprawiono `jest.config.mjs` — dodano `<rootDir>/.claude/` do `testPathIgnorePatterns` (worktree z poprzedniej sesji powodował fałszywe błędy w `test:web`).
- Zweryfikowano iterację poleceniami: `npm --prefix server run prisma:generate --no-engine`, `npm --prefix server run test` (54/54), `npm --prefix server run build`, `npm run lint`, `npm run test:web` (4/4), `npm run build:web`.

## 2026-06-01 - Panel administracyjny (rozbudowa) - DONE

- Dodano backendowy moduł `admin` w NestJS: serwis `AdminService` z metodami `listUsers`, `getUserActivity`, `getStats` oraz kontroler `AdminController` ze wszystkimi endpointami pod `/admin`.
- Endpoint `GET /admin/users` obsługuje parametry `search` (username/email, insensitive), `role`, `status`, `sortBy` (createdAt | lastLogin | username), `page`, `limit` (offset-based pagination) i zwraca `{ users, total, page, limit }`.
- Endpoint `GET /admin/users/:userId/activity` zwraca ostatnie 20 wpisów z `ActivityLog` dla danego użytkownika (deleguje do `ActivityLogService`).
- Endpointy `PATCH /admin/users/:userId/status` i `PATCH /admin/users/:userId/role` delegują do istniejącego `UsersService.updateAccountStatus` i `UsersService.updateUserRole`, które już zapisują wpis ActivityLog.
- Endpoint `GET /admin/stats` zwraca agregaty: użytkownicy wg statusu i roli, zgłoszenia wg statusu, liczba postaci, liczba konwersacji (przez `prisma.*.groupBy` i `prisma.*.count`).
- Wszystkie endpointy `/admin/*` są zabezpieczone `JwtAuthGuard + RolesGuard + @Roles("ADMIN")` na poziomie klasy.
- Dodano testy backendowe w `admin.service.spec.ts` (5 testów): wyszukiwanie po username, filtr PENDING_APPROVAL, poprawne agregaty w getStats, paginacja, RolesGuard blokuje GM na `/admin/users`.
- Na frontendzie dodano widok `/admin` z komponentem `AdminShell` (3 zakładki: Użytkownicy, Statystyki, Log aktywności) oraz widok `/admin/users/[userId]` z kartą użytkownika, listą postaci, skróconym ActivityLog i listą zgłoszeń.
- Tabela użytkowników w zakładce Użytkownicy ma wyszukiwarkę, filtry statusu/roli, sortowanie, paginację oraz akcje zmiany statusu i roli inline.
- Zakładka Statystyki wyświetla karty z agregatami z endpointu `/admin/stats`.
- Zakładka Log aktywności reużywa istniejącej logiki z panelu moderacji (filtr akcji, paginacja cursor-based).
- Dostęp do `/admin` jest chroniony redirect do `/moderation` dla ról innych niż ADMIN.
- Dodano typy `AdminUsersParams`, `AdminUsersResponse`, `AdminStatsResponse`, `AdminUserActivityResponse` do `lib/types.ts` oraz funkcje `getAdminUsers`, `getAdminUserActivity`, `updateAdminUserStatus`, `updateAdminUserRole`, `getAdminStats` do `lib/api.ts`.
- Zweryfikowano poleceniami: `npm --prefix server run test` (59/59), `npm --prefix server run build`, `npm run lint`, `npm run test:web` (4/4), `npm run build:web`.

## 2026-06-01 - ETAP 4 — Zarządzanie kategoriami forum z uprawnieniami - DONE

- Rozszerzono model `ForumCategory` w schema.prisma o pola: `allowedRoles` (String[], domyślnie []), `sortOrder` (Int, domyślnie 0), `createdById` (FK User) oraz relację do `User`.
- Dodano ręczną migrację SQL `202604_forum_category_perms` z ALTER TABLE dla nowych pól i FK.
- Uruchomiono `prisma generate --no-engine`, aby zaktualizować typy Prisma Client.
- Zaktualizowano DTOs: `create-category.dto.ts` o pola `allowedRoles` i `sortOrder`; dodano nowe `update-category.dto.ts` z opcjonalnymi polami `title`, `description`, `color`, `sortOrder`, `allowedRoles`, `isArchived`.
- Przebudowano `ForumService`: `listCategories(userRole)` filtruje kategorie wg roli (PLAYER widzi tylko dostępne i niearchiwizowane; GM/ADMIN widzi wszystkie), `getCategory` rzuca `ForbiddenException` przy braku dostępu, `createCategory` zapisuje `createdById`, `allowedRoles`, `sortOrder`; dodano `updateCategory` i `archiveCategory` (soft-delete); `createThread` waliduje dostęp gracza do kategorii.
- Zaktualizowano `ForumController`: `listCategories` i `getCategory` przekazują `user.role` do serwisu; dodano endpointy `PATCH /forum/categories/:id` i `DELETE /forum/categories/:id` z `RolesGuard(GM, ADMIN)`.
- Dodano 4 nowe testy backendowe w `forum.service.spec.ts`: PLAYER nie widzi kategorii ograniczonej do GM, GM widzi wszystkie kategorie włącznie z zarchiwizowanymi, PLAYER nie może założyć wątku w kategorii tylko dla GM, `updateCategory` poprawnie zmienia `sortOrder`.
- Zaktualizowano `lib/types.ts` o nowe pola `ForumCategory` (`sortOrder`, `allowedRoles`, `isArchived`, `createdById`) oraz dodano typy `ForumCategoryPayload`, `UpdateForumCategoryPayload`, `ForumCategoryMutationResponse`.
- Dodano w `lib/api.ts` funkcje `createForumCategory`, `updateForumCategory`, `deleteForumCategory`.
- Stworzono komponent `ForumCategoriesManager` w `components/forum/forum-categories-manager.tsx`: lista kategorii z oznaczeniem archiwum i reguł dostępu, strzałki góra/dół do zmiany kolejności (`sortOrder`), modal tworzenia/edycji z polem `allowedRoles` (multi-select) i `isArchived`, przycisk archiwizacji.
- Dodano `ForumCategoriesManager` jako nową sekcję w `WorldManagementShell` (panel `/mg`).
- Zaktualizowano `ForumHomeShell`: zarchiwizowane kategorie mają wizualne wyszarzenie i etykietę "Archiwum" widoczną tylko dla GM/Admin; obsługuje parametr `?error=access_denied` z redirectu.
- Zaktualizowano `ForumCategoryShell`: przy błędzie 403 wykonuje redirect do `/forum?error=access_denied` z komunikatem o braku dostępu.
- Strona `/forum` opakowana w `<Suspense>` ze względu na `useSearchParams()`.
- Zweryfikowano poleceniami: `npm --prefix server run test` (63/63), `npm --prefix server run build`, `npm run lint`, `npm run test:web` (4/4), `npm run build:web`.

## 2026-06-01 - ETAP 4 — Rozszerzony ranking i publiczny leaderboard - DONE

- Rozbudowano endpoint `GET /characters/rankings` o parametry: `sortBy` ("exp" | "heroPoints" | "skillsCount" | "createdAt"), `worldId`, `limit` (max 100, domyślnie 20), `cursor` (cursor-based pagination po id).
- Sortowanie po `skillsCount` działa w pamięci po pobraniu `_count.skills` z Prismy; pozostałe sortowania używają natywnego `orderBy` Prismy.
- Dodano endpoint `GET /characters/:id/rank` zwracający globalną pozycję postaci w rankingu EXP i PH oraz pozycję w obrębie jej świata (4 wartości: `globalExpRank`, `globalPhRank`, `worldExpRank`, `worldPhRank`).
- Dodano nowy moduł `RankingsModule` z endpointem `GET /rankings/worlds` zwracającym liczbę aktywnych postaci, sumę EXP i datę ostatniej aktywności per aktywny świat.
- Zaimplementowano in-memory cache (Map z TTL 60s) w `CharactersService` i `RankingsService` bez Redisa; cache rankingów jest inwalidowany po każdym przyznaniu progresu EXP/PH.
- Dodano awatar postaci (`avatarUrl`) do odpowiedzi rankingowej.
- Zaktualizowano `CharacterRankingEntry` o pole `avatarUrl` i `nextCursor` w odpowiedzi; dodano typy `WorldRankingEntry`, `WorldRankingsResponse`, `CharacterRankResponse` do `lib/types.ts`.
- Zaktualizowano `lib/api.ts` o nowe parametry `getCharacterRankings`, funkcje `getWorldRankings` i `getCharacterRank`.
- Rozbudowano `/rankings`: dwie zakładki "Postacie" i "Światy", select sortowania, select świata, tabela postaci z awatarem, linkiem do profilu i pozycją.
- Na karcie szczegółów postaci (`character-detail-shell.tsx`) `ProgressBadge` wyświetla teraz `#{n} w rankingu` pod wartością EXP i PH (dane z `GET /characters/:id/rank`).
- `CharacterCard` dostał opcjonalne propsy `expRank` i `phRank` wyświetlające badge pozycji przy EXP i PH.
- Dodano 5 nowych testów backendowych: sortowanie po `heroPoints`, filtr `worldId`, paginacja cursor-based, wykrywanie kolejnej strony (`nextCursor`), aktualizacja pozycji po zmianie EXP.
- Zweryfikowano poleceniami: `npm --prefix server run test` (68/68), `npm --prefix server run build`, `npm run lint`, `npm run test:web` (4/4), `npm run build:web`.

## 2026-06-01 - System odznak (Badges) - DONE

- Dodano enum `BadgeCondition` (FIRST_POST | FIRST_CHARACTER | EXP_100 | EXP_500 | EXP_1000 | SKILL_APPROVED | EVENT_PARTICIPANT | CUSTOM) oraz rozszerzono `NotificationType` o wartość `BADGE_AWARDED` w `schema.prisma`.
- Dodano modele `Badge` (id, name, description, icon, condition, threshold?) i `CharacterBadge` (id, characterId, badgeId, awardedById?, awardedAt, note?) z unikalnym indeksem `(characterId, badgeId)`.
- Stworzono ręczną migrację SQL `202605_badges` tworzącą enuma, oba modele i klucze obce.
- Zaimplementowano backendowy moduł `badges` w NestJS z `BadgesService` zawierającym: `listAll`, `listForCharacter`, `createBadge`, `awardBadge`, `removeBadge`, `checkAndAward(characterId)`, `checkAndAwardForUser(userId)`.
- `checkAndAward` pobiera z bazy odznaki z warunkami automatycznymi i przyznaje brakujące dla postaci; po przyznaniu wysyła powiadomienie in-app przez `NotificationsService`.
- `BadgesController` udostępnia endpointy: `GET /badges` (publiczny), `GET /characters/:id/badges`, `POST /admin/badges` (ADMIN), `POST /characters/:id/badges` (GM/ADMIN + note), `DELETE /characters/:id/badges/:badgeId` (ADMIN).
- Podpięto wywołania `checkAndAward` / `checkAndAwardForUser` (fire-and-forget z `.catch`) w: `CharactersService.create` (FIRST_CHARACTER), `CharactersService.grantProgress` (EXP_*), `ForumService.createPost` (FIRST_POST), `SkillsService.reviewProposal` (SKILL_APPROVED), `EventsService.reviewParticipation` (EVENT_PARTICIPANT).
- Dodano testy backendowe w `badges.service.spec.ts`: FIRST_POST przyznawana po pierwszym poście, EXP_100 przy EXP >= 100, brak duplikatów, GM przyznaje CUSTOM, ConflictException dla duplikatu, NotFoundException dla nieznanej postaci.
- Zaktualizowano istniejące testy (`characters`, `forum`, `skills`, `events`) o mock `BadgesService` — wszystkie 76 testów przechodzi.
- Na frontendzie `character-detail-shell.tsx` dostał sekcję "Odznaki" z ikonami i tooltipem (nazwa, opis, notatka).
- `CharacterCard` dostał opcjonalny prop `badges?: CharacterBadge[]` wyświetlający ikony odznak z tooltipem.
- W panelu `/admin` dodano zakładkę "Odznaki" z formularzem tworzenia definicji odznak (nazwa, ikona, opis, warunek, próg) i listą istniejących.
- W panelu `/mg` (WorldManagementShell) dodano sekcję "Odznaki" z formularzem ręcznego przyznawania odznaki po ID postaci.
- Dodano typy `Badge`, `CharacterBadge`, `BadgeCondition`, `BadgesResponse`, `CharacterBadgesResponse`, `BadgeMutationResponse`, `CreateBadgePayload`, `AwardBadgePayload` do `lib/types.ts`.
- Dodano funkcje `getBadges`, `getCharacterBadges`, `createBadge`, `awardBadge`, `removeBadge` do `lib/api.ts`.
- Zweryfikowano poleceniami: `npm --prefix server run test` (76/76), `npm --prefix server run build`, `npm run lint`, `npm run test:web` (4/4), `npm run build:web`.

## 2026-05-10 - ETAP 3 - WorldLog MVP - IN PROGRESS

- Dodano model `WorldLog` wraz z migracja Prisma oraz relacjami do `World` i autora wpisu `User`.
- Rozszerzono backendowy modul `worlds` o endpointy `GET /worlds/:worldId/world-log` i `POST /worlds/:worldId/world-log`, przy czym tworzenie wpisow zostalo ograniczone do rol `GM` i `ADMIN`.
- Logika backendu waliduje istnienie aktywnego swiata, normalizuje tresc wpisu i zwraca wpisy WorldLog w kolejnosci od najnowszych.
- Dodano testy backendowe potwierdzajace mozliwosc dodania wpisu WorldLog oraz poprawne pobieranie listy wpisow dla swiata.
- Zaimplementowano frontendowe widoki `/worlds` i `/worlds/[worldId]` z lista swiatow, przegladem wpisow WorldLog i prostym formularzem dodawania dla `GM/Admin`.
- Dashboard i panel `mg` dostaly skroty do WorldLoga, a konfiguracja `Playwright` zostala dopasowana do uruchamiania `webServer` przez `npm.cmd` na Windows.
- Zweryfikowano iteracje poleceniami: `npm.cmd --prefix server run prisma:generate`, `npm.cmd run lint`, `npm.cmd run test`, `npm.cmd run build`, `npx.cmd playwright test --reporter=line` przy lokalnie uruchomionym `npm.cmd run dev:web`.
