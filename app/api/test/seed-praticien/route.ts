// app/api/test/seed-praticien/route.ts
// Seed d'un compte médecin conseil pour le développement / la recette.
// Dev/test uniquement — jamais actif en production (cf. garde ci-dessous).

import { NextRequest, NextResponse } from "next/server";
import { generate } from "otplib";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, generateTotpSecret } from "@/lib/auth/praticien-auth";

// Secret TOTP fixe en dev pour des codes reproductibles entre redémarrages.
// ≥16 octets requis par otplib v13 (32 caractères base32 = 20 octets / 160 bits).
const DEV_TOTP_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
const DEV_EMAIL = "medecin@sylow.co";
const DEV_PASSWORD = "Sylow2026!";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development" && process.env.NEXT_PUBLIC_E2E_TESTING !== "true") {
    return NextResponse.json({ error: "Non autorisé hors développement/test" }, { status: 403 });
  }

  const passwordHash = await hashPassword(DEV_PASSWORD);
  const { uri } = generateTotpSecret(DEV_EMAIL);

  const praticien = await prisma.praticien.upsert({
    where: { email: DEV_EMAIL },
    create: {
      email: DEV_EMAIL,
      passwordHash,
      totpSecret: DEV_TOTP_SECRET,
      role: "MEDECIN_CONSEIL",
    },
    update: { passwordHash, totpSecret: DEV_TOTP_SECRET },
  });

  // Code TOTP courant, pratique pour tester la connexion tout de suite.
  const currentCode = await generate({ secret: DEV_TOTP_SECRET });

  return NextResponse.json({
    success: true,
    praticienId: praticien.id,
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
    totpSecret: DEV_TOTP_SECRET,
    otpauthUri: uri.replace(/secret=[^&]+/, `secret=${DEV_TOTP_SECRET}`),
    currentCode,
  });
}
