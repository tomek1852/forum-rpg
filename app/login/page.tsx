import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Wroc do opowiesci"
      description="Zaloguj sie i wroc do swojego panelu gracza."
    >
      <LoginForm />
    </AuthShell>
  );
}
