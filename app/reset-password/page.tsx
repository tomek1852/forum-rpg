import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordPanel } from "@/components/auth/reset-password-panel";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Przywróć dostęp do konta"
      description="Ustaw nowe hasło i odzyskaj dostęp do swojego konta."
    >
      <ResetPasswordPanel />
    </AuthShell>
  );
}
