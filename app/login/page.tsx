import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Wróć do opowieści"
      description="Zaloguj się i wróć do swojego panelu gracza."
    >
      <LoginForm />
    </AuthShell>
  );
}
