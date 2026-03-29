import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordPanel } from "@/components/auth/reset-password-panel";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Przywroc dostep do konta"
      description="Ustaw nowe haslo i odzyskaj dostep do swojego konta."
    >
      <ResetPasswordPanel />
    </AuthShell>
  );
}
