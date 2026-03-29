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

export const verifyEmailSchema = z.object({
  token: z.string().min(16, "Wklej poprawny token weryfikacji."),
});

export const requestEmailVerificationSchema = z.object({
  email: z.email("Wpisz poprawny adres email."),
});

export const profileSchema = z.object({
  displayName: z
    .string()
    .max(40, "Nazwa wyswietlana moze miec maksymalnie 40 znakow.")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(500, "Bio moze miec maksymalnie 500 znakow.")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("Podaj poprawny adres URL avatara.")
    .optional()
    .or(z.literal("")),
});

export const characterSchema = z.object({
  name: z.string().min(2, "Imie postaci musi miec co najmniej 2 znaki."),
  title: z.string().max(80, "Tytul moze miec maksymalnie 80 znakow.").optional().or(z.literal("")),
  summary: z.string().max(240, "Skrot opisu moze miec maksymalnie 240 znakow.").optional().or(z.literal("")),
  biography: z.string().max(4000, "Biografia jest za dluga.").optional().or(z.literal("")),
  appearance: z.string().max(2000, "Opis wygladu jest za dlugi.").optional().or(z.literal("")),
  avatarUrl: z.string().url("Podaj poprawny adres URL avatara.").optional().or(z.literal("")),
  statsRaw: z
    .string()
    .refine((value) => {
      if (!value.trim()) {
        return true;
      }

      try {
        const parsed = JSON.parse(value);
        return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
      } catch {
        return false;
      }
    }, "Statystyki musza byc poprawnym obiektem JSON.")
    .optional()
    .or(z.literal("")),
  isPublic: z.boolean().default(true),
});

export const forumThreadSchema = z.object({
  categoryId: z.uuid("Wybierz poprawna kategorie forum."),
  title: z
    .string()
    .min(4, "Tytul watku musi miec co najmniej 4 znaki.")
    .max(120, "Tytul watku moze miec maksymalnie 120 znakow."),
  content: z
    .string()
    .min(8, "Pierwszy post musi miec co najmniej 8 znakow.")
    .max(10000, "Post jest za dlugi."),
});

export const forumReplySchema = z.object({
  content: z
    .string()
    .min(1, "Wpisz tresc odpowiedzi.")
    .max(10000, "Odpowiedz jest za dluga."),
  quotePostId: z.uuid("Wybrany cytat jest niepoprawny.").optional(),
});
