// lib/praticien/dossiers.ts
// Agrégation des dossiers pour le back-office médecin conseil.
// Back-office UNIQUEMENT — n'est jamais importé par une route/écran assuré.

import { prisma } from "../db/prisma";
import { computeScoring } from "../scoring/stars";
import { generateSynthesis, type SynthesisReport } from "../scoring/synthesis";

export interface DossierSummary {
  id: string;
  insuredName: string;
  status: string;
  signedAt: string | null;
  validUntil: string | null;
  /** Score global ajusté (après comorbidités) — chiffre de triage. */
  globalScore: number;
  /** Score brut (moyenne géométrique) — pour référence. */
  rawGlobalScore: number;
  /** Rubriques à ≤ 2★ (alertes de matérialité). */
  weakThemes: string[];
  /** Nombre de couples de pathologies défavorables détectés. */
  comorbidityCount: number;
  /** Couple le plus défavorable (libellé), le cas échéant. */
  worstComorbidity: string | null;
  /** Cluster syndrome métabolique détecté. */
  metabolicCluster: boolean;
  updatedAt: string;
}

function buildAnswersMap(
  answers: Array<{ questionId: string; value: unknown }>
): Record<string, any> {
  const map: Record<string, any> = {};
  for (const a of answers) {
    if (!(a.questionId in map)) map[a.questionId] = a.value;
  }
  return map;
}

/** Liste tous les dossiers avec leur score calculé à la volée, triés du plus à risque au moins à risque. */
export async function listDossiers(): Promise<DossierSummary[]> {
  const files = await prisma.healthFile.findMany({
    include: {
      insured: true,
      answers: { orderBy: { revision: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  type FileRow = {
    id: string;
    status: string;
    signedAt: Date | null;
    validUntil: Date | null;
    updatedAt: Date;
    insured: { firstName: string; lastName: string };
    answers: Array<{ questionId: string; value: unknown }>;
  };

  const summaries: DossierSummary[] = (files as FileRow[]).map((f) => {
    const answersMap = buildAnswersMap(f.answers);
    const scoring = computeScoring(answersMap, {});
    const weakThemes = Object.entries(scoring.perTheme)
      .filter(([, v]) => v <= 2)
      .map(([k]) => k);

    return {
      id: f.id,
      insuredName: `${f.insured.firstName} ${f.insured.lastName}`.trim(),
      status: f.status,
      signedAt: f.signedAt ? f.signedAt.toISOString() : null,
      validUntil: f.validUntil ? f.validUntil.toISOString() : null,
      globalScore: scoring.adjustedGlobalScore,
      rawGlobalScore: scoring.globalScore,
      weakThemes,
      comorbidityCount: scoring.comorbidities.triggered.length,
      worstComorbidity: scoring.comorbidities.triggered[0]?.label ?? null,
      metabolicCluster: scoring.comorbidities.metabolicCluster !== null,
      updatedAt: f.updatedAt.toISOString(),
    };
  });

  // Tri par priorité : scores les plus faibles d'abord (spec § 10.1).
  summaries.sort((a, b) => a.globalScore - b.globalScore);
  return summaries;
}

export interface DossierDetail {
  id: string;
  insuredName: string;
  age: number | null;
  status: string;
  synthesis: SynthesisReport;
}

function ageFromBirthDate(birthDate: Date): number {
  const diff = Date.now() - birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

/** Détail complet d'un dossier pour la vue médecin conseil (identité + synthèse scorée). */
export async function getDossierDetail(fileId: string): Promise<DossierDetail | null> {
  const file = await prisma.healthFile.findUnique({
    where: { id: fileId },
    include: { insured: true },
  });
  if (!file) return null;

  const synthesis = await generateSynthesis(fileId);

  return {
    id: file.id,
    insuredName: `${file.insured.firstName} ${file.insured.lastName}`.trim(),
    age: file.insured.birthDate ? ageFromBirthDate(file.insured.birthDate) : null,
    status: file.status,
    synthesis,
  };
}
