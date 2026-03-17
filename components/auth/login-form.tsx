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
import { useAuthStore } from "@/lib/auth-store";
import { getApiErrorMessage, loginUser } from "@/lib/api";
import { loginSchema } from "@/lib/validators";
import type { LoginPayload } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setSession(data);
      router.push("/dashboard");
    },
  });

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Logowanie</CardTitle>
        <CardDescription>
          Wejdz do panelu gracza, aby kontynuowac kampanie i zarzadzac kontem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div>
            <Label htmlFor="identifier">Email lub nazwa uzytkownika</Label>
            <Input id="identifier" {...form.register("identifier")} />
            <FormError message={form.formState.errors.identifier?.message} />
          </div>
          <div>
            <Label htmlFor="password">Haslo</Label>
            <Input id="password" type="password" {...form.register("password")} />
            <FormError message={form.formState.errors.password?.message} />
          </div>
          <FormError
            message={
              mutation.isError ? getApiErrorMessage(mutation.error) : undefined
            }
          />
          <Button
            className="w-full"
            size="lg"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Logowanie..." : "Zaloguj sie"}
          </Button>
        </form>
        <div className="mt-6 flex flex-col gap-3 text-sm text-[color:var(--foreground-muted)]">
          <Link
            className="font-semibold text-[color:var(--accent-strong)]"
            href="/register"
          >
            Nie masz konta? Zaloz je teraz
          </Link>
          <Link
            className="font-semibold text-[color:var(--accent-strong)]"
            href="/reset-password"
          >
            Zapomniales hasla? Otworz reset
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-[#9d3d2d]">{message}</p>;
}
