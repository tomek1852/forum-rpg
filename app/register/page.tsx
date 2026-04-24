import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Otworz swoje konto gracza"
      description="Po rejestracji konto czeka na weryfikacje e-mail, a po niej na zatwierdzenie przez MG lub administratora."
    >
      <RegisterForm />
    </AuthShell>
  );
}
