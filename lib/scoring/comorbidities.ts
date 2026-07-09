// lib/scoring/comorbidities.ts
// ─────────────────────────────────────────────────────────────────────────────
// Couche de COMORBIDITÉ — back-office UNIQUEMENT (jamais exposée à l'assuré,
// jamais dans un endpoint du parcours client, jamais dans le bundle).
//
// La moyenne géométrique par rubrique (lib/scoring/stars.ts) traite chaque
// système de façon indépendante. Or, en médecine d'assurance, ce sont surtout
// certains COUPLES de pathologies/facteurs de risque qui aggravent le pronostic
// de façon MULTIPLICATIVE (le risque du couple > somme des risques isolés).
//
// Ce module :
//   1. dérive une liste de « facteurs de risque » à partir des réponses ;
//   2. identifie les couples les plus défavorables (matrice pondérée éditable) ;
//   3. détecte le cluster « syndrome métabolique » (≥3 facteurs métaboliques) ;
//   4. renvoie une pénalité en étoiles appliquée au score global.
//
// Toutes les pénalités sont exprimées en « étoiles » (échelle 1–5) et bornées :
// une comorbidité ne peut jamais faire remonter un score, seulement l'abaisser.
// ─────────────────────────────────────────────────────────────────────────────

export type RiskFactor =
  | "obesite"
  | "hta"
  | "diabete"
  | "tabagisme"
  | "cardiopathie"
  | "dyslipidemie"
  | "renal"
  | "respiratoire"
  | "cancer"
  | "psy"
  | "alcoolisme"
  | "neuro";

/** Libellés lisibles (back-office). */
export const RISK_FACTOR_LABELS: Record<RiskFactor, string> = {
  obesite: "Obésité (IMC ≥ 30)",
  hta: "Hypertension artérielle",
  diabete: "Diabète",
  tabagisme: "Tabagisme actif (≥ 10/j)",
  cardiopathie: "Cardiopathie / affection cardiovasculaire",
  dyslipidemie: "Dyslipidémie (cholestérol)",
  renal: "Atteinte rénale",
  respiratoire: "Affection respiratoire",
  cancer: "Antécédent de cancer",
  psy: "Affection psychiatrique",
  alcoolisme: "Consommation d'alcool à risque",
  neuro: "Affection neurologique",
};

export interface ComorbidityRule {
  pair: [RiskFactor, RiskFactor];
  /** Pénalité en étoiles retirée au score global quand le couple est présent (0–1.5). */
  penalty: number;
  label: string;
  rationale: string;
}

// Version de la matrice — stockée avec le dossier (comme engineVersion) pour la
// traçabilité : une mise à jour de la matrice ne recalcule jamais un dossier déjà
// scoré sans action explicite.
export const comorbidityVersion = "comorbidity-1.0";

// ─────────────────────────────────────────────────────────────────────────────
// Matrice des couples les plus défavorables, triés par gravité (penalty ↓).
// Source : littérature cardiovasculaire / syndrome métabolique / oncologie.
// Éditable à terme par le médecin conseil (cf. /praticien/admin/bareme).
// ─────────────────────────────────────────────────────────────────────────────
export const COMORBIDITY_RULES: ComorbidityRule[] = [
  {
    pair: ["diabete", "cardiopathie"],
    penalty: 1.5,
    label: "Diabète + cardiopathie",
    rationale:
      "Coronaropathie du diabétique : le diabète confère un sur-risque coronarien majeur ; associé à une cardiopathie déclarée, le pronostic est très défavorable.",
  },
  {
    pair: ["diabete", "hta"],
    penalty: 1.25,
    label: "Diabète + hypertension",
    rationale:
      "Association centrale du risque cardio-rénal : atteinte multiplicative micro/macro-vasculaire (néphropathie, rétinopathie, AVC).",
  },
  {
    pair: ["tabagisme", "diabete"],
    penalty: 1.25,
    label: "Tabac + diabète",
    rationale:
      "Athérosclérose accélérée et artériopathie : le tabac aggrave fortement les complications vasculaires du diabète.",
  },
  {
    pair: ["tabagisme", "hta"],
    penalty: 1.0,
    label: "Tabac + hypertension",
    rationale:
      "Risque coronarien et d'AVC multiplicatif ; deux déterminants majeurs et cumulatifs de la maladie cardiovasculaire.",
  },
  {
    pair: ["hta", "cardiopathie"],
    penalty: 1.0,
    label: "Hypertension + cardiopathie",
    rationale:
      "Cardiopathie hypertensive et insuffisance cardiaque : l'HTA est un facteur d'aggravation direct d'une cardiopathie existante.",
  },
  {
    pair: ["diabete", "renal"],
    penalty: 1.0,
    label: "Diabète + atteinte rénale",
    rationale:
      "Néphropathie diabétique : évolution possible vers l'insuffisance rénale chronique ; marqueur de gravité systémique.",
  },
  {
    pair: ["cancer", "tabagisme"],
    penalty: 1.0,
    label: "Cancer + tabac",
    rationale:
      "Sur-risque de récidive et de second cancer ; pronostic défavorable, notamment pour les cancers tabac-dépendants.",
  },
  {
    pair: ["diabete", "obesite"],
    penalty: 0.75,
    label: "Diabète + obésité",
    rationale:
      "Cœur du syndrome métabolique : insulinorésistance et inflammation chronique aggravant le risque cardiovasculaire.",
  },
  {
    pair: ["tabagisme", "respiratoire"],
    penalty: 0.75,
    label: "Tabac + affection respiratoire",
    rationale:
      "Aggravation d'une BPCO/asthme et déclin accéléré de la fonction respiratoire.",
  },
  {
    pair: ["psy", "alcoolisme"],
    penalty: 0.75,
    label: "Trouble psychiatrique + alcool",
    rationale:
      "Comorbidité addictive : majoration du risque suicidaire, de rechute et de mauvaise observance thérapeutique.",
  },
  {
    pair: ["hta", "renal"],
    penalty: 0.75,
    label: "Hypertension + atteinte rénale",
    rationale:
      "Cercle vicieux néphro-vasculaire : l'HTA accélère la dégradation rénale et réciproquement.",
  },
  {
    pair: ["obesite", "respiratoire"],
    penalty: 0.5,
    label: "Obésité + affection respiratoire",
    rationale:
      "Syndrome d'apnées du sommeil / obésité-hypoventilation : surcharge cardio-respiratoire.",
  },
  {
    pair: ["obesite", "hta"],
    penalty: 0.5,
    label: "Obésité + hypertension",
    rationale: "Charge cardiovasculaire cumulée ; composante du syndrome métabolique.",
  },
  {
    pair: ["tabagisme", "dyslipidemie"],
    penalty: 0.5,
    label: "Tabac + dyslipidémie",
    rationale: "Athérogenèse accélérée par l'association tabac / cholestérol élevé.",
  },
  {
    pair: ["diabete", "neuro"],
    penalty: 0.5,
    label: "Diabète + affection neurologique",
    rationale:
      "Sur-risque d'AVC et de neuropathie ; marqueur d'atteinte vasculaire diffuse.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Cluster « syndrome métabolique » : la co-occurrence de ≥3 facteurs parmi
// {obésité, HTA, diabète, dyslipidémie} déclenche une pénalité additionnelle,
// car le risque cardiovasculaire du cluster dépasse celui des couples pris isolément.
// ─────────────────────────────────────────────────────────────────────────────
export const METABOLIC_FACTORS: RiskFactor[] = ["obesite", "hta", "diabete", "dyslipidemie"];
export const METABOLIC_CLUSTER_MIN = 3;
export const METABOLIC_CLUSTER_PENALTY = 0.75;

// Plafond global de pénalité de comorbidité (en étoiles).
export const COMORBIDITY_PENALTY_CAP = 2.5;

export interface TriggeredComorbidity {
  pair: [RiskFactor, RiskFactor];
  penalty: number;
  label: string;
  rationale: string;
}

export interface ComorbidityImpact {
  version: string;
  /** Facteurs de risque détectés chez l'assuré. */
  factors: RiskFactor[];
  /** Couples défavorables déclenchés, triés par gravité décroissante. */
  triggered: TriggeredComorbidity[];
  /** Cluster syndrome métabolique, le cas échéant. */
  metabolicCluster: { factors: RiskFactor[]; penalty: number } | null;
  /** Pénalité totale appliquée au score global (bornée par COMORBIDITY_PENALTY_CAP). */
  totalPenalty: number;
}

/**
 * Dérive les facteurs de risque à partir des inputs normalisés (mapAnswersToRuleInputs)
 * et des réponses brutes. Tolérant : toute donnée absente = facteur non présent.
 */
export function detectRiskFactors(
  inputs: Record<string, any>,
  answers: Record<string, any>
): Set<RiskFactor> {
  const factors = new Set<RiskFactor>();
  const systems: string[] = Array.isArray(answers["q11_systemes"]) ? answers["q11_systemes"] : [];
  const isYes = (v: any) => String(v).toLowerCase().trim() === "oui" || v === true;

  // Obésité — IMC ≥ 30 (repère OMS, indépendant de la bande de tolérance du score).
  const imc = Number(inputs["N1_IMC"]);
  if (!isNaN(imc) && imc >= 30) factors.add("obesite");

  // HTA — déclaration OU tension mesurée au-delà des seuils cliniques.
  const sys = Number(inputs["N1_TA_SYS"]);
  const dia = Number(inputs["N1_TA_DIA"]);
  if (
    isYes(answers["q01_tension"]) ||
    isYes(answers["q01_tension_traitement"]) ||
    (!isNaN(sys) && sys >= 140) ||
    (!isNaN(dia) && dia >= 90)
  ) {
    factors.add("hta");
  }

  // Diabète — déclaration explicite OU système endocrinien orienté diabète.
  if (isYes(answers["q01_diabete"]) || isYes(answers["N2_DIABETE"])) factors.add("diabete");

  // Tabagisme actif significatif (≥ 10 cig/j → grille 3★ ou pire).
  const tabac = Number(inputs["N1_TABAC"]);
  if (!isNaN(tabac) && tabac >= 10) factors.add("tabagisme");

  // Alcool à risque (grille ≥ 35 verres/sem → 2★ ou pire) ou substances régulières.
  const alcool = Number(inputs["N1_ALCOOL"]);
  if (!isNaN(alcool) && alcool >= 35) factors.add("alcoolisme");
  if (String(inputs["N1_SUBST"]).toLowerCase().trim() === "régulier") factors.add("alcoolisme");

  // Dyslipidémie — déclaration cholestérol.
  if (isYes(answers["q01_cholesterol"]) || isYes(answers["N2_CHOLESTEROL"])) {
    factors.add("dyslipidemie");
  }

  // Systèmes déclarés (Q11).
  if (systems.includes("coeur")) factors.add("cardiopathie");
  if (systems.includes("reins")) factors.add("renal");
  if (systems.includes("respiratoire")) factors.add("respiratoire");
  if (systems.includes("cancer")) factors.add("cancer");
  if (systems.includes("psy")) factors.add("psy");
  if (systems.includes("neurologie")) factors.add("neuro");
  if (systems.includes("diabete")) factors.add("diabete");

  return factors;
}

/**
 * Évalue l'impact des comorbidités à partir des facteurs de risque.
 * Renvoie les couples déclenchés, le cluster métabolique et la pénalité totale bornée.
 */
export function assessComorbidities(
  inputs: Record<string, any>,
  answers: Record<string, any>
): ComorbidityImpact {
  const factorSet = detectRiskFactors(inputs, answers);

  const triggered: TriggeredComorbidity[] = COMORBIDITY_RULES.filter(
    (rule) => factorSet.has(rule.pair[0]) && factorSet.has(rule.pair[1])
  )
    .map((rule) => ({
      pair: rule.pair,
      penalty: rule.penalty,
      label: rule.label,
      rationale: rule.rationale,
    }))
    .sort((a, b) => b.penalty - a.penalty);

  // Cluster métabolique.
  const metabolicPresent = METABOLIC_FACTORS.filter((f) => factorSet.has(f));
  const metabolicCluster =
    metabolicPresent.length >= METABOLIC_CLUSTER_MIN
      ? { factors: metabolicPresent, penalty: METABOLIC_CLUSTER_PENALTY }
      : null;

  const rawPenalty =
    triggered.reduce((sum, t) => sum + t.penalty, 0) + (metabolicCluster?.penalty ?? 0);

  const totalPenalty = Math.min(rawPenalty, COMORBIDITY_PENALTY_CAP);

  return {
    version: comorbidityVersion,
    factors: Array.from(factorSet),
    triggered,
    metabolicCluster,
    totalPenalty,
  };
}

/** Applique la pénalité au score global brut, borné à [1, 5]. */
export function applyComorbidityPenalty(rawGlobalScore: number, totalPenalty: number): number {
  return Math.max(1, Math.min(5, rawGlobalScore - totalPenalty));
}
