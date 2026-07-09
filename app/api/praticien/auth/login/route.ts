// app/api/praticien/auth/login/route.ts
// Étape 1 de la connexion praticien : email + mot de passe → tempToken (5 min).
// L'accès n'est PAS ouvert ici : il faut ensuite valider le code TOTP (étape 2).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword, createTempToken } from "@/lib/auth/praticien-auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const praticien = await prisma.praticien.findUnique({
    where: { email: parsed.data.email },
  });

  // Message générique : ne pas révéler si l'email existe.
  const genericError = NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  if (!praticien) return genericError;

  try {
    const ok = await verifyPassword(parsed.data.password, praticien.passwordHash);
    if (!ok) return genericError;

    const tempToken = await createTempToken(praticien.id);
    return NextResponse.json({ tempToken });
  } catch (e) {
    console.error("[praticien/auth/login] error:", e);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
