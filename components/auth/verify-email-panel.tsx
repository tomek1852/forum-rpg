"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  requestEmailVerification,
  verifyEmail,
  getApiErrorMessage,
} from "@/lib/api";
import { requestEmailVerificationSchema } from "@/lib/validators";
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

type RequestValues = z.input<typeof requestEmailVerificationSchema>;

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token");
  const verificationStartedRef = useRef(false);

  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestEmailVerificationSchema),
    defaultValues: {
      email: "",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
  });

  const requestMutation = useMutation({
    mutationFn: requestEmailVerification,
  });

  useEffect(() => {
    if (!urlToken || verificationStartedRef.current) {
      return;
    }

    verificationStartedRef.current = true;
    verifyMutation.mutate({ token: urlToken });
  }, [urlToken, verifyMutation]);

  return (
    <div className="grid w-full max-w-3xl gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {urlToken ? "Aktywacja konta" : "Sprawdz skrzynke e-mail"}
          </CardTitle>
          <CardDescription>
            {urlToken
              ? "Jesli link jest poprawny, potwierdzimy konto automatycznie."
              : "Link aktywacyjny wysylamy na e-mail podany przy rejestracji."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-[color:var(--foreground-muted)]">
          {urlToken ? (
            <>
              {verifyMutation.isPending ? (
                <p>Trwa potwierdzanie konta. To powinno zajac tylko chwile.</p>
              ) : null}
              {verifyMutation.isSuccess ? (
                <>
                  <p className="font-semibold text-[color:var(--accent-strong)]">
                    {verifyMutation.data.message}
                  </p>
                  <p>
                    Po zatwierdzeniu przez moderatora przejdziesz do{" "}
                    <Link
                      className="font-semibold text-[color:var(--accent-strong)]"
                      href="/login"
                    >
                      logowania
                    </Link>
                    .
                  </p>
                </>
              ) : null}
              {verifyMutation.isError ? (
                <p className="text-[#9d3d2d]">
                  {getApiErrorMessage(verifyMutation.error)}
                </p>
              ) : null}
            </>
          ) : (
            <p>
              Otworz wiadomosc i kliknij link aktywacyjny. Jesli mail nie dotarl,
              mozesz od razu wyslac go ponownie nizej.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wyslij link ponownie</CardTitle>
          <CardDescription>
            Jesli wiadomosc nie dotarla albo link wygasl, podaj e-mail i wyslij nowa
            wiadomosc aktywacyjna.
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
              {requestMutation.isPending ? "Wysylanie..." : "Wyslij ponownie"}
            </Button>
          </form>
          {requestMutation.isSuccess ? (
            <div className="mt-6 rounded-3xl bg-[color:var(--surface)] p-4 text-sm leading-6 text-[color:var(--foreground-muted)]">
              <p>{requestMutation.data.message}</p>
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
