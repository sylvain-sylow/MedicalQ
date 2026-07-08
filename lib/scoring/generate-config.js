const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../../docs/Sylow_bareme_etoiles.json');
const tsPath = path.join(__dirname, 'config.ts');

const raw = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(raw);

const rules = data.rules;

const starRules = rules.map(r => {
  const base = {
    id: r.id,
    theme: r.theme,
    pendingValidation: !!r.pendingValidation,
    notes: r.notes || undefined,
  };

  if (r.type === 'numeric_threshold') {
    const T = r.T;
    return {
      ...base,
      type: 'numeric_high_bad',
      unit: r.unit,
      bounds: {
        s5: T * 1.15,
        s4: T * 1.30,
        s3: T * 1.50,
        s2: T * 1.75,
      },
      tolerancePct: 15,
    };
  } else if (r.type === 'binary') {
    return {
      ...base,
      type: 'binary',
      onYes: r.onYes,
    };
  } else if (r.type === 'numeric_grid' || r.type === 'qualitative_grid') {
    // Map grid to frequency
    let map = {};
    if (r.id === 'N1_TABAC') {
      map = { "0": 5, "1-9": 4, "10-19": 3, "20-29": 2, "30+": 1 };
    } else if (r.id === 'N1_ALCOOL') {
      map = { "0-16": 5, "17-24": 4, "25-34": 3, "35-49": 2, "50+": 1 };
    } else if (r.id === 'N1_SUBST') {
      map = { "non": 5, "occasionnel": 3, "régulier": 1 };
    } else if (r.id === 'N1_SPORT') {
      map = { "aucun risque": 5, "loisir régulier": 4, "intensif/compétition": 3, "extrême régulier": 2 };
    } else if (r.id === 'N1_VOYAGE') {
      map = { "non": 5, "touristique": 4, "prolongé/zone à risque": 3 };
    }
    return {
      ...base,
      type: 'frequency',
      map,
    };
  } else {
    throw new Error('Unknown type ' + r.type);
  }
});

const tsContent = `// Generated from docs/Sylow_bareme_etoiles.json
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

export const engineVersion = ${JSON.stringify(data.version)};

export const rules: StarRule[] = ${JSON.stringify(starRules, null, 2)};
`;

fs.writeFileSync(tsPath, tsContent, 'utf8');
console.log('Successfully generated config.ts');
