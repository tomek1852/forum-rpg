"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage, registerUser } from "@/lib/api";
import { registerSchema } from "@/lib/validators";

type RegisterValues = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: RegisterValues) => {
      return registerUser({
        email: values.email,
        username: values.username,
        password: values.password,
      });
    },
    onSuccess: (data) => {
      const nextUrl = data.developmentVerificationToken
        ? `/verify-email?token=${encodeURIComponent(data.developmentVerificationToken)}`
        : "/verify-email";
      router.push(nextUrl);
    },
  });

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Rejestracja</CardTitle>
        <CardDescription>
          Stworz konto gracza i przygotuj baze pod pierwsza postac.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <Field
            id="email"
            label="Email"
            error={form.formState.errors.email?.message}
            input={
              <Input id="email" type="email" {...form.register("email")} />
            }
          />
          <Field
            id="username"
            label="Nazwa uzytkownika"
            error={form.formState.errors.username?.message}
            input={<Input id="username" {...form.register("username")} />}
          />
          <Field
            id="password"
            label="Haslo"
            error={form.formState.errors.password?.message}
            input={
              <Input
                id="password"
                type="password"
                {...form.register("password")}
              />
            }
          />
          <Field
            id="confirmPassword"
            label="Powtorz haslo"
            error={form.formState.errors.confirmPassword?.message}
            input={
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
              />
            }
          />
          <p className="text-sm leading-6 text-[color:var(--foreground-muted)]">
            Rejestracja tworzy konto w stanie oczekujacym. Po weryfikacji email aktywujesz logowanie.
          </p>
          <FormError
            message={
              mutation.isError ? getApiErrorMessage(mutation.error) : undefined
            }
          />
          {mutation.isSuccess ? (
            <div className="rounded-3xl bg-[color:var(--surface)] p-4 text-sm leading-6 text-[color:var(--foreground-muted)]">
              <p>{mutation.data.message}</p>
              {mutation.data.developmentVerificationToken ? (
                <p className="mt-3 break-all font-semibold text-[color:var(--accent-strong)]">
                  Token developerski: {mutation.data.developmentVerificationToken}
                </p>
              ) : null}
            </div>
          ) : null}
          <Button
            className="w-full"
            size="lg"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Tworzenie konta..." : "Zaloz konto"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-[color:var(--foreground-muted)]">
          Masz juz konto?{" "}
          <Link
            className="font-semibold text-[color:var(--accent-strong)]"
            href="/login"
          >
            Przejdz do logowania
          </Link>
        </p>
        <p className="mt-3 text-sm text-[color:var(--foreground-muted)]">
          Potrzebujesz aktywacji?{" "}
          <Link
            className="font-semibold text-[color:var(--accent-strong)]"
            href="/verify-email"
          >
            Otworz weryfikacje email
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  input,
  error,
}: {
  id: string;
  label: string;
  input: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {input}
      <FormError message={error} />
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-[#9d3d2d]">{message}</p>;
}
