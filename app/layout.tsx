// app/layout.tsx
// Root layout — medical.sylow.co

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sylow & Co — Déclaration de santé",
    template: "%s | Sylow & Co",
  },
  description:
    "Votre déclaration de santé pour l'assurance emprunteur — simple, sécurisée et confidentielle.",
  metadataBase: new URL("https://medical.sylow.co"),
  robots: { index: false, follow: false }, // données de santé — ne pas indexer
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
