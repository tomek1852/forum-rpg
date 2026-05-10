import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Podaj email lub nazwę użytkownika."),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków."),
});

export const privateConversationSchema = z.object({
  participantId: z.uuid("Wybierz poprawnego odbiorcÄ™."),
  content: z
    .string()
    .max(5000, "Pierwsza wiadomoĹ›Ä‡ jest za dĹ‚uga.")
    .optional()
    .or(z.literal("")),
});

export const privateMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Wpisz treĹ›Ä‡ wiadomoĹ›ci.")
    .max(5000, "WiadomoĹ›Ä‡ jest za dĹ‚uga."),
});

export const registerSchema = z
  .object({
    email: z.email("Wpisz poprawny adres email."),
    username: z
      .string()
      .min(3, "Nazwa musi mieć co najmniej 3 znaki.")
      .max(24, "Nazwa może mieć maksymalnie 24 znaki.")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Użyj tylko liter, cyfr, podkreśleń i myślników.",
      ),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków."),
    confirmPassword: z.string().min(8, "Powtórz hasło."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Hasła muszą być takie same.",
    path: ["confirmPassword"],
  });

export const requestPasswordResetSchema = z.object({
  email: z.email("Wpisz poprawny adres email."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(12, "Wklej token resetu."),
  newPassword: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków."),
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
    .max(40, "Nazwa wyświetlana może mieć maksymalnie 40 znaków.")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(500, "Bio może mieć maksymalnie 500 znaków.")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("Podaj poprawny adres URL avatara.")
    .optional()
    .or(z.literal("")),
});

export const characterSchema = z.object({
  name: z.string().min(2, "Imię postaci musi mieć co najmniej 2 znaki."),
  worldId: z.uuid("Wybierz świat postaci."),
  title: z
    .string()
    .max(80, "Tytuł może mieć maksymalnie 80 znaków.")
    .optional()
    .or(z.literal("")),
  summary: z
    .string()
    .max(240, "Skrót opisu może mieć maksymalnie 240 znaków.")
    .optional()
    .or(z.literal("")),
  biography: z
    .string()
    .max(4000, "Biografia jest za długa.")
    .optional()
    .or(z.literal("")),
  appearance: z
    .string()
    .max(2000, "Opis wyglądu jest za długi.")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("Podaj poprawny adres URL avatara.")
    .optional()
    .or(z.literal("")),
  stats: z.record(z.string(), z.string()).default({}),
  isPublic: z.boolean().default(true),
});

export const worldSchema = z.object({
  name: z
    .string()
    .min(2, "Nazwa świata musi mieć co najmniej 2 znaki.")
    .max(80, "Nazwa świata może mieć maksymalnie 80 znaków."),
  slug: z
    .string()
    .max(80, "Slug może mieć maksymalnie 80 znaków.")
    .regex(/^[a-z0-9-]*$/, "Slug może zawierać tylko małe litery, cyfry i myślniki.")
    .optional()
    .or(z.literal("")),
  summary: z
    .string()
    .max(240, "Skrót opisu świata może mieć maksymalnie 240 znaków.")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(4000, "Opis świata jest za długi.")
    .optional()
    .or(z.literal("")),
});

export const worldLogSchema = z.object({
  title: z
    .string()
    .min(2, "Tytul wpisu musi miec co najmniej 2 znaki.")
    .max(120, "Tytul wpisu moze miec maksymalnie 120 znakow."),
  content: z
    .string()
    .min(1, "Wpisz tresc wpisu WorldLog.")
    .max(5000, "Wpis WorldLog jest za dlugi."),
});

const optionalIntegerField = z
  .string()
  .refine((value) => value.trim() === "" || /^-?\d+$/.test(value.trim()), {
    message: "Wpisz liczbę całkowitą albo zostaw pole puste.",
  })
  .optional()
  .or(z.literal(""));

const optionalNonNegativeIntegerField = z
  .string()
  .refine((value) => value.trim() === "" || /^\d+$/.test(value.trim()), {
    message: "Wpisz liczbę całkowitą dodatnią albo zostaw pole puste.",
  })
  .optional()
  .or(z.literal(""));

export const statDefinitionSchema = z.object({
  worldId: z.uuid("Wybierz świat."),
  key: z
    .string()
    .min(2, "Klucz statystyki musi mieć co najmniej 2 znaki.")
    .max(40, "Klucz statystyki może mieć maksymalnie 40 znaków.")
    .regex(/^[a-z0-9_]+$/, "Użyj tylko małych liter, cyfr i podkreśleń."),
  label: z
    .string()
    .min(2, "Nazwa statystyki musi mieć co najmniej 2 znaki.")
    .max(60, "Nazwa statystyki może mieć maksymalnie 60 znaków."),
  description: z
    .string()
    .max(240, "Opis statystyki może mieć maksymalnie 240 znaków.")
    .optional()
    .or(z.literal("")),
  valueType: z.enum(["NUMBER", "TEXT"]),
  minValue: optionalIntegerField,
  maxValue: optionalIntegerField,
  defaultNumericValue: optionalIntegerField,
  defaultTextValue: z
    .string()
    .max(120, "Domyślna wartość tekstowa może mieć maksymalnie 120 znaków.")
    .optional()
    .or(z.literal("")),
  isRequired: z.boolean().default(false),
  position: z
    .string()
    .refine((value) => value.trim() === "" || /^\d+$/.test(value.trim()), {
      message: "Pozycja musi być liczbą dodatnią lub zerem.",
    })
    .optional()
    .or(z.literal("")),
});

export const skillProposalSchema = z.object({
  name: z
    .string()
    .min(2, "Nazwa umiejętności musi mieć co najmniej 2 znaki.")
    .max(80, "Nazwa umiejętności może mieć maksymalnie 80 znaków."),
  description: z
    .string()
    .min(10, "Opis umiejętności musi mieć co najmniej 10 znaków.")
    .max(2000, "Opis umiejętności jest za długi."),
  mechanics: z
    .string()
    .max(1000, "Opis mechaniki jest za długi.")
    .optional()
    .or(z.literal("")),
  costs: z
    .string()
    .max(500, "Koszt lub cena umiejętności jest za długa.")
    .optional()
    .or(z.literal("")),
  limitations: z
    .string()
    .max(500, "Ograniczenia umiejętności są za długie.")
    .optional()
    .or(z.literal("")),
});

export const progressGrantSchema = z
  .object({
    expDelta: optionalNonNegativeIntegerField,
    phDelta: optionalNonNegativeIntegerField,
    reason: z
      .string()
      .min(3, "Podaj powód przyznania progresu.")
      .max(160, "Powód może mieć maksymalnie 160 znaków."),
    note: z
      .string()
      .max(500, "Notatka może mieć maksymalnie 500 znaków.")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (value) => Number(value.expDelta || 0) > 0 || Number(value.phDelta || 0) > 0,
    {
      message: "Przyznaj co najmniej 1 punkt EXP lub PH.",
      path: ["expDelta"],
    },
  );

export const forumThreadSchema = z.object({
  categoryId: z.uuid("Wybierz poprawną kategorię forum."),
  title: z
    .string()
    .min(4, "Tytuł wątku musi mieć co najmniej 4 znaki.")
    .max(120, "Tytuł wątku może mieć maksymalnie 120 znaków."),
  content: z
    .string()
    .min(8, "Pierwszy post musi mieć co najmniej 8 znaków.")
    .max(10000, "Post jest za długi."),
});

export const forumReplySchema = z.object({
  content: z
    .string()
    .min(1, "Wpisz treść odpowiedzi.")
    .max(10000, "Odpowiedź jest za długa."),
  quotePostId: z.uuid("Wybrany cytat jest niepoprawny.").optional(),
});

export const eventSchema = z
  .object({
    title: z
      .string()
      .min(2, "Tytul eventu musi miec co najmniej 2 znaki.")
      .max(120, "Tytul eventu moze miec maksymalnie 120 znakow."),
    summary: z
      .string()
      .max(240, "Skrot opisu eventu moze miec maksymalnie 240 znakow.")
      .optional()
      .or(z.literal("")),
    description: z
      .string()
      .max(4000, "Opis eventu jest za dlugi.")
      .optional()
      .or(z.literal("")),
    location: z
      .string()
      .max(160, "Miejsce eventu moze miec maksymalnie 160 znakow.")
      .optional()
      .or(z.literal("")),
    startsAt: z.string().min(1, "Wybierz termin rozpoczecia eventu."),
    endsAt: z.string().optional().or(z.literal("")),
    maxParticipants: z
      .string()
      .refine((value) => value.trim() === "" || /^\d+$/.test(value.trim()), {
        message: "Podaj dodatnia liczbe calkowita albo zostaw pole puste.",
      })
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (value) =>
      !value.endsAt ||
      !value.startsAt ||
      new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(),
    {
      message: "Data zakonczenia musi byc pozniejsza niz start eventu.",
      path: ["endsAt"],
    },
  );

export const eventParticipationSchema = z.object({
  characterId: z.uuid("Wybierz postac, ktora ma zapisac sie do eventu."),
  note: z
    .string()
    .max(500, "Notatka do zapisu moze miec maksymalnie 500 znakow.")
    .optional()
    .or(z.literal("")),
});
