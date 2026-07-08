// lib/scoring/synthesis.ts
import { prisma } from "../db/prisma";
import { computeScoring, ScoringResult } from "./stars";

export interface SynthesisReport {
  fileId: string;
  status: string;
  scoring: ScoringResult;
  missingDocuments: Array<{
    id: string;
    label: string;
    description: string;
    questionId: string;
  }>;
  signature: {
    isSigned: boolean;
    signedAt: string | null;
    validUntil: string | null;
    legalNotice: string;
  } | null;
}

export async function generateSynthesis(fileId: string): Promise<SynthesisReport> {
  const file = await prisma.healthFile.findUnique({
    where: { id: fileId },
    include: {
      answers: {
        orderBy: { revision: "desc" },
      },
      documents: true,
    },
  });

  if (!file) {
    throw new Error("Dossier introuvable");
  }

  // Build answer map (latest revision per questionId)
  const answersMap: Record<string, any> = {};
  for (const ans of file.answers) {
    if (!(ans.questionId in answersMap)) {
      answersMap[ans.questionId] = ans.value;
    }
  }

  // Retrieve Level 3 severities if stored.
  // In the DB schema or logic, Level 3 modules might store answers or have their own logic.
  // For the purpose of synthesis scoring, we can scan answers for Level 3 severity inputs if they exist,
  // or default to empty n3Severities.
  const n3Severities: Record<string, number> = {};
  
  // E.g., if we have specific Level 3 answers in answersMap, we could map them.
  // If we have custom overrides, we can look up if there are any answers starting with `q3_` that imply scoring.
  // But standard way is to read the computed stars.
  const scoring = computeScoring(answersMap, n3Severities);

  // Compute missing documents checklist
  const getAnswerValue = (qId: string) => answersMap[qId];

  const documentRules = [
    {
      id: "rec_diabete",
      questionId: "q01_diabete",
      requiredIf: getAnswerValue("q01_diabete") === "oui",
      label: "Compte-rendu d'endocrinologie / Diabète",
      description: "Requis pour l'analyse du diabète déclaré.",
    },
    {
      id: "rec_hosp",
      questionId: "q01_hospitalisation",
      requiredIf: getAnswerValue("q01_hospitalisation") === "oui",
      label: "Dernier compte-rendu d'hospitalisation",
      description: "Requis pour l'analyse de l'hospitalisation récente déclarée.",
    },
    {
      id: "rec_arret",
      questionId: "q01_arret_travail",
      requiredIf: getAnswerValue("q01_arret_travail") === "oui",
      label: "Certificat médical d'arrêt de travail",
      description: "Requis pour l'analyse de l'arrêt de travail déclaré.",
    },
    {
      id: "rec_psy",
      questionId: "q11_systemes",
      requiredIf: Array.isArray(getAnswerValue("q11_systemes")) && getAnswerValue("q11_systemes").includes("psy"),
      label: "Certificat médical du psychiatre / psychologue",
      description: "Requis pour l'analyse de l'affection psychologique déclarée.",
    },
    {
      id: "rec_coeur",
      questionId: "q11_systemes",
      requiredIf: Array.isArray(getAnswerValue("q11_systemes")) && getAnswerValue("q11_systemes").includes("coeur"),
      label: "Dernier bilan cardiologique avec ECG",
      description: "Requis pour l'analyse de l'affection cardiovasculaire déclarée.",
    },
  ];

  const activeDocRequirements = documentRules.filter((r) => r.requiredIf);

  const missingDocuments = activeDocRequirements.filter((req) => {
    // Check if any uploaded document is clean (virusScan === CLEAN) for this questionId
    return !file.documents.some((doc: { questionId: string | null; virusScan: string }) =>
      doc.questionId === req.questionId && doc.virusScan !== "INFECTED"
    );
  }).map((req) => ({
    id: req.id,
    label: req.label,
    description: req.description,
    questionId: req.questionId,
  }));

  const signature = {
    isSigned: file.status === "SIGNED",
    signedAt: file.signedAt ? file.signedAt.toISOString() : null,
    validUntil: file.validUntil ? file.validUntil.toISOString() : null,
    legalNotice: "Conformément aux articles L. 113-8 et L. 113-9 du Code des assurances, cette déclaration sur l'honneur engage la validité du contrat d'assurance.",
  };

  return {
    fileId,
    status: file.status,
    scoring,
    missingDocuments,
    signature,
  };
}
