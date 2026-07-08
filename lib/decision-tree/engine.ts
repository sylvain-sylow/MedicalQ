// lib/decision-tree/engine.ts
// Machine à états pure — getNextQuestion(answers) → Question | "END" | null
// RÈGLE : ne contient AUCUNE logique de scoring. Séparation stricte.
// Appelé côté serveur uniquement.

import {
  type Question,
  getQuestionById,
  getN3ModuleByTrigger,
  FIRST_QUESTION_ID,
  END_MARKER,
  N3_MODULES,
} from "./tree.config";
import { computeIMC, imcTriggersObesiteModule } from "./triggers";

export type AnswerMap = Record<string, unknown>;

export interface EngineResult {
  question: Question;
  progress: ProgressInfo;
}

export interface ProgressInfo {
  /** Grande étape courante (jamais un % précis) */
  stage: "identite" | "general" | "systemes" | "modules" | "modes_vie" | "signature";
  /** Numéro de l'étape sur le total de grandes étapes */
  stageIndex: number;
  stageTotalCount: number;
}

/**
 * Retourne la prochaine question à poser, ou null si le parcours est terminé.
 * Pure function : aucun effet de bord, aucun accès DB.
 */
export function getNextQuestion(answers: AnswerMap): EngineResult | null {
  // 1. Trouver la dernière question répondue
  const answeredIds = Object.keys(answers);

  if (answeredIds.length === 0) {
    const q = getQuestionById(FIRST_QUESTION_ID)!;
    return { question: q, progress: makeProgress("identite") };
  }

  // 2. Déterminer la question actuelle et sa suivante
  const nextId = resolveNext(answers, answeredIds);

  if (nextId === null || nextId === END_MARKER) return null;

  const question = getQuestionById(nextId);
  if (!question) return null;

  return { question, progress: makeProgress(stageOf(nextId)) };
}

// ─── Résolution de la prochaine question ─────────────────────────────────────

function resolveNext(answers: AnswerMap, answeredIds: string[]): string | null {
  const lastId = answeredIds[answeredIds.length - 1];
  const lastQ = getQuestionById(lastId);

  // Si on est encore dans N3 (q11 répondu mais modes de vie pas encore commencés)
  if (
    answeredIds.includes("q11_systemes") &&
    !answeredIds.some((id) => id.startsWith("q_modes_vie"))
  ) {
    const n3Next = resolveN3Next(answers, answeredIds);
    // Si N3 a une prochaine question, la retourner
    // Si N3 renvoie modes_vie, tomber dans le flux normal
    if (n3Next && !n3Next.startsWith("q_modes_vie")) return n3Next;
    if (n3Next) {
      // N3 terminé, démarrer modes de vie
      if (!lastQ) return n3Next;
    }
  }

  if (!lastQ) return null;

  // Gestion IMC spéciale pour q01_silhouette_poids
  if (lastId === "q01_silhouette_poids") {
    const imc = computeIMC(
      Number(answers["q01_silhouette_poids"]),
      Number(answers["q01_silhouette_taille"])
    );
    if (imcTriggersObesiteModule(imc) && lastQ.next?.["obese"]) {
      return lastQ.next["obese"];
    }
  }

  if (!lastQ.next) return END_MARKER;

  const lastValue = String(answers[lastId] ?? "");
  const nextId = lastQ.next[lastValue] ?? lastQ.next["default"];

  // next[value] = null signifie fin explicite (ex: consentement refusé)
  if (nextId === null) return null;

  return nextId ?? END_MARKER;
}

/**
 * Résout la file des modules N3 déclenchés par q11.
 * Les modules sont traités dans l'ordre de N3_MODULES.
 */
function resolveN3Next(answers: AnswerMap, answeredIds: string[]): string | null {
  const selectedSystems = (answers["q11_systemes"] as string[]) ?? [];

  if (selectedSystems.includes("aucun")) {
    // Pas de module N3 → modes de vie
    return "q_modes_vie_sport";
  }

  // IMC >= 30 → module obésité s'ajoute implicitement
  const imc = computeIMC(
    Number(answers["q01_silhouette_poids"]),
    Number(answers["q01_silhouette_taille"])
  );
  const triggers = [...selectedSystems];
  if (imcTriggersObesiteModule(imc) && !triggers.includes("__imc_obese__")) {
    triggers.push("__imc_obese__");
  }

  // Construire la liste ordonnée de premières questions de modules
  const moduleFirstQs = N3_MODULES
    .filter((m) => triggers.includes(m.trigger))
    .map((m) => m.firstQuestionId);

  // Trouver le premier module non encore commencé
  for (const firstQId of moduleFirstQs) {
    if (!answeredIds.includes(firstQId)) {
      return firstQId;
    }
    // Module déjà commencé → trouver la prochaine question non répondue dans ce module
    const inModuleNext = walkModule(firstQId, answers, answeredIds);
    if (inModuleNext !== null) return inModuleNext;
  }

  // Tous les modules N3 terminés → modes de vie
  return "q_modes_vie_sport";
}

/**
 * Parcourt un module à partir de sa première question pour trouver la prochaine
 * non répondue. Arrête si la question courante n'a pas de successeur dans ce module.
 */
function walkModule(
  startId: string,
  answers: AnswerMap,
  answeredIds: string[],
  maxDepth = 50
): string | null {
  let currentId = startId;
  for (let i = 0; i < maxDepth; i++) {
    if (!answeredIds.includes(currentId)) return currentId;
    const q = getQuestionById(currentId);
    if (!q || !q.next) return null;
    const val = String(answers[currentId] ?? "");
    const nextId = q.next[val] ?? q.next["default"] ?? null;
    if (!nextId || nextId === END_MARKER) return null;
    // Si la suivante appartient à un autre module ou au niveau supérieur → stop
    if (nextId.startsWith("q_modes_vie") || nextId.startsWith("q11")) return null;
    currentId = nextId;
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Stage = ProgressInfo["stage"];

function stageOf(qId: string): Stage {
  if (qId.startsWith("q00_")) return "identite";
  if (qId.startsWith("q01_") || qId === "q11_systemes") return "general";
  if (qId.startsWith("q3_")) return "modules";
  if (qId.startsWith("q_modes_vie")) return "modes_vie";
  return "general";
}

const STAGES: Stage[] = ["identite", "general", "systemes", "modules", "modes_vie", "signature"];

function makeProgress(stage: Stage): ProgressInfo {
  const stageIndex = STAGES.indexOf(stage) + 1;
  return { stage, stageIndex, stageTotalCount: STAGES.length };
}
