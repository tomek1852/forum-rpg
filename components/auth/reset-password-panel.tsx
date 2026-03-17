"use client";

import { useState } from "react";
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
import {
  getApiErrorMessage,
  requestPasswordReset,
  resetPassword,
} from "@/lib/api";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validators";

type RequestResetValues = {
  email: string;
};

type ResetValues = {
  token: string;
  newPassword: string;
};

export function ResetPasswordPanel() {
  const [developmentToken, setDevelopmentToken] = useState<string | null>(null);
  const requestForm = useForm<RequestResetValues>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: "" },
  });
  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: "", newPassword: "" },
  });

  const requestMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data) => {
      setDevelopmentToken(data.developmentResetToken ?? null);
      if (data.developmentResetToken) {
        resetForm.setValue("token", data.developmentResetToken);
      }
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      resetForm.reset({
        token: "",
        newPassword: "",
      });
      setDevelopmentToken(null);
    },
  });

  return (
    <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Popros o reset</CardTitle>
          <CardDescription>
            Na potrzeby MVP backend moze zwrocic token resetu, zeby nie blokowac
            testow bez emaila.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={requestForm.handleSubmit((values) =>
              requestMutation.mutate(values),
            )}
          >
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                {...requestForm.register("email")}
              />
              <FormError message={requestForm.formState.errors.email?.message} />
            </div>
            <FormError
              message={
                requestMutation.isError
                  ? getApiErrorMessage(requestMutation.error)
                  : undefined
              }
            />
            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending ? "Wysylanie..." : "Wyslij link resetu"}
            </Button>
          </form>
          {requestMutation.isSuccess ? (
            <div className="mt-6 rounded-3xl bg-[color:var(--surface)] p-4 text-sm leading-6 text-[color:var(--foreground-muted)]">
              <p>{requestMutation.data.message}</p>
              {developmentToken ? (
                <p className="mt-3 break-all font-semibold text-[color:var(--accent-strong)]">
                  Token developerski: {developmentToken}
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ustaw nowe haslo</CardTitle>
          <CardDescription>
            Wklej token i nadaj nowe haslo. Po zmianie stare sesje sa wygaszane.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={resetForm.handleSubmit((values) =>
              resetMutation.mutate(values),
            )}
          >
            <div>
              <Label htmlFor="token">Token resetu</Label>
              <Input id="token" {...resetForm.register("token")} />
              <FormError message={resetForm.formState.errors.token?.message} />
            </div>
            <div>
              <Label htmlFor="new-password">Nowe haslo</Label>
              <Input
                id="new-password"
                type="password"
                {...resetForm.register("newPassword")}
              />
              <FormError
                message={resetForm.formState.errors.newPassword?.message}
              />
            </div>
            <FormError
              message={
                resetMutation.isError
                  ? getApiErrorMessage(resetMutation.error)
                  : undefined
              }
            />
            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? "Zapisywanie..." : "Zmien haslo"}
            </Button>
          </form>
          {resetMutation.isSuccess ? (
            <div className="mt-6 rounded-3xl bg-[color:var(--surface)] p-4 text-sm font-semibold text-[color:var(--accent-strong)]">
              {resetMutation.data.message}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-[#9d3d2d]">{message}</p>;
}
