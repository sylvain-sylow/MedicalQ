// app/api/scoring/route.ts
// Endpoint : RÉSERVÉ PRATICIEN — jamais appelé côté assuré
// RÈGLE ABSOLUE : vérification du rôle serveur-side obligatoire
// Le test Playwright anti-fuite s'assure que cet endpoint n'est PAS accessible côté assuré

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getPraticienSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { computeScoring } from "@/lib/scoring/stars";
import { generateSynthesis } from "@/lib/scoring/synthesis";
import { engineVersion } from "@/lib/scoring/config";

export async function GET(request: NextRequest) {
  const session = await getPraticienSession();
  if (!session) {
    // Retourner 403 (et non 401) pour ne pas révéler l'existence de l'endpoint
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "fileId requis" }, { status: 400 });
  }

  // Vérifier que le dossier existe
  const file = await prisma.healthFile.findUnique({
    where: { id: fileId },
    include: {
      answers: { orderBy: { revision: "desc" } },
    },
  });

  if (!file) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  }

  // Build answer map (latest revision per questionId)
  const answersMap: Record<string, any> = {};
  for (const ans of file.answers) {
    if (!(ans.questionId in answersMap)) {
      answersMap[ans.questionId] = ans.value;
    }
  }

  // Compute scoring
  const scoring = computeScoring(answersMap, {});

  // Persist scoring to DB (upsert).
  // globalScore de record = score AJUSTÉ (après pénalité de comorbidité) : c'est
  // le chiffre de triage du médecin conseil. Le détail brut + comorbidités est
  // conservé dans perTheme pour l'audit et l'affichage back-office.
  const perThemePayload = {
    themes: scoring.perTheme,
    rawGlobalScore: scoring.globalScore,
    comorbidities: scoring.comorbidities,
  } as unknown as Prisma.InputJsonValue;
  await prisma.scoring.upsert({
    where: { fileId },
    create: {
      fileId,
      perTheme: perThemePayload,
      globalScore: scoring.adjustedGlobalScore,
      engineVersion: `${scoring.engineVersion}+${scoring.comorbidities.version}`,
    },
    update: {
      perTheme: perThemePayload,
      globalScore: scoring.adjustedGlobalScore,
      engineVersion: `${scoring.engineVersion}+${scoring.comorbidities.version}`,
      computedAt: new Date(),
    },
  });

  // Generate full synthesis report
  const synthesis = await generateSynthesis(fileId);

  return NextResponse.json(synthesis);
}
