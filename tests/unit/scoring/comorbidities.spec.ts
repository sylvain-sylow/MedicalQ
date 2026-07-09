// tests/unit/scoring/comorbidities.spec.ts
import { describe, it, expect } from "vitest";
import {
  detectRiskFactors,
  assessComorbidities,
  applyComorbidityPenalty,
  COMORBIDITY_PENALTY_CAP,
  METABOLIC_CLUSTER_PENALTY,
} from "@/lib/scoring/comorbidities";
import { computeScoring } from "@/lib/scoring/stars";

describe("Comorbidity — detectRiskFactors", () => {
  it("detects metabolic factors from mixed inputs/answers", () => {
    const inputs = { N1_IMC: 33, N1_TA_SYS: 150, N1_TABAC: 15 };
    const answers = { q01_diabete: "oui", q11_systemes: ["coeur"] };
    const factors = detectRiskFactors(inputs, answers);
    expect(factors.has("obesite")).toBe(true);
    expect(factors.has("hta")).toBe(true);
    expect(factors.has("tabagisme")).toBe(true);
    expect(factors.has("diabete")).toBe(true);
    expect(factors.has("cardiopathie")).toBe(true);
  });

  it("does not flag borderline-normal values", () => {
    const inputs = { N1_IMC: 24, N1_TA_SYS: 120, N1_TA_DIA: 80, N1_TABAC: 0, N1_ALCOOL: 10 };
    const answers = { q01_diabete: "non", q11_systemes: ["aucun"] };
    const factors = detectRiskFactors(inputs, answers);
    expect(factors.size).toBe(0);
  });

  it("flags HTA via declaration even without a measured value", () => {
    const factors = detectRiskFactors({}, { q01_tension: "oui" });
    expect(factors.has("hta")).toBe(true);
  });
});

describe("Comorbidity — assessComorbidities", () => {
  it("triggers the diabète+cardiopathie couple (most detrimental)", () => {
    const impact = assessComorbidities(
      { N1_IMC: 26 },
      { q01_diabete: "oui", q11_systemes: ["coeur"] }
    );
    const labels = impact.triggered.map((t) => t.label);
    expect(labels).toContain("Diabète + cardiopathie");
    expect(impact.triggered[0].penalty).toBe(1.5); // sorted, worst first
  });

  it("detects the metabolic syndrome cluster with ≥3 factors", () => {
    const impact = assessComorbidities(
      { N1_IMC: 32, N1_TA_SYS: 150 },
      { q01_diabete: "oui", q01_cholesterol: "oui" }
    );
    expect(impact.metabolicCluster).not.toBeNull();
    expect(impact.metabolicCluster!.factors.length).toBeGreaterThanOrEqual(3);
    expect(impact.metabolicCluster!.penalty).toBe(METABOLIC_CLUSTER_PENALTY);
  });

  it("returns no penalty for a healthy profile", () => {
    const impact = assessComorbidities({ N1_IMC: 22 }, { q11_systemes: ["aucun"] });
    expect(impact.triggered).toHaveLength(0);
    expect(impact.metabolicCluster).toBeNull();
    expect(impact.totalPenalty).toBe(0);
  });

  it("caps the total penalty at COMORBIDITY_PENALTY_CAP", () => {
    // Stack many severe factors → sum of penalties would exceed the cap.
    const impact = assessComorbidities(
      { N1_IMC: 34, N1_TA_SYS: 160, N1_TABAC: 25 },
      {
        q01_diabete: "oui",
        q01_cholesterol: "oui",
        q11_systemes: ["coeur", "reins", "respiratoire"],
      }
    );
    expect(impact.totalPenalty).toBe(COMORBIDITY_PENALTY_CAP);
  });
});

describe("Comorbidity — applyComorbidityPenalty", () => {
  it("subtracts the penalty and floors at 1", () => {
    expect(applyComorbidityPenalty(4.5, 1.5)).toBe(3);
    expect(applyComorbidityPenalty(2.0, 5)).toBe(1); // floored
    expect(applyComorbidityPenalty(4, 0)).toBe(4); // no penalty
  });
});

describe("Comorbidity — integration with computeScoring", () => {
  it("leaves the healthy trame example unchanged (no comorbidity)", () => {
    const answers = {
      q01_silhouette_taille: 175,
      q01_silhouette_poids: 101,
      q01_tension: "non",
      q01_tabac: "actuel",
      q01_tabac_quantite: 5,
      q11_systemes: ["coeur"],
    };
    const result = computeScoring(answers, { coeur: 5 });
    expect(result.comorbidities.totalPenalty).toBe(0);
    expect(result.adjustedGlobalScore).toBeCloseTo(result.globalScore, 6);
  });

  it("lowers the adjusted global score for a diabetic + hypertensive + smoker profile", () => {
    const answers = {
      q01_silhouette_taille: 170,
      q01_silhouette_poids: 95, // IMC ≈ 32.9 → obésité
      q01_tension: "oui",
      q01_diabete: "oui",
      q01_tabac: "actuel",
      q01_tabac_quantite: 20,
      q11_systemes: ["coeur"],
    };
    const result = computeScoring(answers, {});
    expect(result.comorbidities.triggered.length).toBeGreaterThan(0);
    expect(result.adjustedGlobalScore).toBeLessThan(result.globalScore);
    expect(result.adjustedGlobalScore).toBeGreaterThanOrEqual(1);
  });
});
