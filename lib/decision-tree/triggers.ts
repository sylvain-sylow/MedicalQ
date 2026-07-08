// lib/decision-tree/triggers.ts
// Déclencheurs numériques du moteur adaptatif
// Seuils IMC, tabac, alcool, tension — avec bandes de tolérance

/**
 * Calcule l'IMC à partir du poids (kg) et de la taille (cm).
 * JAMAIS affiché côté assuré — utilisé uniquement côté serveur pour le branchement.
 */
export function computeIMC(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

/**
 * Seuils IMC avec bandes de tolérance (±0.5 kg/m²) pour éviter les faux
 * déclenchements sur des valeurs frontières (spec § 6, Trame Scoring § IMC).
 */
export const IMC_THRESHOLDS = {
  /** IMC < 18.5 — sous-poids */
  UNDERWEIGHT: { min: 0,    max: 18.5 },
  /** IMC 18.5–24.9 — normal */
  NORMAL:      { min: 18.5, max: 24.9 },
  /** IMC 25–29.9 — surpoids */
  OVERWEIGHT:  { min: 25.0, max: 29.9 },
  /** IMC 30–34.9 — obésité I → déclenche questionnaire obésité si >= 30 */
  OBESE_I:     { min: 30.0, max: 34.9 },
  /** IMC 35–39.9 — obésité II */
  OBESE_II:    { min: 35.0, max: 39.9 },
  /** IMC >= 40 — obésité III (morbide) → questionnaire Obesite + impact fort */
  OBESE_III:   { min: 40.0, max: Infinity },
} as const;

export type ImcCategory = keyof typeof IMC_THRESHOLDS;

/**
 * Catégorise un IMC avec une bande de tolérance de ±0.5.
 * La tolérance évite qu'un assuré à 29.6 (pesée matin vs soir) soit classé obèse.
 */
export function classifyIMC(imc: number): ImcCategory {
  if (imc < IMC_THRESHOLDS.UNDERWEIGHT.max - 0.5) return "UNDERWEIGHT";
  if (imc < IMC_THRESHOLDS.NORMAL.max + 0.5)      return "NORMAL";
  if (imc < IMC_THRESHOLDS.OVERWEIGHT.max + 0.5)  return "OVERWEIGHT";
  if (imc < IMC_THRESHOLDS.OBESE_I.max + 0.5)     return "OBESE_I";
  if (imc < IMC_THRESHOLDS.OBESE_II.max + 0.5)    return "OBESE_II";
  return "OBESE_III";
}

/**
 * Indique si l'IMC doit déclencher un module spécialisé (>= 30).
 */
export function imcTriggersObesiteModule(imc: number): boolean {
  return imc >= IMC_THRESHOLDS.OBESE_I.min;
}

// ─── Tabac ────────────────────────────────────────────────────────────────────

export type TabacStatus = "JAMAIS" | "EX_MOINS_2ANS" | "EX_PLUS_2ANS" | "ACTUEL";

/**
 * Calcule le statut tabagique.
 * @param currentSmoke - Fumeur actuel
 * @param stoppedDate - Date d'arrêt (si ex-fumeur)
 */
export function classifyTabac(currentSmoke: boolean, stoppedDate?: string): TabacStatus {
  if (currentSmoke) return "ACTUEL";
  if (!stoppedDate) return "JAMAIS";
  const stopped = new Date(stoppedDate);
  const monthsSince = (Date.now() - stopped.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return monthsSince < 24 ? "EX_MOINS_2ANS" : "EX_PLUS_2ANS";
}

/**
 * Paquets-années (PA) — mesure de l'exposition cumulée au tabac.
 * Déclenche des questions cardio/respiratoires si >= 20 PA.
 */
export function computePaquetsAnnees(cigarettesPerDay: number, yearsSmoked: number): number {
  return Math.round((cigarettesPerDay / 20) * yearsSmoked * 10) / 10;
}

export const TABAC_PA_THRESHOLD = 20; // PA — au-dessus : questions supplémentaires cardio/resp

// ─── Alcool ───────────────────────────────────────────────────────────────────

/** Seuils en verres standard/semaine (OMS : 1 verre = 10 g d'alcool pur) */
export const ALCOOL_THRESHOLDS = {
  /** ≤ 14 verres/semaine — usage à faible risque */
  LOW_RISK:    14,
  /** 15–21 verres/semaine — usage à risque → questions hépatiques + cardio */
  AT_RISK:     21,
  /** > 21 verres/semaine — usage nocif → questionnaire hépatique obligatoire */
  HARMFUL:     Infinity,
} as const;

export type AlcoolRisk = "LOW_RISK" | "AT_RISK" | "HARMFUL";

export function classifyAlcool(glassesPerWeek: number): AlcoolRisk {
  if (glassesPerWeek <= ALCOOL_THRESHOLDS.LOW_RISK) return "LOW_RISK";
  if (glassesPerWeek <= ALCOOL_THRESHOLDS.AT_RISK)  return "AT_RISK";
  return "HARMFUL";
}

// ─── Tension artérielle ───────────────────────────────────────────────────────

/**
 * Indique si une valeur tensionnelle déclenche le module HTA.
 * Seuil : systolique >= 140 OU diastolique >= 90.
 */
export function tensionTriggersHTA(systolic: number, diastolic: number): boolean {
  return systolic >= 140 || diastolic >= 90;
}

// ─── Poids de naissance ───────────────────────────────────────────────────────

/** Déclenche une note d'information si poids de naissance < 2,5 kg */
export const BIRTH_WEIGHT_THRESHOLD_KG = 2.5;
