// tests/unit/decision-tree/engine.spec.ts
import { describe, it, expect } from "vitest";
import { getNextQuestion } from "@/lib/decision-tree/engine";
import { FIRST_QUESTION_ID } from "@/lib/decision-tree/tree.config";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const YES = "oui";
const NO  = "non";

/** Réponses minimales pour passer N0 */
const BASE_N0 = {
  q00_prenom:           "Test",
  q00_nom:              "User",
  q00_naissance_date:   "1985-06-15",
  q00_naissance_lieu:   "Paris",
  q00_lemoine:          NO,
  q00_consentement_sante: YES,
  q00_aeras:            NO,
};

/** Réponses N1 sans pathologie, sans tabac, sans alcool */
const BASE_N1_CLEAN = {
  ...BASE_N0,
  q01_silhouette_taille: 175,
  q01_silhouette_poids:  70,  // IMC ≈ 22.9 → normal
  q01_tabac:             "jamais",
  q01_alcool:            NO,
  q01_tension:           NO,
  q01_cholesterol:       NO,
  q01_diabete:           NO,
  q01_hospitalisation:   NO,
  q01_arret_travail:     NO,
  q01_traitement_long:   NO,
  q01_chirurgie:         NO,
};

// ─── Tests Niveau 0 ───────────────────────────────────────────────────────────

describe("N0 — identité et consentements", () => {
  it("démarre par la première question (prénom)", () => {
    const res = getNextQuestion({});
    expect(res).not.toBeNull();
    expect(res!.question.id).toBe(FIRST_QUESTION_ID);
    expect(res!.progress.stage).toBe("identite");
  });

  it("enchaîne prénom → nom", () => {
    const res = getNextQuestion({ q00_prenom: "Jean" });
    expect(res!.question.id).toBe("q00_nom");
  });

  it("refuse de continuer si consentement refusé (retourne null)", () => {
    const res = getNextQuestion({
      q00_prenom:             "Jean",
      q00_nom:                "Dupont",
      q00_naissance_date:     "1985-01-01",
      q00_naissance_lieu:     "Lyon",
      q00_lemoine:            NO,
      q00_consentement_sante: NO,  // refus → next: null
    });
    expect(res).toBeNull();
  });

  it("Lemoine=OUI n'interrompt pas le parcours — mène au consentement", () => {
    // Sans le reste de BASE_N0 : seulement jusqu'à Lemoine
    const answers = {
      q00_prenom: "Jean",
      q00_nom: "Dupont",
      q00_naissance_date: "1985-01-01",
      q00_naissance_lieu: "Lyon",
      q00_lemoine: YES,
    };
    const res = getNextQuestion(answers);
    expect(res!.question.id).toBe("q00_consentement_sante");
  });
});

// ─── Tests Niveau 1 ───────────────────────────────────────────────────────────

describe("N1 — questions générales", () => {
  it("après AERAS, démarre les questions corporelles (taille)", () => {
    const res = getNextQuestion(BASE_N0);
    expect(res!.question.id).toBe("q01_silhouette_taille");
    expect(res!.progress.stage).toBe("general");
  });

  it("tabac actuel → demande quantité puis durée", () => {
    const a1 = { ...BASE_N0, q01_silhouette_taille: 175, q01_silhouette_poids: 70, q01_tabac: "actuel" };
    expect(getNextQuestion(a1)!.question.id).toBe("q01_tabac_quantite");

    const a2 = { ...a1, q01_tabac_quantite: 10 };
    expect(getNextQuestion(a2)!.question.id).toBe("q01_tabac_duree");
  });

  it("ex-fumeur → demande la date d'arrêt", () => {
    const a = { ...BASE_N0, q01_silhouette_taille: 175, q01_silhouette_poids: 70, q01_tabac: "ex" };
    expect(getNextQuestion(a)!.question.id).toBe("q01_tabac_arret");
  });

  it("jamais fumé → passe directement à l'alcool", () => {
    const a = { ...BASE_N0, q01_silhouette_taille: 175, q01_silhouette_poids: 70, q01_tabac: "jamais" };
    expect(getNextQuestion(a)!.question.id).toBe("q01_alcool");
  });

  it("alcool=OUI → demande la fréquence", () => {
    const a = { ...BASE_N0, q01_silhouette_taille: 175, q01_silhouette_poids: 70, q01_tabac: "jamais", q01_alcool: YES };
    expect(getNextQuestion(a)!.question.id).toBe("q01_alcool_frequence");
  });

  it("diabète=OUI → demande le type", () => {
    const a = { ...BASE_N0, q01_silhouette_taille: 175, q01_silhouette_poids: 70, q01_tabac: "jamais", q01_alcool: NO, q01_tension: NO, q01_cholesterol: NO, q01_diabete: YES };
    expect(getNextQuestion(a)!.question.id).toBe("q01_diabete_type");
  });

  it("hospitalisation=OUI → demande le motif", () => {
    const a = { ...BASE_N0, q01_silhouette_taille: 175, q01_silhouette_poids: 70, q01_tabac: "jamais", q01_alcool: NO, q01_tension: NO, q01_cholesterol: NO, q01_diabete: NO, q01_hospitalisation: YES };
    expect(getNextQuestion(a)!.question.id).toBe("q01_hospitalisation_motif");
  });

  it("parcours N1 complet sans pathologie → arrive à q11_systemes", () => {
    const res = getNextQuestion(BASE_N1_CLEAN);
    expect(res!.question.id).toBe("q11_systemes");
  });
});

// ─── Tests IMC ────────────────────────────────────────────────────────────────

describe("IMC — branchements", () => {
  it("IMC normal (22.9) → pas de question poids_max", () => {
    const a = { ...BASE_N0, q01_silhouette_taille: 175, q01_silhouette_poids: 70 };
    expect(getNextQuestion(a)!.question.id).toBe("q01_tabac");
  });

  it("IMC >= 30 → demande le poids maximum", () => {
    const a = { ...BASE_N0, q01_silhouette_taille: 170, q01_silhouette_poids: 90 }; // IMC 31.1
    expect(getNextQuestion(a)!.question.id).toBe("q01_silhouette_poids_max");
  });

  it("IMC 39.9 — obésité II — déclenche poids_max", () => {
    const a = { ...BASE_N0, q01_silhouette_taille: 160, q01_silhouette_poids: 102 }; // IMC 39.8
    expect(getNextQuestion(a)!.question.id).toBe("q01_silhouette_poids_max");
  });
});

// ─── Tests Q11 multi-select ───────────────────────────────────────────────────

describe("Q11 — branchement systèmes", () => {
  it("aucun système sélectionné → passe aux modes de vie", () => {
    const a = { ...BASE_N1_CLEAN, q11_systemes: ["aucun"] };
    expect(getNextQuestion(a)!.question.id).toBe("q_modes_vie_sport");
  });

  it("coeur sélectionné → déclenche le module cardiaque", () => {
    const a = { ...BASE_N1_CLEAN, q11_systemes: ["coeur"] };
    const res = getNextQuestion(a)!;
    expect(res.question.id).toContain("q3_card");
    expect(res.progress.stage).toBe("modules");
  });

  it("psy sélectionné → module psychisme (sensitiveModule=true)", () => {
    const a = { ...BASE_N1_CLEAN, q11_systemes: ["psy"] };
    const res = getNextQuestion(a)!;
    expect(res.question.id).toBe("q3_psy_diagnostic");
  });

  it("cancer sélectionné → module tumeurs", () => {
    const a = { ...BASE_N1_CLEAN, q11_systemes: ["cancer"] };
    expect(getNextQuestion(a)!.question.id).toBe("q3_tum_diagnostic");
  });

  it("multi-systèmes : coeur + neurologie → démarre par coeur", () => {
    const a = { ...BASE_N1_CLEAN, q11_systemes: ["coeur", "neurologie"] };
    const res = getNextQuestion(a)!;
    // coeur vient en premier dans N3_MODULES
    expect(res.question.id).toContain("q3_card");
  });
});

// ─── Tests modes de vie ───────────────────────────────────────────────────────

describe("Modes de vie", () => {
  it("sport=OUI → demande le détail", () => {
    const a = { ...BASE_N1_CLEAN, q11_systemes: ["aucun"], q_modes_vie_sport: YES };
    expect(getNextQuestion(a)!.question.id).toBe("q_modes_vie_sport_detail");
  });

  it("sport=NON → passe à la profession", () => {
    const a = { ...BASE_N1_CLEAN, q11_systemes: ["aucun"], q_modes_vie_sport: NO };
    expect(getNextQuestion(a)!.question.id).toBe("q_modes_vie_profession");
  });

  it("parcours modes de vie complet → retourne null (END)", () => {
    const a = {
      ...BASE_N1_CLEAN,
      q11_systemes:               ["aucun"],
      q_modes_vie_sport:          NO,
      q_modes_vie_profession:     NO,
      q_modes_vie_fin:            NO,
    };
    expect(getNextQuestion(a)).toBeNull();
  });
});

// ─── Tests progression ────────────────────────────────────────────────────────

describe("Progression", () => {
  it("stageIndex est cohérent (identite=1, general=2)", () => {
    const r0 = getNextQuestion({});
    expect(r0!.progress.stageIndex).toBe(1);
    expect(r0!.progress.stageTotalCount).toBe(6);

    const r1 = getNextQuestion(BASE_N0);
    expect(r1!.progress.stageIndex).toBe(2);
  });
});
