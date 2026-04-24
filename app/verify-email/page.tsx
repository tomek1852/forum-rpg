import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Aktywuj konto przed pierwszą sesją"
      description="Na podany adres wysyłamy link aktywacyjny. Po potwierdzeniu konto trafi do kolejki zatwierdzenia."
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
