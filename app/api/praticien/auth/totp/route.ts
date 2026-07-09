// app/api/praticien/auth/totp/route.ts
// Étape 2 de la connexion praticien : tempToken + code TOTP → session finale.
// C'est ici que la session praticien (cookie httpOnly) est ouverte.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyTempToken, verifyTotpCode } from "@/lib/auth/praticien-auth";
import { createSession } from "@/lib/auth/session";
import { logPraticienAccess } from "@/lib/audit";

const schema = z.object({
  tempToken: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "Code à 6 chiffres attendu"),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const payload = await verifyTempToken(parsed.data.tempToken);
  if (!payload) {
    return NextResponse.json({ error: "Session expirée, recommencez" }, { status: 401 });
  }

  const praticien = await prisma.praticien.findUnique({
    where: { id: payload.praticienId },
  });
  if (!praticien) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  // TODO (durcissement J7) : totpSecret est stocké en clair ; le déchiffrer ici
  // une fois le chiffrement au niveau champ implémenté.
  const ok = await verifyTotpCode(praticien.totpSecret, parsed.data.code);
  if (!ok) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
  }

  await createSession({
    praticienId: praticien.id,
    role: "praticien",
    praticienRole: praticien.role as "MEDECIN_CONSEIL" | "GESTIONNAIRE" | "ADMIN",
  });

  await logPraticienAccess({
    praticienId: praticien.id,
    action: "auth.login",
  });

  return NextResponse.json({ success: true });
}
