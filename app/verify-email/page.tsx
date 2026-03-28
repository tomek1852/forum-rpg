import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Aktywuj konto przed pierwsza sesja"
      description="Ten etap rejestracji konczy sie dopiero po weryfikacji email. W dev mozesz uzyc tokenu wyswietlonego po rejestracji."
    >
      <Suspense fallback={<div className="text-sm text-[color:var(--foreground-muted)]">Ladowanie weryfikacji...</div>}>
        <VerifyEmailPanel />
      </Suspense>
    </AuthShell>
  );
}
