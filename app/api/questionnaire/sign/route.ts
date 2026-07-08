// app/api/questionnaire/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAssuredSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const bodySchema = z.object({
  fileId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  const session = await getAssuredSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "fileId requis et doit être un CUID valide" }, { status: 400 });
  }

  const { fileId } = parsed.data;

  // Vérifier que le dossier appartient bien à l'assuré connecté
  const file = await prisma.healthFile.findFirst({
    where: { id: fileId, insuredId: session.insuredId },
  });

  if (!file) {
    return NextResponse.json({ error: "Dossier introuvable ou accès non autorisé" }, { status: 404 });
  }

  const signedAt = new Date();
  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + 4);

  // Mettre à jour le dossier : statut SIGNED, signedAt et validUntil
  await prisma.healthFile.update({
    where: { id: fileId },
    data: {
      status: "SIGNED",
      signedAt,
      validUntil,
    },
  });

  return NextResponse.json({
    success: true,
    signedAt: signedAt.toISOString(),
    validUntil: validUntil.toISOString(),
    mentions: "En certifiant et signant ce dossier, vous attestez sur l'honneur de l'exactitude des informations fournies, conformément aux articles L. 113-8 et L. 113-9 du Code des assurances. Toute réticence ou fausse déclaration intentionnelle peut entraîner la nullité de votre contrat d'assurance.",
  });
}
