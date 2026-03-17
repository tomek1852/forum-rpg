import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Wroc do opowiesci"
      description="Zaloguj sie, odzyskaj dostep do dashboardu i przygotuj konto pod nastepne etapy rozgrywki."
    >
      <LoginForm />
    </AuthShell>
  );
}
