"use client";

import { useEffect } from "react";
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
  getApiErrorMessage,
  getCurrentUser,
  getModerationAccounts,
  updateModerationAccountStatus,
  updateModerationUserRole,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { AccountStatus, Role, User } from "@/lib/types";

const MODERATOR_ROLES: Role[] = ["GM", "ADMIN"];
const ROLE_OPTIONS: Role[] = ["PLAYER", "GM", "ADMIN"];

export function ModerationShell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, hydrated, user, setUser, clearSession } = useAuthStore(
    (state) => state,
  );

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

  if (
    !hydrated ||
    currentUserQuery.isLoading ||
    (canModerate && accountsQuery.isLoading)
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

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--hero)] p-8 shadow-[0_18px_70px_rgba(84,53,29,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Badge>Moderacja</Badge>
              <div>
                <h1 className="font-display text-5xl text-[color:var(--foreground)]">
                  Panel zatwierdzania kont
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-[color:var(--foreground-muted)]">
                  Tutaj zatwierdzisz nowe konta, zablokujesz dostep i jako administrator
                  zarzadzisz rolami uzytkownikow.
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
        {accountsQuery.isError ? (
          <p className="text-sm text-[#9d3d2d]">
            {getApiErrorMessage(accountsQuery.error)}
          </p>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-3">
          <SummaryCard
            label="Do zatwierdzenia"
            value={String(pendingAccounts.length)}
            description="Kont z poprawnie zweryfikowanym mailem i statusem oczekujacym."
          />
          <SummaryCard
            label="Zablokowane"
            value={String(accounts.filter((account) => account.status === "BLOCKED").length)}
            description="Konta odciete od logowania do czasu odblokowania."
          />
          <SummaryCard
            label="Moderator"
            value={currentUser.role}
            description="Twoje aktualne uprawnienia w panelu zatwierdzen."
          />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-display text-3xl text-[color:var(--foreground)]">
              Konta oczekujace
            </h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-muted)]">
              Po weryfikacji e-mail nowe konto trafia tutaj i dopiero po zatwierdzeniu
              moze zalogowac sie do gry.
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
                Brak kont oczekujacych na zatwierdzenie. Gdy nowy gracz potwierdzi
                e-mail, pojawi sie tutaj.
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
              Pelna lista kont z mozliwoscia zmiany statusu oraz roli dla administratora.
            </p>
          </div>
          <div className="grid gap-4">
            {accounts.map((account) => (
              <AccountCard
                account={account}
                canManageRoles={isAdmin}
                currentUserId={currentUser.id}
                onRoleChange={(role) => roleMutation.mutate({ userId: account.id, role })}
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
      </div>
    </div>
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
            <div className="flex flex-wrap gap-2">
              <Badge>{formatStatus(account.status)}</Badge>
              <Badge>{formatRole(account.role)}</Badge>
              {account.emailVerified ? <Badge>E-mail OK</Badge> : <Badge>Brak weryfikacji</Badge>}
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
      return "Oczekujace";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
