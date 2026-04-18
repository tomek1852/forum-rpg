"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  requestEmailVerification,
  verifyEmail,
  getApiErrorMessage,
} from "@/lib/api";
import {
  requestEmailVerificationSchema,
  verifyEmailSchema,
} from "@/lib/validators";
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

type VerifyValues = z.input<typeof verifyEmailSchema>;
type RequestValues = z.input<typeof requestEmailVerificationSchema>;

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token");
  const [devToken, setDevToken] = useState<string | null>(urlToken);

  const verifyForm = useForm<VerifyValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      token: searchParams.get("token") ?? "",
    },
  });
  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestEmailVerificationSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    if (urlToken) {
      verifyForm.setValue("token", urlToken);
    }
  }, [urlToken, verifyForm]);

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
  });

  const requestMutation = useMutation({
    mutationFn: requestEmailVerification,
    onSuccess: (data) => {
      if (data.developmentVerificationToken) {
        setDevToken(data.developmentVerificationToken);
        verifyForm.setValue("token", data.developmentVerificationToken);
      }
    },
  });

  return (
    <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Zweryfikuj e-mail</CardTitle>
          <CardDescription>
            Wklej token z maila lub z developerskiego podglądu, aby aktywować konto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={verifyForm.handleSubmit((values) =>
              verifyMutation.mutate(values)
            )}
          >
            <div>
              <Label htmlFor="verification-token">Token weryfikacji</Label>
              <Input id="verification-token" {...verifyForm.register("token")} />
              <FieldError message={verifyForm.formState.errors.token?.message} />
            </div>
            <FieldError
              message={
                verifyMutation.isError
                  ? getApiErrorMessage(verifyMutation.error)
                  : undefined
              }
            />
            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Weryfikacja..." : "Aktywuj konto"}
            </Button>
          </form>
          {verifyMutation.isSuccess ? (
            <div className="mt-6 rounded-3xl bg-[color:var(--surface)] p-4 text-sm leading-6 text-[color:var(--foreground-muted)]">
              <p className="font-semibold text-[color:var(--accent-strong)]">
                {verifyMutation.data.message}
              </p>
              <p className="mt-2">
                Teraz możesz przejść do{" "}
                <Link className="font-semibold text-[color:var(--accent-strong)]" href="/login">
                  logowania
                </Link>
                .
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Wyślij link ponownie</CardTitle>
          <CardDescription>
            Jeśli zgubiłeś token, podaj e-mail i wygeneruj nową instrukcję weryfikacji.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={requestForm.handleSubmit((values) =>
              requestMutation.mutate(values)
            )}
          >
            <div>
              <Label htmlFor="verify-email-address">E-mail</Label>
              <Input
                id="verify-email-address"
                type="email"
                {...requestForm.register("email")}
              />
              <FieldError message={requestForm.formState.errors.email?.message} />
            </div>
            <FieldError
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
              variant="secondary"
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending ? "Wysyłanie..." : "Wyślij ponownie"}
            </Button>
          </form>
          {requestMutation.isSuccess ? (
            <div className="mt-6 rounded-3xl bg-[color:var(--surface)] p-4 text-sm leading-6 text-[color:var(--foreground-muted)]">
              <p>{requestMutation.data.message}</p>
              {devToken ? (
                <p className="mt-3 break-all font-semibold text-[color:var(--accent-strong)]">
                  Token developerski: {devToken}
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-[#9d3d2d]">{message}</p>;
}
