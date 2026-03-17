import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Podaj email lub nazwe uzytkownika."),
  password: z.string().min(8, "Haslo musi miec co najmniej 8 znakow."),
});

export const registerSchema = z
  .object({
    email: z.email("Wpisz poprawny adres email."),
    username: z
      .string()
      .min(3, "Nazwa musi miec co najmniej 3 znaki.")
      .max(24, "Nazwa moze miec maksymalnie 24 znaki.")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Uzyj tylko liter, cyfr, podkreslen i myslnikow.",
      ),
    password: z.string().min(8, "Haslo musi miec co najmniej 8 znakow."),
    confirmPassword: z.string().min(8, "Powtorz haslo."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Hasla musza byc takie same.",
    path: ["confirmPassword"],
  });

export const requestPasswordResetSchema = z.object({
  email: z.email("Wpisz poprawny adres email."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(12, "Wklej token resetu."),
  newPassword: z.string().min(8, "Haslo musi miec co najmniej 8 znakow."),
});
