// tests/unit/scoring/stars.spec.ts
import { describe, it, expect } from "vitest";
import { starFor, computeScoring, mapAnswersToRuleInputs } from "@/lib/scoring/stars";
import { rules } from "@/lib/scoring/config";

describe("Scoring Engine - starFor", () => {
  it("computes numeric rules with 15% tolerance correctly (IMC example)", () => {
    const imcRule = rules.find((r) => r.id === "N1_IMC")!;
    expect(imcRule).toBeDefined();

    // Threshold is 30. Tolerance is 15% -> 30 * 1.15 = 34.5
    // s5: 34.5, s4: 39, s3: 45, s2: 52.5
    expect(starFor(imcRule, 22.9)).toBe(5);
    expect(starFor(imcRule, 30.0)).toBe(5);
    expect(starFor(imcRule, 34.5)).toBe(5); // Bound s5 inclusive
    expect(starFor(imcRule, 34.6)).toBe(4); // Exceeds s5
    expect(starFor(imcRule, 38.0)).toBe(4);
    expect(starFor(imcRule, 39.0)).toBe(4); // Bound s4 inclusive
    expect(starFor(imcRule, 40.0)).toBe(3);
    expect(starFor(imcRule, 45.0)).toBe(3); // Bound s3 inclusive
    expect(starFor(imcRule, 46.0)).toBe(2);
    expect(starFor(imcRule, 52.5)).toBe(2); // Bound s2 inclusive
    expect(starFor(imcRule, 55.0)).toBe(1); // Exceeds s2
  });

  it("computes binary rules correctly", () => {
    const invaliditeRule = rules.find((r) => r.id === "N1_INVAL")!;
    expect(invaliditeRule).toBeDefined();

    // onYes is 1
    expect(starFor(invaliditeRule, "non")).toBe(5);
    expect(starFor(invaliditeRule, "Non")).toBe(5);
    expect(starFor(invaliditeRule, false)).toBe(5);
    expect(starFor(invaliditeRule, "oui")).toBe(1);
    expect(starFor(invaliditeRule, "Oui")).toBe(1);
    expect(starFor(invaliditeRule, true)).toBe(1);
  });

  it("computes frequency rules correctly (Tabac example)", () => {
    const tabacRule = rules.find((r) => r.id === "N1_TABAC")!;
    expect(tabacRule).toBeDefined();

    // Map: {"0": 5, "1-9": 4, "10-19": 3, "20-29": 2, "30+": 1}
    expect(starFor(tabacRule, 0)).toBe(5);
    expect(starFor(tabacRule, "0")).toBe(5);
    expect(starFor(tabacRule, 5)).toBe(4);
    expect(starFor(tabacRule, 9)).toBe(4);
    expect(starFor(tabacRule, 10)).toBe(3);
    expect(starFor(tabacRule, 15)).toBe(3);
    expect(starFor(tabacRule, 20)).toBe(2);
    expect(starFor(tabacRule, 29)).toBe(2);
    expect(starFor(tabacRule, 30)).toBe(1);
    expect(starFor(tabacRule, 45)).toBe(1);
  });
});

describe("Scoring Engine - computeScoring & Aggregation", () => {
  it("reproduces the trame § 4.2 example exactly", () => {
    // IMC = 33
    // Tension = 138/88 (< 140/90)
    // Tabac = 5 cig/j
    // Alcool = 6 verres/sem
    // Sport = loisir régulier
    // Voyages = non
    // Arrêt le plus long = 10 jours
    // No invalidity/ALD/refus
    // Niveau 2: "Cœur et circulation" coché -> Module Cardio: aucun seuil interne dépassé
    const answers = {
      q01_silhouette_taille: 175,
      q01_silhouette_poids: 101, // IMC = 101 / 1.75^2 ≈ 33.0
      q01_tension: "non", // Normal tension -> fallbacks will produce sys=120, dia=80
      q01_tabac: "actuel",
      q01_tabac_quantite: 5,
      q01_alcool: "oui",
      q01_alcool_frequence: 6,
      q_modes_vie_sport: "oui",
      q_modes_vie_sport_detail: "loisir régulier",
      q_modes_vie_fin: "non",
      q01_arret_travail: "oui",
      q01_arret_travail_duree: 10,
      q01_arret_travail_cours: "non",
      q01_inval: "non",
      q01_refus: "non",
      q01_ald100: "non",
      q01_exam_prev: "non",
      q11_systemes: ["coeur"],
    };

    // Override Level 3 cardio score: "aucun seuil interne dépassé" -> 5 stars
    const n3Severities = {
      coeur: 5,
    };

    const result = computeScoring(answers, n3Severities);

    // Expected theme scores:
    // Poids et silhouette: 5
    // Tension artérielle: 5
    // Tabac: 4
    // Alcool et autres consommations: 5
    // Activité physique et loisirs: 4
    // Voyages et environnement: 5
    // Vie professionnelle et arrêts: 5
    // Suivi médical récent: 5
    // Cœur et circulation: 5 (from N3 override)
    expect(result.perTheme["Poids et silhouette"]).toBe(5);
    expect(result.perTheme["Tension artérielle"]).toBe(5);
    expect(result.perTheme["Tabac"]).toBe(4);
    expect(result.perTheme["Alcool et autres consommations"]).toBe(5);
    expect(result.perTheme["Activité physique et loisirs"]).toBe(4);
    expect(result.perTheme["Voyages et environnement"]).toBe(5);
    expect(result.perTheme["Vie professionnelle et arrêts"]).toBe(5);
    expect(result.perTheme["Suivi médical récent"]).toBe(5);
    expect(result.perTheme["Cœur et circulation"]).toBe(5);

    // Product = 5*5*4*5*4*5*5*5*5 = 1,250,000
    // Geometric mean = 1,250,000 ^ (1/9) ≈ 4.758
    expect(result.globalScore).toBeCloseTo(4.758, 3);
  });
});
