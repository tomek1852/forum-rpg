import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordPanel } from "@/components/auth/reset-password-panel";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Przywroc dostep do konta"
      description="Faza 1 zawiera pelny obieg resetu hasla z developerskim tokenem do szybkiego testowania."
    >
      <ResetPasswordPanel />
    </AuthShell>
  );
}
