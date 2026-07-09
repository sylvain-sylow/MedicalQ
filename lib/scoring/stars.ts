// lib/scoring/stars.ts
import { rules, type StarRule, engineVersion } from "./config";
import { computeIMC } from "../decision-tree/triggers";
import {
  assessComorbidities,
  applyComorbidityPenalty,
  type ComorbidityImpact,
} from "./comorbidities";

export interface ScoringResult {
  engineVersion: string;
  perTheme: Record<string, number>;
  /** Score global brut = moyenne géométrique des rubriques actives (avant comorbidités). */
  globalScore: number;
  /** Score global après pénalité de comorbidité (couples de pathologies défavorables). */
  adjustedGlobalScore: number;
  /** Détail de l'impact des comorbidités (back-office uniquement). */
  comorbidities: ComorbidityImpact;
  ruleScores: Record<string, number>;
}

/**
 * Matches a frequency map key against the given value.
 */
function matchFrequencyKey(key: string, value: any): boolean {
  if (value === undefined || value === null) return false;

  const keyLower = key.toLowerCase().trim();
  const valStr = String(value).toLowerCase().trim();

  // Match direct string equality
  if (keyLower === valStr) return true;

  // Numeric matches
  const numValue = Number(value);
  if (!isNaN(numValue)) {
    // Range key like "1-9"
    if (key.includes("-")) {
      const parts = key.split("-");
      if (parts.length === 2) {
        const min = parseFloat(parts[0]);
        const max = parseFloat(parts[1]);
        return numValue >= min && numValue <= max;
      }
    }
    // Plus key like "30+" or "50+"
    if (key.endsWith("+")) {
      const min = parseFloat(key.slice(0, -1));
      return numValue >= min;
    }
    // Direct numerical match
    if (parseFloat(key) === numValue) {
      return true;
    }
  }

  return false;
}

/**
 * Computes stars for a single rule given an answer value.
 */
export function starFor(rule: StarRule, answer: any): 1 | 2 | 3 | 4 | 5 {
  if (answer === undefined || answer === null) {
    return 5; // Non-penalizing default if question not answered
  }

  if (rule.type === "numeric_high_bad") {
    const val = Number(answer);
    if (isNaN(val)) return 5;
    if (val <= rule.bounds.s5) return 5;
    if (val <= rule.bounds.s4) return 4;
    if (val <= rule.bounds.s3) return 3;
    if (val <= rule.bounds.s2) return 2;
    return 1;
  }

  if (rule.type === "numeric_low_bad") {
    const val = Number(answer);
    if (isNaN(val)) return 5;
    if (val >= rule.bounds.s5) return 5;
    if (val >= rule.bounds.s4) return 4;
    if (val >= rule.bounds.s3) return 3;
    if (val >= rule.bounds.s2) return 2;
    return 1;
  }

  if (rule.type === "binary") {
    const valStr = String(answer).toLowerCase().trim();
    const isYes = valStr === "oui" || valStr === "yes" || valStr === "true" || answer === true;
    if (isYes) {
      return rule.onYes;
    }
    return 5; // Default for NO
  }

  if (rule.type === "frequency") {
    // Loop through map to find match
    for (const [key, score] of Object.entries(rule.map)) {
      if (matchFrequencyKey(key, answer)) {
        return score as 1 | 2 | 3 | 4 | 5;
      }
    }
    // Default safe if no match
    return 5;
  }

  return 5;
}

/**
 * Maps database answers to rule-specific inputs.
 */
export function mapAnswersToRuleInputs(answers: Record<string, any>): Record<string, any> {
  const inputs: Record<string, any> = {};

  // 1. N1_IMC
  const height = answers["q01_silhouette_taille"];
  const weight = answers["q01_silhouette_poids"];
  if (height && weight) {
    inputs["N1_IMC"] = computeIMC(Number(weight), Number(height));
  }

  // 2. Tension
  const isTensionOui = answers["q01_tension"] === "oui";
  if (answers["N1_TA_SYS"] !== undefined) {
    inputs["N1_TA_SYS"] = answers["N1_TA_SYS"];
  } else if (answers["q01_tension"] !== undefined) {
    inputs["N1_TA_SYS"] = isTensionOui ? 150 : 120; // fallback if yes/no only
  }

  if (answers["N1_TA_DIA"] !== undefined) {
    inputs["N1_TA_DIA"] = answers["N1_TA_DIA"];
  } else if (answers["q01_tension"] !== undefined) {
    inputs["N1_TA_DIA"] = isTensionOui ? 95 : 80;
  }

  // 3. Tabac
  if (answers["N1_TABAC"] !== undefined) {
    inputs["N1_TABAC"] = answers["N1_TABAC"];
  } else if (answers["q01_tabac"] === "jamais") {
    inputs["N1_TABAC"] = 0;
  } else if (answers["q01_tabac"] === "actuel") {
    inputs["N1_TABAC"] = answers["q01_tabac_quantite"] ?? 0;
  } else if (answers["q01_tabac"] === "ex") {
    // Ex-fumeur: check time since stopped
    const stoppedDate = answers["q01_tabac_arret"];
    if (stoppedDate) {
      const stopped = new Date(stoppedDate);
      const monthsSince = (Date.now() - stopped.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      if (monthsSince < 24) {
        inputs["N1_TABAC"] = answers["q01_tabac_quantite"] ?? 10; // treat as moderate if < 2 years
      } else {
        inputs["N1_TABAC"] = 0; // 5★ if > 2 years
      }
    } else {
      inputs["N1_TABAC"] = 0;
    }
  }

  // 4. Alcool
  if (answers["N1_ALCOOL"] !== undefined) {
    inputs["N1_ALCOOL"] = answers["N1_ALCOOL"];
  } else if (answers["q01_alcool"] === "non") {
    inputs["N1_ALCOOL"] = 0;
  } else if (answers["q01_alcool"] === "oui") {
    inputs["N1_ALCOOL"] = answers["q01_alcool_frequence"] ?? 0;
  }

  // 5. Substance
  if (answers["N1_SUBST"] !== undefined) {
    inputs["N1_SUBST"] = answers["N1_SUBST"];
  } else {
    inputs["N1_SUBST"] = "non"; // safe default
  }

  // 6. Sport
  if (answers["N1_SPORT"] !== undefined) {
    inputs["N1_SPORT"] = answers["N1_SPORT"];
  } else if (answers["q_modes_vie_sport"] === "non") {
    inputs["N1_SPORT"] = "aucun risque";
  } else if (answers["q_modes_vie_sport"] === "oui") {
    inputs["N1_SPORT"] = answers["q_modes_vie_sport_detail"] ?? "loisir régulier";
  }

  // 7. Voyage
  if (answers["N1_VOYAGE"] !== undefined) {
    inputs["N1_VOYAGE"] = answers["N1_VOYAGE"];
  } else if (answers["q_modes_vie_fin"] === "non" || answers["q_modes_vie_fin"] === undefined) {
    inputs["N1_VOYAGE"] = "non";
  } else {
    inputs["N1_VOYAGE"] = "touristique";
  }

  // 8. Vie Pro / Arrets
  if (answers["N1_ARRET_DUREE"] !== undefined) {
    inputs["N1_ARRET_DUREE"] = answers["N1_ARRET_DUREE"];
  } else if (answers["q01_arret_travail"] === "non") {
    inputs["N1_ARRET_DUREE"] = 0;
  } else if (answers["q01_arret_travail"] === "oui") {
    inputs["N1_ARRET_DUREE"] = answers["q01_arret_travail_duree"] ?? 25; // moderate fallback (>15 days)
  }

  if (answers["N1_ARRET_COURS"] !== undefined) {
    inputs["N1_ARRET_COURS"] = answers["N1_ARRET_COURS"];
  } else {
    inputs["N1_ARRET_COURS"] = "non";
  }

  if (answers["N1_INVAL"] !== undefined) {
    inputs["N1_INVAL"] = answers["N1_INVAL"];
  } else {
    inputs["N1_INVAL"] = "non";
  }

  if (answers["N1_REFUS"] !== undefined) {
    inputs["N1_REFUS"] = answers["N1_REFUS"];
  } else {
    inputs["N1_REFUS"] = "non";
  }

  // 9. Suivi medical
  if (answers["N1_ALD100"] !== undefined) {
    inputs["N1_ALD100"] = answers["N1_ALD100"];
  } else if (answers["q01_diabete"] === "oui" || answers["q01_tension_traitement"] === "oui") {
    // If they have long-term treated conditions, might have ALD
    inputs["N1_ALD100"] = "oui";
  } else {
    inputs["N1_ALD100"] = "non";
  }

  if (answers["N1_EXAM_PREV"] !== undefined) {
    inputs["N1_EXAM_PREV"] = answers["N1_EXAM_PREV"];
  } else {
    inputs["N1_EXAM_PREV"] = "non";
  }

  // 10. Level 2 systems mapping
  const selectedSystems = (answers["q11_systemes"] as string[]) ?? [];
  const systemToRule: Record<string, string> = {
    coeur: "N2_CARDIO",
    neurologie: "N2_NEURO",
    respiratoire: "N2_RESP",
    digestif: "N2_DIGEST",
    foie: "N2_DIGEST",
    reins: "N2_URO",
    osteo: "N2_OSTEO",
    psy: "N2_PSY",
    cancer: "N2_CANCER",
    diabete: "N2_ENDOC",
    thyroide: "N2_ENDOC",
    sang: "N2_SANG",
    immuno: "N2_INFECT",
  };

  for (const [sys, ruleId] of Object.entries(systemToRule)) {
    if (selectedSystems.includes(sys)) {
      inputs[ruleId] = "oui";
    } else {
      // Don't override if already set explicitly in answers
      if (inputs[ruleId] === undefined) {
        inputs[ruleId] = "non";
      }
    }
  }

  // Also verify manually passed custom rule keys
  for (const [k, v] of Object.entries(answers)) {
    if (k.startsWith("N1_") || k.startsWith("N2_")) {
      inputs[k] = v;
    }
  }

  return inputs;
}

/**
 * Computes the complete scoring for a HealthFile from its answers and optional Level 3 severities.
 * @param answers - Raw question answers from the database
 * @param n3Severities - Map of system path to Level 3 score (1 to 5 stars).
 *                       If a system has no entry, it falls back to the N2 binary score.
 */
export function computeScoring(
  answers: Record<string, any>,
  n3Severities: Record<string, number> = {}
): ScoringResult {
  const inputs = mapAnswersToRuleInputs(answers);

  // Compute individual rule scores
  const ruleScores: Record<string, number> = {};
  for (const rule of rules) {
    ruleScores[rule.id] = starFor(rule, inputs[rule.id]);
  }

  // Group by theme
  const themeRules: Record<string, Array<{ id: string; score: number }>> = {};
  for (const rule of rules) {
    if (!themeRules[rule.theme]) {
      themeRules[rule.theme] = [];
    }
    themeRules[rule.theme].push({ id: rule.id, score: ruleScores[rule.id] });
  }

  const perTheme: Record<string, number> = {};

  // Level 1 themes are always active
  const level1Themes = [
    "Poids et silhouette",
    "Tension artérielle",
    "Tabac",
    "Alcool et autres consommations",
    "Activité physique et loisirs",
    "Voyages et environnement",
    "Vie professionnelle et arrêts",
    "Suivi médical récent",
  ];

  for (const theme of level1Themes) {
    const themeRulesList = themeRules[theme] || [];
    const scores = themeRulesList.map((r) => r.score);
    perTheme[theme] = scores.length > 0 ? Math.min(...scores) : 5;
  }

  // Level 2 themes: only active if the corresponding system was selected in q11_systemes
  const selectedSystems = (answers["q11_systemes"] as string[]) ?? [];
  
  const systemToTheme: Record<string, { themeName: string; ruleId: string }> = {
    coeur: { themeName: "Cœur et circulation", ruleId: "N2_CARDIO" },
    neurologie: { themeName: "Cerveau et système nerveux", ruleId: "N2_NEURO" },
    respiratoire: { themeName: "Respiration", ruleId: "N2_RESP" },
    digestif: { themeName: "Digestion", ruleId: "N2_DIGEST" },
    foie: { themeName: "Digestion", ruleId: "N2_DIGEST" },
    reins: { themeName: "Reins et voies urinaires", ruleId: "N2_URO" },
    osteo: { themeName: "Os, articulations et dos", ruleId: "N2_OSTEO" },
    psy: { themeName: "Moral et santé mentale", ruleId: "N2_PSY" },
    cancer: { themeName: "Cancer", ruleId: "N2_CANCER" },
    diabete: { themeName: "Diabète, cholestérol, thyroïde", ruleId: "N2_ENDOC" },
    thyroide: { themeName: "Diabète, cholestérol, thyroïde", ruleId: "N2_ENDOC" },
    sang: { themeName: "Sang", ruleId: "N2_SANG" },
    immuno: { themeName: "Infections", ruleId: "N2_INFECT" },
  };

  const activeLevel2Themes = new Set<string>();

  for (const sys of selectedSystems) {
    const mapping = systemToTheme[sys];
    if (mapping) {
      activeLevel2Themes.add(mapping.themeName);
    }
  }

  // Populate active Level 2 themes
  for (const themeName of activeLevel2Themes) {
    // Find the corresponding system keys that generated this theme
    const relatedSystems = Object.entries(systemToTheme)
      .filter(([_, map]) => map.themeName === themeName)
      .map(([sys]) => sys);

    // Look for any overridden Level 3 score
    let score = 5;
    let hasN3Override = false;
    for (const sys of relatedSystems) {
      if (selectedSystems.includes(sys) && n3Severities[sys] !== undefined) {
        // Take the lowest Level 3 score if multiple systems map to the same theme
        score = hasN3Override ? Math.min(score, n3Severities[sys]) : n3Severities[sys];
        hasN3Override = true;
      }
    }

    if (!hasN3Override) {
      // Fallback to N2 binary rule score (minimum if multiple rules map to the same theme)
      const mappedRuleIds = Object.entries(systemToTheme)
        .filter(([sys, map]) => map.themeName === themeName && selectedSystems.includes(sys))
        .map(([_, map]) => map.ruleId);

      const binaryScores = mappedRuleIds.map((rId) => ruleScores[rId] ?? 5);
      score = binaryScores.length > 0 ? Math.min(...binaryScores) : 2;
    }

    perTheme[themeName] = score;
  }

  // Global score calculation (geometric mean of all active themes)
  const activeThemes = [
    ...level1Themes,
    ...Array.from(activeLevel2Themes),
  ];

  const activeScores = activeThemes.map((theme) => perTheme[theme] ?? 5);

  const product = activeScores.reduce((acc, val) => acc * val, 1);
  const globalScore = Math.pow(product, 1 / activeScores.length);

  // Couche de comorbidité (back-office uniquement) : les couples de pathologies
  // les plus défavorables abaissent le score global au-delà de la moyenne géométrique.
  const comorbidities = assessComorbidities(inputs, answers);
  const adjustedGlobalScore = applyComorbidityPenalty(globalScore, comorbidities.totalPenalty);

  return {
    engineVersion,
    perTheme,
    globalScore,
    adjustedGlobalScore,
    comorbidities,
    ruleScores,
  };
}
