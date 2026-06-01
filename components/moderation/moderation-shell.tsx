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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getActivityLog,
  getApiErrorMessage,
  getCurrentUser,
  getModerationAccounts,
  getModerationReports,
  updateModerationAccountStatus,
  updateModerationReport,
  updateModerationUserRole,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { PresenceBadge } from "@/components/presence-badge";
import type {
  AccountStatus,
  ActivityLogEntry,
  ModerationReport,
  ModerationReportStatus,
  ModerationReportTargetType,
  Role,
  User,
} from "@/lib/types";

const MODERATOR_ROLES: Role[] = ["GM", "ADMIN"];
const ROLE_OPTIONS: Role[] = ["PLAYER", "GM", "ADMIN"];
const REPORT_STATUS_OPTIONS: Array<{ value: ModerationReportStatus | ""; label: string }> = [
  { value: "", label: "Wszystkie" },
  { value: "OPEN", label: "Otwarte" },
  { value: "IN_REVIEW", label: "W trakcie" },
  { value: "RESOLVED", label: "Rozpatrzone" },
  { value: "DISMISSED", label: "Odrzucone" },
];

const ACTION_FILTER_OPTIONS = [
  { value: "", label: "Wszystkie" },
  { value: "user.block", label: "Blokada konta" },
  { value: "user.activate", label: "Aktywacja konta" },
  { value: "user.change_role", label: "Zmiana roli" },
  { value: "character.approve_skill", label: "Zatwierdzenie umiejętności" },
  { value: "character.reject_skill", label: "Odrzucenie umiejętności" },
  { value: "moderation.resolve_report", label: "Rozpatrzone zgłoszenie" },
  { value: "moderation.dismiss_report", label: "Odrzucone zgłoszenie" },
  { value: "character.grant_progress", label: "Przyznanie EXP/PH" },
];

type Tab = "accounts" | "reports" | "activity-log";

export function ModerationShell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, hydrated, user, setUser, clearSession } = useAuthStore(
    (state) => state,
  );
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [reportStatusFilter, setReportStatusFilter] = useState<ModerationReportStatus | "">("");
  const [activityActionFilter, setActivityActionFilter] = useState("");
  const [activityCursor, setActivityCursor] = useState<string | undefined>(undefined);

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hydrated && Boolean(accessToken),
  });

  const currentUser = currentUserQuery.data?.user ?? user;
  const canModerate = Boolean(currentUser && MODERATOR_ROLES.includes(currentUser.role));
  const isAdmin = currentUser?.role === "ADMIN";

  const accountsQuery = useQuery({
    queryKey: ["moderation-accounts"],
    queryFn: getModerationAccounts,
    enabled: hydrated && Boolean(accessToken) && canModerate,
  });

  const reportsQuery = useQuery({
    queryKey: ["moderation-reports", reportStatusFilter],
    queryFn: () =>
      getModerationReports(
        reportStatusFilter ? { status: reportStatusFilter } : undefined,
      ),
    enabled: hydrated && Boolean(accessToken) && canModerate && activeTab === "reports",
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
    if (!hydrated) {
      return;
    }
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hydrated, router]);

  useEffect(() => {
    if (currentUserQuery.data?.user) {
      setUser(currentUserQuery.data.user);
    }
  }, [currentUserQuery.data, setUser]);

  useEffect(() => {
    if (currentUserQuery.isError) {
      clearSession();
      router.replace("/login");
    }
  }, [clearSession, currentUserQuery.isError, router]);

  useEffect(() => {
    if (hydrated && accessToken && currentUser && !canModerate) {
      router.replace("/dashboard");
    }
  }, [accessToken, canModerate, currentUser, hydrated, router]);

  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: AccountStatus;
    }) => updateModerationAccountStatus(userId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["moderation-accounts"] });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      updateModerationUserRole(userId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["moderation-accounts"] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: ({
      id,
      status,
      resolution,
    }: {
      id: string;
      status: ModerationReportStatus;
      resolution?: string;
    }) => updateModerationReport(id, { status, resolution }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
    },
  });

  if (
    !hydrated ||
    currentUserQuery.isLoading ||
    (canModerate && accountsQuery.isLoading && activeTab === "accounts")
  ) {
    return (
      <div className="min-h-screen px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-14 w-80 rounded-full bg-[color:var(--surface-strong)]" />
          <div className="h-56 rounded-[28px] bg-[color:var(--surface-strong)]" />
          <div className="h-56 rounded-[28px] bg-[color:var(--surface-strong)]" />
        </div>
      </div>
    );
  }

  if (!accessToken || !currentUser || !canModerate) {
    return null;
  }

  const accounts = accountsQuery.data?.users ?? [];
  const pendingAccounts = accounts.filter((account) => account.status === "PENDING_APPROVAL");
  const reports = reportsQuery.data?.reports ?? [];

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>Moderacja</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  Panel moderacji
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  Zarządzaj kontami, rolami użytkowników oraz zgłoszeniami treści.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </header>

        {currentUserQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">
            {getApiErrorMessage(currentUserQuery.error)}
          </p>
        ) : null}

        <div className="flex gap-2 border-b border-[color:var(--border)]">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "accounts"
                ? "border-b-2 border-[color:var(--foreground)] text-[color:var(--foreground)]"
                : "text-[color:var(--foreground-muted)] hover:text-[color:var(--foreground)]"
            }`}
            onClick={() => setActiveTab("accounts")}
          >
            Konta
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "reports"
                ? "border-b-2 border-[color:var(--foreground)] text-[color:var(--foreground)]"
                : "text-[color:var(--foreground-muted)] hover:text-[color:var(--foreground)]"
            }`}
            onClick={() => setActiveTab("reports")}
          >
            Zgłoszenia
          </button>
          {isAdmin ? (
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "activity-log"
                  ? "border-b-2 border-[color:var(--foreground)] text-[color:var(--foreground)]"
                  : "text-[color:var(--foreground-muted)] hover:text-[color:var(--foreground)]"
              }`}
              onClick={() => setActiveTab("activity-log")}
            >
              Log aktywności
            </button>
          ) : null}
        </div>

        {activeTab === "activity-log" && isAdmin ? (
          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-3xl text-[color:var(--foreground)]">
                  Log aktywności
                </h2>
                <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-muted)]">
                  Historia akcji moderatorów i administratorów w systemie.
                </p>
              </div>
              <select
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm focus:outline-none"
                value={activityActionFilter}
                onChange={(e) => {
                  setActivityActionFilter(e.target.value);
                  setActivityCursor(undefined);
                }}
              >
                {ACTION_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {activityLogQuery.isError ? (
              <p className="text-sm text-[#9d3d2d]">
                {getApiErrorMessage(activityLogQuery.error)}
              </p>
            ) : null}

            {activityLogQuery.isLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-[color:var(--surface-strong)]" />
                ))}
              </div>
            ) : (activityLogQuery.data?.entries ?? []).length > 0 ? (
              <>
                <div className="overflow-x-auto rounded-[20px] border border-[color:var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)]">
                        <th className="px-4 py-3 text-left font-medium text-[color:var(--foreground-muted)]">
                          Czas
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[color:var(--foreground-muted)]">
                          Aktor
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[color:var(--foreground-muted)]">
                          Akcja
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[color:var(--foreground-muted)]">
                          Cel
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border)]">
                      {(activityLogQuery.data?.entries ?? []).map((entry) => (
                        <ActivityLogRow entry={entry} key={entry.id} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3">
                  {activityCursor ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setActivityCursor(undefined)}
                    >
                      Pierwsza strona
                    </Button>
                  ) : null}
                  {activityLogQuery.data?.nextCursor ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setActivityCursor(activityLogQuery.data?.nextCursor ?? undefined)
                      }
                    >
                      Następna strona
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-10 text-sm leading-7 text-[color:var(--foreground-muted)]">
                  Brak wpisów w logu aktywności.
                </CardContent>
              </Card>
            )}
          </section>
        ) : activeTab === "accounts" ? (
          <>
            <section className="grid gap-6 lg:grid-cols-3">
              <SummaryCard
                label="Do zatwierdzenia"
                value={String(pendingAccounts.length)}
                description="Kont z poprawnie zweryfikowanym mailem i statusem oczekującym."
              />
              <SummaryCard
                label="Zablokowane"
                value={String(accounts.filter((account) => account.status === "BLOCKED").length)}
                description="Konta odcięte od logowania do czasu odblokowania."
              />
              <SummaryCard
                label="Moderator"
                value={currentUser.role}
                description="Twoje aktualne uprawnienia w panelu zatwierdzeń."
              />
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-display text-3xl text-[color:var(--foreground)]">
                  Konta oczekujące
                </h2>
                <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-muted)]">
                  Po weryfikacji e-mail nowe konto trafia tutaj i dopiero po zatwierdzeniu
                  może zalogować się do gry.
                </p>
              </div>
              {pendingAccounts.length > 0 ? (
                <div className="grid gap-4">
                  {pendingAccounts.map((account) => (
                    <AccountCard
                      account={account}
                      canManageRoles={isAdmin}
                      currentUserId={currentUser.id}
                      onRoleChange={(role) =>
                        roleMutation.mutate({ userId: account.id, role })
                      }
                      onStatusChange={(status) =>
                        statusMutation.mutate({ userId: account.id, status })
                      }
                      rolePending={roleMutation.isPending}
                      statusPending={statusMutation.isPending}
                      key={account.id}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-10 text-sm leading-7 text-[color:var(--foreground-muted)]">
                    Brak kont oczekujących na zatwierdzenie.
                  </CardContent>
                </Card>
              )}
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="font-display text-3xl text-[color:var(--foreground)]">
                  Wszystkie konta
                </h2>
                <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-muted)]">
                  Pełna lista kont z możliwością zmiany statusu oraz roli dla administratora.
                </p>
              </div>
              <div className="grid gap-4">
                {accounts.map((account) => (
                  <AccountCard
                    account={account}
                    canManageRoles={isAdmin}
                    currentUserId={currentUser.id}
                    onRoleChange={(role) =>
                      roleMutation.mutate({ userId: account.id, role })
                    }
                    onStatusChange={(status) =>
                      statusMutation.mutate({ userId: account.id, status })
                    }
                    rolePending={roleMutation.isPending}
                    statusPending={statusMutation.isPending}
                    key={account.id}
                  />
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-3xl text-[color:var(--foreground)]">
                  Zgłoszenia treści
                </h2>
                <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-muted)]">
                  Lista zgłoszeń postów, wątków i użytkowników.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {REPORT_STATUS_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    size="sm"
                    variant={reportStatusFilter === opt.value ? "default" : "secondary"}
                    onClick={() => setReportStatusFilter(opt.value as ModerationReportStatus | "")}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {reportsQuery.isError ? (
              <p className="text-sm text-[#9d3d2d]">
                {getApiErrorMessage(reportsQuery.error)}
              </p>
            ) : null}

            {reportsQuery.isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-28 rounded-[20px] bg-[color:var(--surface-strong)]" />
                <div className="h-28 rounded-[20px] bg-[color:var(--surface-strong)]" />
              </div>
            ) : reports.length > 0 ? (
              <div className="grid gap-4">
                {reports.map((report) => (
                  <ReportCard
                    report={report}
                    isPending={reportMutation.isPending}
                    onStatusChange={(status, resolution) =>
                      reportMutation.mutate({ id: report.id, status, resolution })
                    }
                    key={report.id}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-sm leading-7 text-[color:var(--foreground-muted)]">
                  Brak zgłoszeń dla wybranego filtra.
                </CardContent>
              </Card>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function ActivityLogRow({ entry }: { entry: ActivityLogEntry }) {
  return (
    <tr className="bg-[color:var(--surface)] transition-colors hover:bg-[color:var(--surface-strong)]">
      <td className="whitespace-nowrap px-4 py-3 text-xs text-[color:var(--foreground-muted)]">
        {formatDate(entry.createdAt)}
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/profile/${entry.actorId}`}
          className="font-medium underline underline-offset-2"
        >
          {entry.actor.displayName ?? entry.actor.username}
        </Link>
      </td>
      <td className="px-4 py-3">
        <Badge>{formatAction(entry.action)}</Badge>
      </td>
      <td className="px-4 py-3 text-xs text-[color:var(--foreground-muted)]">
        {entry.targetType && entry.targetId ? (
          <span>
            <span className="font-medium">{entry.targetType}</span>{" "}
            <code className="text-xs">{entry.targetId.slice(0, 8)}…</code>
          </span>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

function formatAction(action: string) {
  const labels: Record<string, string> = {
    "user.block": "Blokada konta",
    "user.activate": "Aktywacja konta",
    "user.set_pending": "Ustaw oczekujące",
    "user.change_role": "Zmiana roli",
    "character.approve_skill": "Zatw. umiejętność",
    "character.reject_skill": "Odrzuc. umiejętność",
    "moderation.resolve_report": "Rozpatrzono zgłoszenie",
    "moderation.dismiss_report": "Odrzucono zgłoszenie",
    "moderation.update_report": "Aktualizacja zgłoszenia",
    "character.grant_progress": "Przyznanie EXP/PH",
  };
  return labels[action] ?? action;
}

function ReportCard({
  report,
  isPending,
  onStatusChange,
}: {
  report: ModerationReport;
  isPending: boolean;
  onStatusChange: (status: ModerationReportStatus, resolution?: string) => void;
}) {
  const [resolution, setResolution] = useState("");

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap gap-2">
              <Badge>{formatReportStatus(report.status)}</Badge>
              <Badge>{formatTargetType(report.targetType)}</Badge>
            </div>
            <CardTitle className="mt-2 text-xl">
              Zgłoszenie od{" "}
              <Link
                href={`/profile/${report.reporterId}`}
                className="underline underline-offset-2"
              >
                {report.reporter.displayName ?? report.reporter.username}
              </Link>
            </CardTitle>
            <CardDescription>
              {formatDate(report.createdAt)} · cel: <code className="text-xs">{report.targetId}</code>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-[color:var(--foreground-muted)]">
          {report.reason}
        </p>
        {report.resolution ? (
          <p className="rounded-lg bg-[color:var(--surface-strong)] px-4 py-3 text-sm">
            <span className="font-medium">Decyzja:</span> {report.resolution}
          </p>
        ) : null}
        {report.status === "OPEN" || report.status === "IN_REVIEW" ? (
          <div className="space-y-3">
            <textarea
              className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm placeholder:text-[color:var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[color:var(--foreground)]"
              placeholder="Opcjonalna decyzja / komentarz..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isPending}
                onClick={() => onStatusChange("IN_REVIEW")}
              >
                W trakcie
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => onStatusChange("RESOLVED", resolution || undefined)}
              >
                Rozpatrz
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isPending}
                onClick={() => onStatusChange("DISMISSED", resolution || undefined)}
              >
                Odrzuć
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-7 text-[color:var(--foreground-muted)]">
        {description}
      </CardContent>
    </Card>
  );
}

function AccountCard({
  account,
  currentUserId,
  canManageRoles,
  statusPending,
  rolePending,
  onStatusChange,
  onRoleChange,
}: {
  account: User;
  currentUserId: string;
  canManageRoles: boolean;
  statusPending: boolean;
  rolePending: boolean;
  onStatusChange: (status: AccountStatus) => void;
  onRoleChange: (role: Role) => void;
}) {
  const isCurrentUser = account.id === currentUserId;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{formatStatus(account.status)}</Badge>
              <Badge>{formatRole(account.role)}</Badge>
              {account.emailVerified ? <Badge>E-mail OK</Badge> : <Badge>Brak weryfikacji</Badge>}
              <PresenceBadge status={account.presenceStatus} showLabel />
            </div>
            <CardTitle className="mt-3 text-2xl">
              {account.displayName || account.username}
            </CardTitle>
            <CardDescription className="mt-2">
              {account.email} · utworzono {formatDate(account.createdAt)}
              {account.lastSeenAt ? ` · ostatnio ${formatDate(account.lastSeenAt)}` : ""}
            </CardDescription>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/profile/${account.id}`}>Profil</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant={account.status === "ACTIVE" ? "default" : "secondary"}
            disabled={statusPending || account.status === "ACTIVE" || !account.emailVerified}
            onClick={() => onStatusChange("ACTIVE")}
          >
            Aktywuj
          </Button>
          <Button
            type="button"
            variant={account.status === "PENDING_APPROVAL" ? "default" : "secondary"}
            disabled={statusPending || account.status === "PENDING_APPROVAL"}
            onClick={() => onStatusChange("PENDING_APPROVAL")}
          >
            Oczekuje
          </Button>
          <Button
            type="button"
            variant={account.status === "BLOCKED" ? "default" : "secondary"}
            disabled={statusPending || account.status === "BLOCKED" || isCurrentUser}
            onClick={() => onStatusChange("BLOCKED")}
          >
            Zablokuj
          </Button>
        </div>

        {canManageRoles ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--foreground-subtle)]">
              Rola
            </p>
            <div className="flex flex-wrap gap-3">
              {ROLE_OPTIONS.map((role) => (
                <Button
                  type="button"
                  variant={account.role === role ? "default" : "secondary"}
                  disabled={rolePending || account.role === role || isCurrentUser}
                  onClick={() => onRoleChange(role)}
                  key={role}
                >
                  {formatRole(role)}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatRole(role: Role) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "GM":
      return "MG";
    default:
      return "Gracz";
  }
}

function formatStatus(status: AccountStatus) {
  switch (status) {
    case "ACTIVE":
      return "Aktywne";
    case "BLOCKED":
      return "Zablokowane";
    default:
      return "Oczekujące";
  }
}

function formatReportStatus(status: ModerationReportStatus) {
  switch (status) {
    case "OPEN":
      return "Otwarte";
    case "IN_REVIEW":
      return "W trakcie";
    case "RESOLVED":
      return "Rozpatrzone";
    case "DISMISSED":
      return "Odrzucone";
  }
}

function formatTargetType(type: ModerationReportTargetType) {
  switch (type) {
    case "POST":
      return "Post";
    case "THREAD":
      return "Wątek";
    case "USER":
      return "Użytkownik";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
