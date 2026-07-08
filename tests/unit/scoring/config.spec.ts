// tests/unit/scoring/config.spec.ts
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import * as config from "@/lib/scoring/config";

describe("Scoring Configuration Drift Test", () => {
  it("checks that config.ts contains all the rules and values from Sylow_bareme_etoiles.json", () => {
    const jsonPath = path.join(__dirname, "../../../docs/Sylow_bareme_etoiles.json");
    const raw = fs.readFileSync(jsonPath, "utf8");
    const data = JSON.parse(raw);

    // Compare version
    expect(config.engineVersion).toBe(data.version);

    // Compare number of rules
    expect(config.rules.length).toBe(data.rules.length);

    // Compare each rule
    for (let i = 0; i < data.rules.length; i++) {
      const jsonRule = data.rules[i];
      const tsRule = config.rules.find((r) => r.id === jsonRule.id);

      expect(tsRule).toBeDefined();
      expect(tsRule!.theme).toBe(jsonRule.theme);
      expect(tsRule!.pendingValidation).toBe(!!jsonRule.pendingValidation);

      if (jsonRule.type === "numeric_threshold") {
        expect(tsRule!.type).toBe("numeric_high_bad");
        const bounds = (tsRule as any).bounds;
        const T = jsonRule.T;
        expect(bounds.s5).toBeCloseTo(T * 1.15);
        expect(bounds.s4).toBeCloseTo(T * 1.30);
        expect(bounds.s3).toBeCloseTo(T * 1.50);
        expect(bounds.s2).toBeCloseTo(T * 1.75);
      } else if (jsonRule.type === "binary") {
        expect(tsRule!.type).toBe("binary");
        expect((tsRule as any).onYes).toBe(jsonRule.onYes);
      } else if (jsonRule.type === "numeric_grid" || jsonRule.type === "qualitative_grid") {
        expect(tsRule!.type).toBe("frequency");
        // Compare map keys and values
        const map = (tsRule as any).map;
        if (jsonRule.id === "N1_TABAC") {
          expect(map).toEqual({ "0": 5, "1-9": 4, "10-19": 3, "20-29": 2, "30+": 1 });
        } else if (jsonRule.id === "N1_ALCOOL") {
          expect(map).toEqual({ "0-16": 5, "17-24": 4, "25-34": 3, "35-49": 2, "50+": 1 });
        } else if (jsonRule.id === "N1_SUBST") {
          expect(map).toEqual({ "non": 5, "occasionnel": 3, "régulier": 1 });
        } else if (jsonRule.id === "N1_SPORT") {
          expect(map).toEqual({ "aucun risque": 5, "loisir régulier": 4, "intensif/compétition": 3, "extrême régulier": 2 });
        } else if (jsonRule.id === "N1_VOYAGE") {
          expect(map).toEqual({ "non": 5, "touristique": 4, "prolongé/zone à risque": 3 });
        }
      }
    }
  });
});
