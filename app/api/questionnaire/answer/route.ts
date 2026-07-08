// app/api/questionnaire/answer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAssuredSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const bodySchema = z.object({
  fileId:     z.string().cuid(),
  questionId: z.string().min(1),
  value:      z.unknown(),
});

export async function POST(request: NextRequest) {
  const session = await getAssuredSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { fileId, questionId, value } = parsed.data;

  // Vérifier que le dossier appartient à cet assuré
  const file = await prisma.healthFile.findFirst({
    where: { id: fileId, insuredId: session.insuredId },
  });
  if (!file) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  // Calculer la prochaine révision
  const last = await prisma.answer.findFirst({
    where: { fileId, questionId },
    orderBy: { revision: "desc" },
  });
  const revision = last ? last.revision + 1 : 1;

  // Autosave immédiat — chiffrement AES-256-GCM au J7
  await prisma.answer.create({
    data: { fileId, questionId, value: value as object, revision },
  });

  // Mettre à jour le statut du dossier
  await prisma.healthFile.update({
    where: { id: fileId },
    data: { status: "IN_PROGRESS" },
  });

  return NextResponse.json({ saved: true, revision });
}
