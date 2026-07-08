// app/api/auth/otp/verify/route.ts
// Endpoint : POST /api/auth/otp/verify
// Vérifie un OTP et crée une session JWT httpOnly

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const bodySchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
  code:  z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { phone, code } = parsed.data;

    const result = await verifyOtp(phone, code);

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Trouver ou créer l'assuré
    let insured = await prisma.insured.findUnique({ where: { phone } });

    if (!insured) {
      // Nouvel assuré — création minimale, le reste est complété lors du dossier
      insured = await prisma.insured.create({
        data: {
          phone,
          firstName:  "",
          lastName:   "",
          birthDate:  new Date("1900-01-01"), // placeholder — mis à jour lors du dossier
          birthPlace: "",
        },
      });
    }

    // Créer la session JWT httpOnly
    await createSession({
      insuredId: insured.id,
      role: "assure",
    });

    return NextResponse.json({
      success: true,
      isNew: insured.firstName === "", // indique si l'assuré doit compléter son profil
    });
  } catch (err) {
    console.error("[POST /api/auth/otp/verify]", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
