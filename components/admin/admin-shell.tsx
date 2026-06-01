"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createBadge,
  getActivityLog,
  getAdminStats,
  getAdminUsers,
  getApiErrorMessage,
  getBadges,
  getCurrentUser,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type {
  AccountStatus,
  ActivityLogEntry,
  AdminStatsResponse,
  Badge as BadgeDefinition,
  BadgeCondition,
  CreateBadgePayload,
  Role,
  User,
} from "@/lib/types";

type Tab = "users" | "stats" | "activity-log" | "badges";

const ROLE_OPTIONS: Role[] = ["PLAYER", "GM", "ADMIN"];
const STATUS_OPTIONS: AccountStatus[] = ["PENDING_APPROVAL", "ACTIVE", "BLOCKED"];

const STATUS_LABELS: Record<AccountStatus, string> = {
  PENDING_APPROVAL: "Oczekujące",
  ACTIVE: "Aktywne",
  BLOCKED: "Zablokowane",
};

const ROLE_LABELS: Record<Role, string> = {
  PLAYER: "Gracz",
  GM: "GM",
  ADMIN: "Admin",
};

const ACTION_FILTER_OPTIONS = [
  { value: "", label: "Wszystkie" },
  { value: "user.block", label: "Blokada konta" },
  { value: "user.activate", label: "Aktywacja konta" },
  { value: "user.change_role", label: "Zmiana roli" },
  { value: "moderation.resolve_report", label: "Rozpatrzone zgłoszenie" },
  { value: "moderation.dismiss_report", label: "Odrzucone zgłoszenie" },
  { value: "character.grant_progress", label: "Przyznanie EXP/PH" },
];

function statusClass(status: AccountStatus) {
  if (status === "ACTIVE") return "bg-green-100 text-green-800";
  if (status === "BLOCKED") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
}

function roleClass(role: Role) {
  if (role === "ADMIN") return "bg-red-100 text-red-800";
  if (role === "GM") return "bg-blue-100 text-blue-800";
  return "";
}

export function AdminShell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, hydrated, user, setUser, clearSession } = useAuthStore(
    (state) => state,
  );
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "">("");
  const [filterStatus, setFilterStatus] = useState<AccountStatus | "">("");
  const [sortBy, setSortBy] = useState<"createdAt" | "lastLogin" | "username">("createdAt");
  const [page, setPage] = useState(1);
  const [activityActionFilter, setActivityActionFilter] = useState("");
  const [activityCursor, setActivityCursor] = useState<string | undefined>(undefined);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const currentUser = currentUserQuery.data?.user ?? user;
  const isAdmin = currentUser?.role === "ADMIN";

  const usersQuery = useQuery({
    queryKey: ["admin-users", search, filterRole, filterStatus, sortBy, page],
    queryFn: () =>
      getAdminUsers({
        search: search || undefined,
        role: filterRole || undefined,
        status: filterStatus || undefined,
        sortBy,
        page,
        limit: 20,
      }),
    enabled: hydrated && Boolean(accessToken) && isAdmin && activeTab === "users",
  });

  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
    enabled: hydrated && Boolean(accessToken) && isAdmin && activeTab === "stats",
  });

  const activityLogQuery = useQuery({
    queryKey: ["activity-log", activityActionFilter, activityCursor],
    queryFn: () =>
      getActivityLog({
        action: activityActionFilter || undefined,
        cursor: activityCursor,
        limit: 20,
      }),
    enabled: hydrated && Boolean(accessToken) && isAdmin && activeTab === "activity-log",
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) router.replace("/login");
  }, [accessToken, hydrated, router]);

  useEffect(() => {
    if (currentUserQuery.data?.user) setUser(currentUserQuery.data.user);
  }, [currentUserQuery.data, setUser]);

  useEffect(() => {
    if (currentUserQuery.isError) {
      clearSession();
      router.replace("/login");
    }
  }, [clearSession, currentUserQuery.isError, router]);

  useEffect(() => {
    if (hydrated && accessToken && currentUser && !isAdmin) {
      router.replace("/moderation");
    }
  }, [accessToken, currentUser, hydrated, isAdmin, router]);

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AccountStatus }) =>
      updateAdminUserStatus(userId, status),
    onSuccess: () => {
      setMutationError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => setMutationError(getApiErrorMessage(err)),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      updateAdminUserRole(userId, role),
    onSuccess: () => {
      setMutationError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => setMutationError(getApiErrorMessage(err)),
  });

  const badgesQuery = useQuery({
    queryKey: ["admin-badges"],
    queryFn: getBadges,
    enabled: hydrated && Boolean(accessToken) && isAdmin && activeTab === "badges",
  });

  const createBadgeMutation = useMutation({
    mutationFn: createBadge,
    onSuccess: () => {
      setMutationError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-badges"] });
    },
    onError: (err) => setMutationError(getApiErrorMessage(err)),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  if (!hydrated || currentUserQuery.isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Ładowanie...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "users", label: "Użytkownicy" },
    { key: "stats", label: "Statystyki" },
    { key: "activity-log", label: "Log aktywności" },
    { key: "badges", label: "Odznaki" },
  ];

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Panel administracyjny</h1>

      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
            <Input
              placeholder="Szukaj po nazwie lub e-mailu..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" variant="secondary" size="sm">
              Szukaj
            </Button>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value as AccountStatus | ""); setPage(1); }}
              className="border rounded px-2 py-1 text-sm bg-background"
            >
              <option value="">Wszystkie statusy</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value as Role | ""); setPage(1); }}
              className="border rounded px-2 py-1 text-sm bg-background"
            >
              <option value="">Wszystkie role</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
              className="border rounded px-2 py-1 text-sm bg-background"
            >
              <option value="createdAt">Data rejestracji</option>
              <option value="lastLogin">Ostatnie logowanie</option>
              <option value="username">Nazwa</option>
            </select>
          </form>

          {mutationError && (
            <p className="text-sm text-destructive">{mutationError}</p>
          )}

          {usersQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Ładowanie...</p>
          )}

          {usersQuery.data && (
            <>
              <p className="text-sm text-muted-foreground">
                Łącznie: {usersQuery.data.total} użytkowników
              </p>
              <div className="space-y-2">
                {usersQuery.data.users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isSelf={u.id === currentUser?.id}
                    onStatusChange={(status) =>
                      statusMutation.mutate({ userId: u.id, status })
                    }
                    onRoleChange={(role) =>
                      roleMutation.mutate({ userId: u.id, role })
                    }
                  />
                ))}
              </div>
              <div className="flex gap-2 items-center mt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Poprzednia
                </Button>
                <span className="text-sm">Strona {page}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={
                    usersQuery.data.users.length < 20 ||
                    usersQuery.data.total <= page * 20
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Następna
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "stats" && (
        <StatsTab data={statsQuery.data} isLoading={statsQuery.isLoading} />
      )}

      {activeTab === "activity-log" && (
        <ActivityTab
          entries={activityLogQuery.data?.entries}
          nextCursor={activityLogQuery.data?.nextCursor ?? null}
          isLoading={activityLogQuery.isLoading}
          actionFilter={activityActionFilter}
          onActionFilterChange={(v) => {
            setActivityActionFilter(v);
            setActivityCursor(undefined);
          }}
          onNextPage={() =>
            setActivityCursor(activityLogQuery.data?.nextCursor ?? undefined)
          }
          onFirstPage={() => setActivityCursor(undefined)}
        />
      )}

      {activeTab === "badges" && (
        <BadgesAdminTab
          badges={badgesQuery.data?.badges ?? []}
          isLoading={badgesQuery.isLoading}
          onCreateBadge={(payload) => createBadgeMutation.mutate(payload)}
          isCreating={createBadgeMutation.isPending}
        />
      )}
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  onStatusChange,
  onRoleChange,
}: {
  user: User;
  isSelf: boolean;
  onStatusChange: (s: AccountStatus) => void;
  onRoleChange: (r: Role) => void;
}) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <Link
                href={`/admin/users/${user.id}`}
                className="font-medium hover:underline truncate block"
              >
                {user.username}
              </Link>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Badge className={`shrink-0 ${statusClass(user.status)}`}>
              {STATUS_LABELS[user.status]}
            </Badge>
            <Badge className={`shrink-0 ${roleClass(user.role)}`}>
              {ROLE_LABELS[user.role]}
            </Badge>
            {!user.emailVerified && (
              <Badge className="shrink-0 text-yellow-600">
                Niezweryfikowany
              </Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            {user.status !== "ACTIVE" && (
              <Button
                size="sm"
                variant="secondary"
                disabled={!user.emailVerified}
                onClick={() => onStatusChange("ACTIVE")}
              >
                Aktywuj
              </Button>
            )}
            {user.status !== "BLOCKED" && !isSelf && (
              <Button
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => onStatusChange("BLOCKED")}
              >
                Zablokuj
              </Button>
            )}
            <select
              value={user.role}
              disabled={isSelf}
              onChange={(e) => onRoleChange(e.target.value as Role)}
              className="border rounded px-2 py-1 text-xs bg-background"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsTab({
  data,
  isLoading,
}: {
  data?: AdminStatsResponse;
  isLoading: boolean;
}) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Ładowanie...</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">Użytkownicy</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(["ACTIVE", "PENDING_APPROVAL", "BLOCKED"] as AccountStatus[]).map((s) => (
            <Card key={s}>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {STATUS_LABELS[s]}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-3xl font-bold">{data.usersByStatus[s] ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Role</h2>
        <div className="grid grid-cols-3 gap-3">
          {(["PLAYER", "GM", "ADMIN"] as Role[]).map((r) => (
            <Card key={r}>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {ROLE_LABELS[r]}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-3xl font-bold">{data.usersByRole[r] ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Zgłoszenia moderacyjne</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"] as const).map((s) => (
            <Card key={s}>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s === "OPEN" ? "Otwarte" : s === "IN_REVIEW" ? "W trakcie" : s === "RESOLVED" ? "Rozpatrzone" : "Odrzucone"}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-3xl font-bold">{data.reportsByStatus[s] ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Postacie</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold">{data.characterCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Konwersacje</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold">{data.activeConversationCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const BADGE_CONDITION_OPTIONS: Array<{ value: BadgeCondition; label: string }> = [
  { value: "FIRST_POST", label: "Pierwszy post" },
  { value: "FIRST_CHARACTER", label: "Pierwsza postać" },
  { value: "EXP_100", label: "100 EXP" },
  { value: "EXP_500", label: "500 EXP" },
  { value: "EXP_1000", label: "1000 EXP" },
  { value: "SKILL_APPROVED", label: "Zatwierdzona umiejętność" },
  { value: "EVENT_PARTICIPANT", label: "Uczestnik eventu" },
  { value: "CUSTOM", label: "Ręcznie (niestandardowa)" },
];

function BadgesAdminTab({
  badges,
  isLoading,
  onCreateBadge,
  isCreating,
}: {
  badges: BadgeDefinition[];
  isLoading: boolean;
  onCreateBadge: (payload: CreateBadgePayload) => void;
  isCreating: boolean;
}) {
  const [form, setForm] = useState<CreateBadgePayload>({
    name: "",
    description: "",
    icon: "🏅",
    condition: "CUSTOM",
  });
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.icon.trim()) {
      setFormError("Wypełnij wszystkie wymagane pola.");
      return;
    }
    setFormError(null);
    onCreateBadge(form);
    setForm({ name: "", description: "", icon: "🏅", condition: "CUSTOM" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Utwórz nową odznakę</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nazwa *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={80}
                  placeholder="np. Pierwszy krok"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Ikona (emoji) *</label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  maxLength={10}
                  placeholder="🏅"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Opis *</label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                maxLength={400}
                placeholder="Krótki opis warunków przyznania..."
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Warunek</label>
                <select
                  value={form.condition}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, condition: e.target.value as BadgeCondition }))
                  }
                  className="w-full border rounded px-2 py-2 text-sm bg-background"
                >
                  {BADGE_CONDITION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Próg (opcjonalnie)</label>
                <Input
                  type="number"
                  min={1}
                  value={form.threshold ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      threshold: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  placeholder="np. 3"
                />
              </div>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Tworzenie..." : "Utwórz odznakę"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Istniejące odznaki ({badges.length})</h2>
        {isLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}
        {!isLoading && badges.length === 0 && (
          <p className="text-sm text-muted-foreground">Brak zdefiniowanych odznak.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <Card key={badge.id}>
              <CardContent className="flex items-start gap-3 pt-4">
                <span className="text-3xl">{badge.icon}</span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  <Badge className="mt-1 text-xs">
                    {BADGE_CONDITION_OPTIONS.find((o) => o.value === badge.condition)?.label ?? badge.condition}
                    {badge.threshold ? ` (≥${badge.threshold})` : ""}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityTab({
  entries,
  nextCursor,
  isLoading,
  actionFilter,
  onActionFilterChange,
  onNextPage,
  onFirstPage,
}: {
  entries?: ActivityLogEntry[];
  nextCursor: string | null;
  isLoading: boolean;
  actionFilter: string;
  onActionFilterChange: (v: string) => void;
  onNextPage: () => void;
  onFirstPage: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <select
          value={actionFilter}
          onChange={(e) => onActionFilterChange(e.target.value)}
          className="border rounded px-2 py-1 text-sm bg-background"
        >
          {ACTION_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}

      {entries && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Czas</th>
                  <th className="text-left py-2 pr-4 font-medium">Aktor</th>
                  <th className="text-left py-2 pr-4 font-medium">Akcja</th>
                  <th className="text-left py-2 font-medium">Cel</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString("pl-PL")}
                    </td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/admin/users/${entry.actorId}`}
                        className="hover:underline"
                      >
                        {entry.actor.displayName ?? entry.actor.username}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge>{entry.action}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {entry.targetType && (
                        <span>
                          {entry.targetType}:{" "}
                          <span className="font-mono text-xs">{entry.targetId?.slice(0, 8)}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={onFirstPage}>
              Pierwsza strona
            </Button>
            <Button size="sm" variant="secondary" disabled={!nextCursor} onClick={onNextPage}>
              Następna strona
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
