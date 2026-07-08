// lib/decision-tree/timeframes.ts
// Fenêtres temporelles harmonisées — source unique de vérité
// Utilisées dans tree.config.ts pour les questions "depuis combien de temps ?"
// et dans engine.ts pour les comparaisons de dates

/**
 * Fenêtres temporelles standard du questionnaire Sylow.
 * Le moteur compare l'ancienneté d'un événement à ces fenêtres pour déclencher
 * des branches ou calculer des niveaux d'impact.
 */

export const TIMEFRAMES = {
  /** Moins de 6 mois — situation récente, fort impact sur scoring */
  RECENT:    { months: 6,  label: "moins de 6 mois",  code: "T6M"  },
  /** 6 mois à 2 ans — situation sub-aiguë */
  SHORT:     { months: 24, label: "6 mois à 2 ans",   code: "T2A"  },
  /** 2 à 5 ans — moyen terme */
  MEDIUM:    { months: 60, label: "2 à 5 ans",         code: "T5A"  },
  /** Plus de 5 ans — situation ancienne */
  LONG:      { months: Infinity, label: "plus de 5 ans", code: "T5AP" },
} as const;

export type TimeframeCode = keyof typeof TIMEFRAMES;

/**
 * Calcule la fenêtre temporelle d'un événement à partir de sa date.
 * @param eventDate Date de l'événement (string ISO ou Date)
 * @returns TimeframeCode correspondant
 */
export function classifyTimeframe(eventDate: string | Date): TimeframeCode {
  const date = typeof eventDate === "string" ? new Date(eventDate) : eventDate;
  const now = new Date();
  const monthsAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

  if (monthsAgo <= TIMEFRAMES.RECENT.months) return "RECENT";
  if (monthsAgo <= TIMEFRAMES.SHORT.months)  return "SHORT";
  if (monthsAgo <= TIMEFRAMES.MEDIUM.months) return "MEDIUM";
  return "LONG";
}

/**
 * Fenêtres spécifiques à certains modules médicaux.
 * Documentées explicitement pour garder la cohérence avec la spec.
 */
export const MODULE_TIMEFRAMES = {
  /** Hospitalisations psychiatriques — détail demandé si < 5 ans */
  PSYCHIATRIE_HOSPITALISATION: 60, // mois
  /** Arrêts de travail — pris en compte si >= 15 jours dans les 3 dernières années */
  ARRET_TRAVAIL: 36, // mois
  /** Dernier bilan biologique — valide si < 12 mois */
  BILAN_12M: 12, // mois
  /** Dernier bilan biologique — valide si < 6 mois */
  BILAN_6M: 6, // mois
  /** Dernière consultation spécialiste — alerte si > 24 mois */
  DERNIERE_CONSULT_ALERTE: 24, // mois
  /** Rémission cancer — délai de déclaration AERAS (10 ans) */
  REMISSION_AERAS: 120, // mois
} as const;
