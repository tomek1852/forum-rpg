import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Aktywuj konto przed pierwszą sesją"
      description="Potwierdź adres e-mail, aby aktywować konto i wejść do panelu."
    >
      <Suspense
        fallback={
          <div className="text-sm text-[color:var(--foreground-muted)]">
            Ładowanie weryfikacji...
          </div>
        }
      >
        <VerifyEmailPanel />
      </Suspense>
    </AuthShell>
  );
}
