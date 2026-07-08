// Generated from docs/Sylow_bareme_etoiles.json
// Do not edit manually. Run generate-config.js to update.

export type StarRule =
  | {
      id: string;
      theme: string;
      type: "numeric_high_bad" | "numeric_low_bad";
      unit: string;
      bounds: { s5: number; s4: number; s3: number; s2: number };
      tolerancePct: number;
      pendingValidation: boolean;
      notes?: string;
    }
  | {
      id: string;
      theme: string;
      type: "binary";
      onYes: 1 | 2 | 3 | 4 | 5;
      pendingValidation: boolean;
      notes?: string;
    }
  | {
      id: string;
      theme: string;
      type: "frequency";
      map: Record<string, 1 | 2 | 3 | 4 | 5>;
      pendingValidation: boolean;
      notes?: string;
    };

export const engineVersion = "1.1";

export const rules: StarRule[] = [
  {
    "id": "N1_IMC",
    "theme": "Poids et silhouette",
    "pendingValidation": true,
    "notes": "T=30 (repère OMS obésité). 5★≤34,5. Versant maigreur à traiter à part.",
    "type": "numeric_high_bad",
    "unit": "IMC kg/m² (haut défavorable)",
    "bounds": {
      "s5": 34.5,
      "s4": 39,
      "s3": 45,
      "s2": 52.5
    },
    "tolerancePct": 15
  },
  {
    "id": "N1_TA_SYS",
    "theme": "Tension artérielle",
    "pendingValidation": true,
    "notes": "T=140. Cas test : 138<140 → 5★.",
    "type": "numeric_high_bad",
    "unit": "mmHg (haut défavorable)",
    "bounds": {
      "s5": 161,
      "s4": 182,
      "s3": 210,
      "s2": 245
    },
    "tolerancePct": 15
  },
  {
    "id": "N1_TA_DIA",
    "theme": "Tension artérielle",
    "pendingValidation": true,
    "notes": "T=90. Cas test : 88<90 → 5★.",
    "type": "numeric_high_bad",
    "unit": "mmHg (haut défavorable)",
    "bounds": {
      "s5": 103.49999999999999,
      "s4": 117,
      "s3": 135,
      "s2": 157.5
    },
    "tolerancePct": 15
  },
  {
    "id": "N1_TABAC",
    "theme": "Tabac",
    "pendingValidation": true,
    "notes": "Grille trame §2.3 : 0=5★ · 1-9=4★ · 10-19=3★ · 20-29=2★ · ≥30=1★.",
    "type": "frequency",
    "map": {
      "0": 5,
      "1-9": 4,
      "10-19": 3,
      "20-29": 2,
      "30+": 1
    }
  },
  {
    "id": "N1_ALCOOL",
    "theme": "Alcool et autres consommations",
    "pendingValidation": true,
    "notes": "Grille trame §2.4 : ≤16=5★ · 17-24=4★ · 25-34=3★ · 35-49=2★ · ≥50=1★ (seuil adapté selon sexe).",
    "type": "frequency",
    "map": {
      "0-16": 5,
      "17-24": 4,
      "25-34": 3,
      "35-49": 2,
      "50+": 1
    }
  },
  {
    "id": "N1_SUBST",
    "theme": "Alcool et autres consommations",
    "pendingValidation": true,
    "notes": "Non=5★ · Occasionnel=3★ · Régulier=1★.",
    "type": "frequency",
    "map": {
      "non": 5,
      "occasionnel": 3,
      "régulier": 1
    }
  },
  {
    "id": "N1_SPORT",
    "theme": "Activité physique et loisirs",
    "pendingValidation": true,
    "notes": "Aucun risque=5★ · loisir régulier=4★ · intensif/compétition=3★ · extrême régulier=2★.",
    "type": "frequency",
    "map": {
      "aucun risque": 5,
      "loisir régulier": 4,
      "intensif/compétition": 3,
      "extrême régulier": 2
    }
  },
  {
    "id": "N1_VOYAGE",
    "theme": "Voyages et environnement",
    "pendingValidation": true,
    "notes": "Non=5★ · touristique=4★ · prolongé/zone à risque=3★.",
    "type": "frequency",
    "map": {
      "non": 5,
      "touristique": 4,
      "prolongé/zone à risque": 3
    }
  },
  {
    "id": "N1_ARRET_DUREE",
    "theme": "Vie professionnelle et arrêts",
    "pendingValidation": true,
    "notes": "T=21 jours. Cas test : 10≤24 → 5★.",
    "type": "numeric_high_bad",
    "unit": "jours (haut défavorable)",
    "bounds": {
      "s5": 24.15,
      "s4": 27.3,
      "s3": 31.5,
      "s2": 36.75
    },
    "tolerancePct": 15
  },
  {
    "id": "N1_ARRET_COURS",
    "theme": "Vie professionnelle et arrêts",
    "pendingValidation": true,
    "notes": "Non=5★ · Oui=3★.",
    "type": "binary",
    "onYes": 3
  },
  {
    "id": "N1_INVAL",
    "theme": "Vie professionnelle et arrêts",
    "pendingValidation": true,
    "notes": "Non=5★ · Oui=1★ (proposition, pas règle actuarielle).",
    "type": "binary",
    "onYes": 1
  },
  {
    "id": "N1_REFUS",
    "theme": "Vie professionnelle et arrêts",
    "pendingValidation": true,
    "notes": "Non=5★ · Oui=2★.",
    "type": "binary",
    "onYes": 2
  },
  {
    "id": "N1_ALD100",
    "theme": "Suivi médical récent",
    "pendingValidation": true,
    "notes": "Non=5★ · Oui=3★.",
    "type": "binary",
    "onYes": 3
  },
  {
    "id": "N1_EXAM_PREV",
    "theme": "Suivi médical récent",
    "pendingValidation": true,
    "notes": "Non=5★ · Oui=4★.",
    "type": "binary",
    "onYes": 4
  },
  {
    "id": "N2_INFECT",
    "theme": "Infections",
    "pendingValidation": true,
    "notes": "NON=5★. Sévérité affinée niveau 3.",
    "type": "binary",
    "onYes": 2
  },
  {
    "id": "N2_ENDOC",
    "theme": "Diabète, cholestérol, thyroïde",
    "pendingValidation": true,
    "notes": "NON=5★.",
    "type": "binary",
    "onYes": 2
  },
  {
    "id": "N2_SANG",
    "theme": "Sang",
    "pendingValidation": true,
    "notes": "NON=5★.",
    "type": "binary",
    "onYes": 2
  },
  {
    "id": "N2_PSY",
    "theme": "Moral et santé mentale",
    "pendingValidation": true,
    "notes": "NON=5★. SENSIBLE : ton neutre, pas de gamification.",
    "type": "binary",
    "onYes": 2
  },
  {
    "id": "N2_NEURO",
    "theme": "Cerveau et système nerveux",
    "pendingValidation": true,
    "notes": "NON=5★.",
    "type": "binary",
    "onYes": 2
  },
  {
    "id": "N2_ORL_OPH",
    "theme": "Oreilles, nez, gorge, yeux",
    "pendingValidation": true,
    "notes": "NON=5★. Souvent bénin.",
    "type": "binary",
    "onYes": 4
  },
  {
    "id": "N2_CARDIO",
    "theme": "Cœur et circulation",
    "pendingValidation": true,
    "notes": "NON=5★. Cas test : coché mais aucun seuil interne → 5★.",
    "type": "binary",
    "onYes": 2
  },
  {
    "id": "N2_RESP",
    "theme": "Respiration",
    "pendingValidation": true,
    "notes": "NON=5★.",
    "type": "binary",
    "onYes": 3
  },
  {
    "id": "N2_DIGEST",
    "theme": "Digestion",
    "pendingValidation": true,
    "notes": "NON=5★.",
    "type": "binary",
    "onYes": 3
  },
  {
    "id": "N2_URO",
    "theme": "Reins et voies urinaires",
    "pendingValidation": true,
    "notes": "NON=5★.",
    "type": "binary",
    "onYes": 3
  },
  {
    "id": "N2_PEAU",
    "theme": "Peau",
    "pendingValidation": true,
    "notes": "NON=5★. Généralement bénin.",
    "type": "binary",
    "onYes": 4
  },
  {
    "id": "N2_OSTEO",
    "theme": "Os, articulations et dos",
    "pendingValidation": true,
    "notes": "NON=5★.",
    "type": "binary",
    "onYes": 3
  },
  {
    "id": "N2_CANCER",
    "theme": "Cancer",
    "pendingValidation": true,
    "notes": "NON=5★. Voir droit à l'oubli AERAS.",
    "type": "binary",
    "onYes": 1
  }
];
