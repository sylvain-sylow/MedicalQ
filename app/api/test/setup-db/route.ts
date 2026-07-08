// app/api/test/setup-db/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
  // Sécurité : n'autoriser cette API qu'en développement local ou durant les tests E2E
  if (process.env.NODE_ENV !== "development" && process.env.NEXT_PUBLIC_E2E_TESTING !== "true") {
    return NextResponse.json({ error: "Non autorisé hors développement/test" }, { status: 403 });
  }

  const phone = "+33699887766";
  const code = "777888";
  const fileId = "cld-test-file-id-j4";

  const hashedCode = createHash("sha256").update(code).digest("hex");

  try {
    // Nettoyer
    await prisma.otpSession.deleteMany({ where: { phone } });
    await prisma.document.deleteMany({ where: { fileId } });
    await prisma.answer.deleteMany({ where: { fileId } });
    await prisma.healthFile.deleteMany({ where: { id: fileId } });
    await prisma.insured.deleteMany({ where: { phone } });

    // Créer l'assuré
    const insured = await prisma.insured.create({
      data: {
        phone,
        firstName: "Sophie",
        lastName: "Martin",
        birthDate: new Date("1990-04-12"),
        birthPlace: "Marseille",
      },
    });

    // Créer son dossier médical
    await prisma.healthFile.create({
      data: {
        id: fileId,
        insuredId: insured.id,
        status: "DRAFT",
        lemoineExempt: false,
      },
    });

    // Insérer des réponses préalables pour arriver direct à l'hospitalisation motif
    const answers = [
      { questionId: "q00_prenom", value: "Sophie" },
      { questionId: "q00_nom", value: "Martin" },
      { questionId: "q00_naissance_date", value: "1990-04-12" },
      { questionId: "q00_naissance_lieu", value: "Marseille" },
      { questionId: "q00_lemoine", value: "non" },
      { questionId: "q00_consentement_sante", value: "oui" },
      { questionId: "q00_aeras", value: "non" },
      { questionId: "q01_silhouette_taille", value: 168 },
      { questionId: "q01_silhouette_poids", value: 60 },
      { questionId: "q01_tabac", value: "jamais" },
      { questionId: "q01_alcool", value: "non" },
      { questionId: "q01_tension", value: "non" },
      { questionId: "q01_cholesterol", value: "non" },
      { questionId: "q01_diabete", value: "non" },
      { questionId: "q01_hospitalisation", value: "oui" },
    ];

    for (const ans of answers) {
      await prisma.answer.create({
        data: {
          fileId,
          questionId: ans.questionId,
          value: ans.value,
          revision: 1,
        },
      });
    }

    // Créer une session OTP active
    await prisma.otpSession.create({
      data: {
        phone,
        code: hashedCode,
        expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 min de validité
      },
    });

    return NextResponse.json({ success: true, message: "Base E2E initialisée avec succès" });
  } catch (err: any) {
    console.error("[POST /api/test/setup-db]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
