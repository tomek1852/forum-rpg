import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Forum RPG",
  description: "Aplikacja PBF z autoryzacją, panelem gracza i fundamentem pod dalsze fazy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="bg-[color:var(--background)] text-[color:var(--foreground)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
