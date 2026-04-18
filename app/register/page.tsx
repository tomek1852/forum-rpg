import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Otwórz swoje konto gracza"
      description="Po rejestracji konto czeka na weryfikację e-mail. Dopiero aktywne konto wpuszcza do panelu gracza."
    >
      <RegisterForm />
    </AuthShell>
  );
}
