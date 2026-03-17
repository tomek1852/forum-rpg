import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Otworz swoje konto gracza"
      description="Rejestracja od razu buduje sesje, dzieki czemu po zapisaniu formularza trafiasz prosto do panelu."
    >
      <RegisterForm />
    </AuthShell>
  );
}
