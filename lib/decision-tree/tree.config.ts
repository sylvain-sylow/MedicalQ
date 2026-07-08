// lib/decision-tree/tree.config.ts
// Arbre décisionnel médical Sylow — Niveaux 0 à 3
// IDs alignés sur docs/Sylow_bareme_etoiles.json quand la question est notée.
// RÈGLE : ce fichier ne contient jamais de données de scoring (seuils, étoiles).
// Le scoring est dans lib/scoring/engine.ts — séparation stricte.

export type QuestionType =
  | "yesno"           // Oui/Non
  | "slider"          // Réglette numérique
  | "dual_slider"     // Double réglette (taille + poids)
  | "multiselect"     // Grille de cartes à sélection multiple
  | "select"          // Choix unique
  | "date"            // Sélecteur de date
  | "period"          // Période (date début + fin)
  | "text"            // Saisie libre
  | "frequency"       // Curseur de fréquence
  | "scale"           // Échelle numérique (ex. 1–9)
  | "text_attachment"; // Texte + pièce jointe

export interface QuestionOption {
  value: string;
  label: string;
  icon?: string;
}

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue?: number;
}

export interface Question {
  id: string;
  level: 0 | 1 | 2 | 3;
  module?: string;          // ex. "cardiaque", "neurologie"…
  text: string;             // Texte reformulé en langage assuré
  textSensitive?: boolean;  // true → ton épuré, pas d'animation
  type: QuestionType;
  options?: QuestionOption[];
  slider?: SliderConfig;
  /** Questions suivantes selon la valeur répondue — clé = valeur ou "default" */
  next?: Record<string, string | null>;
  /** null = fin du questionnaire pour ce chemin */
  required?: boolean;
  hint?: string;
  allowUpload?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// NIVEAU 0 — Identité, pré-filtres légaux, consentements
// ─────────────────────────────────────────────────────────────────────────────

export const LEVEL0_QUESTIONS: Question[] = [
  {
    id: "q00_prenom",
    level: 0,
    text: "Quel est votre prénom ?",
    type: "text",
    next: { default: "q00_nom" },
    required: true,
  },
  {
    id: "q00_nom",
    level: 0,
    text: "Quel est votre nom de famille ?",
    type: "text",
    next: { default: "q00_naissance_date" },
    required: true,
  },
  {
    id: "q00_naissance_date",
    level: 0,
    text: "Quelle est votre date de naissance ?",
    type: "date",
    next: { default: "q00_naissance_lieu" },
    required: true,
  },
  {
    id: "q00_naissance_lieu",
    level: 0,
    text: "Dans quelle ville êtes-vous né(e) ?",
    type: "text",
    next: { default: "q00_lemoine" },
    required: true,
  },
  // Pré-filtre loi Lemoine (art. L. 1141-5 CSP) — age ≤ 60 ans ET capital ≤ 200 000 €
  {
    id: "q00_lemoine",
    level: 0,
    text: "Votre prêt se termine-t-il avant vos 60 ans ET le capital assuré est-il inférieur ou égal à 200 000 € ?",
    hint: "Si oui, vous bénéficiez de la loi Lemoine : votre questionnaire médical est simplifié.",
    type: "yesno",
    next: { oui: "q00_consentement_sante", non: "q00_consentement_sante" },
    required: true,
  },
  // Consentement santé (obligatoire avant toute question médicale)
  {
    id: "q00_consentement_sante",
    level: 0,
    text: "Acceptez-vous de répondre à ce questionnaire de santé ? Vos réponses seront strictement confidentielles et utilisées uniquement pour l'étude de votre dossier d'assurance emprunteur.",
    type: "yesno",
    next: { oui: "q00_aeras", non: null },
    required: true,
  },
  // Encart AERAS (affiché à tous — information obligatoire)
  {
    id: "q00_aeras",
    level: 0,
    text: "Avez-vous eu connaissance de la convention AERAS (s'Assurer et Emprunter avec un Risque Aggravé de Santé) ?",
    hint: "Cette convention vous permet d'accéder à l'assurance même en cas de problème de santé grave. Elle s'applique automatiquement à votre dossier.",
    type: "yesno",
    next: { default: "q01_silhouette_taille" },
    required: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NIVEAU 1 — Questions générales (tous les assurés, sauf exonération Lemoine)
// ─────────────────────────────────────────────────────────────────────────────

export const LEVEL1_QUESTIONS: Question[] = [
  // Q1 — Taille + Poids (double réglette → IMC calculé serveur-side)
  {
    id: "q01_silhouette_taille",
    level: 1,
    module: "poids_silhouette",
    text: "Quelle est votre taille ?",
    type: "slider",
    slider: { min: 100, max: 220, step: 1, unit: "cm", defaultValue: 170 },
    next: { default: "q01_silhouette_poids" },
    required: true,
  },
  {
    id: "q01_silhouette_poids",
    level: 1,
    module: "poids_silhouette",
    text: "Quel est votre poids actuel ?",
    hint: "Votre IMC sera calculé automatiquement. Il n'apparaîtra pas sur votre questionnaire.",
    type: "slider",
    slider: { min: 30, max: 250, step: 1, unit: "kg", defaultValue: 70 },
    // Branchement géré par engine.ts (computeIMC) — "obese" si IMC >= 30
    next: { default: "q01_tabac", obese: "q01_silhouette_poids_max" },
    required: true,
  },
  {
    id: "q01_silhouette_poids_max",
    level: 1,
    module: "poids_silhouette",
    text: "Quel est le poids maximum que vous ayez jamais atteint ?",
    type: "slider",
    slider: { min: 30, max: 300, step: 1, unit: "kg", defaultValue: 80 },
    next: { default: "q01_tabac" },
    required: true,
  },

  // Q2 — Tabac
  {
    id: "q01_tabac",
    level: 1,
    module: "tabac",
    text: "Fumez-vous ou avez-vous fumé ?",
    type: "select",
    options: [
      { value: "jamais",        label: "Je n'ai jamais fumé" },
      { value: "actuel",        label: "Je fume actuellement" },
      { value: "ex",            label: "J'ai arrêté de fumer" },
    ],
    next: {
      jamais: "q01_alcool",
      actuel: "q01_tabac_quantite",
      ex:     "q01_tabac_arret",
    },
    required: true,
  },
  {
    id: "q01_tabac_quantite",
    level: 1,
    module: "tabac",
    text: "Combien de cigarettes fumez-vous par jour en moyenne ?",
    type: "slider",
    slider: { min: 1, max: 60, step: 1, unit: "cigarettes/jour", defaultValue: 10 },
    next: { default: "q01_tabac_duree" },
    required: true,
  },
  {
    id: "q01_tabac_duree",
    level: 1,
    module: "tabac",
    text: "Depuis combien d'années fumez-vous ?",
    type: "slider",
    slider: { min: 1, max: 60, step: 1, unit: "ans", defaultValue: 10 },
    next: { default: "q01_alcool" },
    required: true,
  },
  {
    id: "q01_tabac_arret",
    level: 1,
    module: "tabac",
    text: "Quand avez-vous arrêté de fumer ?",
    type: "date",
    next: { default: "q01_tabac_quantite" },
    required: true,
  },

  // Q3 — Alcool
  {
    id: "q01_alcool",
    level: 1,
    module: "alcool",
    text: "Consommez-vous des boissons alcoolisées ?",
    type: "yesno",
    next: { oui: "q01_alcool_frequence", non: "q01_tension" },
    required: true,
  },
  {
    id: "q01_alcool_frequence",
    level: 1,
    module: "alcool",
    text: "En moyenne, combien de verres consommez-vous par semaine ?",
    hint: "1 verre = 1 bière, 1 verre de vin, 1 apéritif ou 1 verre de spiritueux.",
    type: "slider",
    slider: { min: 1, max: 70, step: 1, unit: "verres/semaine", defaultValue: 7 },
    next: { default: "q01_tension" },
    required: true,
  },

  // Q4 — Tension artérielle
  {
    id: "q01_tension",
    level: 1,
    module: "cardiovasculaire",
    text: "Avez-vous de l'hypertension artérielle ou prenez-vous un traitement pour la tension ?",
    type: "yesno",
    next: { oui: "q01_tension_traitement", non: "q01_cholesterol" },
    required: true,
  },
  {
    id: "q01_tension_traitement",
    level: 1,
    module: "cardiovasculaire",
    text: "Prenez-vous un traitement médical pour votre tension ?",
    type: "yesno",
    next: { default: "q01_cholesterol" },
    required: true,
  },

  // Q5 — Cholestérol
  {
    id: "q01_cholesterol",
    level: 1,
    module: "cardiovasculaire",
    text: "Avez-vous un excès de cholestérol nécessitant un traitement médical ?",
    type: "yesno",
    next: { default: "q01_diabete" },
    required: true,
  },

  // Q6 — Diabète
  {
    id: "q01_diabete",
    level: 1,
    module: "diabete",
    text: "Avez-vous du diabète ou un excès de sucre dans le sang ?",
    type: "yesno",
    next: { oui: "q01_diabete_type", non: "q01_hospitalisation" },
    required: true,
  },
  {
    id: "q01_diabete_type",
    level: 1,
    module: "diabete",
    text: "Quel type de diabète avez-vous ?",
    type: "select",
    options: [
      { value: "type1",  label: "Diabète de type 1 (insulinodépendant)" },
      { value: "type2",  label: "Diabète de type 2" },
      { value: "autre",  label: "Autre ou je ne sais pas" },
    ],
    next: { default: "q01_hospitalisation" },
    required: true,
    allowUpload: true,
  },

  // Q7 — Hospitalisations récentes
  {
    id: "q01_hospitalisation",
    level: 1,
    text: "Avez-vous été hospitalisé(e) au moins une nuit au cours des 5 dernières années ?",
    hint: "Hors maternité, et hors chirurgie esthétique.",
    type: "yesno",
    next: { oui: "q01_hospitalisation_motif", non: "q01_arret_travail" },
    required: true,
  },
  {
    id: "q01_hospitalisation_motif",
    level: 1,
    text: "Pour quel motif avez-vous été hospitalisé(e) ?",
    type: "text",
    next: { default: "q01_arret_travail" },
    required: true,
    allowUpload: true,
  },

  // Q8 — Arrêts de travail
  {
    id: "q01_arret_travail",
    level: 1,
    text: "Avez-vous eu un arrêt de travail de plus de 15 jours consécutifs au cours des 3 dernières années ?",
    type: "yesno",
    next: { oui: "q01_arret_travail_motif", non: "q01_traitement_long" },
    required: true,
  },
  {
    id: "q01_arret_travail_motif",
    level: 1,
    text: "Pour quel motif avez-vous eu cet arrêt de travail ?",
    type: "text",
    next: { default: "q01_traitement_long" },
    required: true,
  },

  // Q9 — Traitement médical de longue durée
  {
    id: "q01_traitement_long",
    level: 1,
    text: "Suivez-vous actuellement un traitement médical de façon régulière (depuis plus de 3 mois) ?",
    hint: "Hors pilule contraceptive et vitamine D.",
    type: "yesno",
    next: { oui: "q01_traitement_long_detail", non: "q01_chirurgie" },
    required: true,
  },
  {
    id: "q01_traitement_long_detail",
    level: 1,
    text: "Quel est ce traitement et depuis combien de temps le prenez-vous ?",
    type: "text",
    next: { default: "q01_chirurgie" },
    required: true,
  },

  // Q10 — Chirurgie
  {
    id: "q01_chirurgie",
    level: 1,
    text: "Avez-vous subi une intervention chirurgicale au cours des 5 dernières années ?",
    hint: "Hors chirurgie esthétique.",
    type: "yesno",
    next: { oui: "q01_chirurgie_detail", non: "q11_systemes" },
    required: true,
  },
  {
    id: "q01_chirurgie_detail",
    level: 1,
    text: "Quelle intervention et pour quel motif ?",
    type: "text",
    next: { default: "q11_systemes" },
    required: true,
  },

  // ─── Q11 — Sélection des 14 systèmes (point de branchement vers N3) ───────
  {
    id: "q11_systemes",
    level: 1,
    text: "Avez-vous ou avez-vous eu des problèmes de santé liés à l'un de ces domaines ?",
    hint: "Sélectionnez tout ce qui s'applique. Si rien ne s'applique, cochez « Aucun ».",
    type: "multiselect",
    options: [
      { value: "coeur",        label: "Cœur et vaisseaux",         icon: "heart" },
      { value: "neurologie",   label: "Cerveau et système nerveux", icon: "brain" },
      { value: "respiratoire", label: "Poumons et respiration",     icon: "lungs" },
      { value: "digestif",     label: "Estomac et intestins",       icon: "stomach" },
      { value: "foie",         label: "Foie et vésicule",           icon: "liver" },
      { value: "reins",        label: "Reins et voies urinaires",   icon: "kidney" },
      { value: "osteo",        label: "Os, articulations, muscles", icon: "bone" },
      { value: "psy",          label: "Santé mentale",              icon: "mind" },
      { value: "cancer",       label: "Cancer ou tumeur",           icon: "cell" },
      { value: "diabete",      label: "Diabète (détail)",           icon: "glucose" },
      { value: "thyroide",     label: "Thyroïde ou hormones",       icon: "thyroid" },
      { value: "sang",         label: "Sang et hémopathies",        icon: "blood" },
      { value: "immuno",       label: "Maladies auto-immunes",      icon: "shield" },
      { value: "aucun",        label: "Aucun de ces éléments",      icon: "check" },
    ],
    // Le moteur engine.ts gère le branchement multi-valeurs vers les modules N3
    next: { default: "q_modes_vie_sport" },
    required: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE MODES DE VIE — après Q11 ou en parallèle
// ─────────────────────────────────────────────────────────────────────────────

export const MODES_VIE_QUESTIONS: Question[] = [
  {
    id: "q_modes_vie_sport",
    level: 2,
    module: "modes_vie",
    text: "Pratiquez-vous des sports à risques ?",
    hint: "Parachutisme, plongée sous-marine, alpinisme, sports mécaniques, sports de combat...",
    type: "yesno",
    next: { oui: "q_modes_vie_sport_detail", non: "q_modes_vie_profession" },
    required: true,
  },
  {
    id: "q_modes_vie_sport_detail",
    level: 2,
    module: "modes_vie",
    text: "Quel(s) sport(s) à risques pratiquez-vous et à quelle fréquence ?",
    type: "text",
    next: { default: "q_modes_vie_profession" },
    required: true,
  },
  {
    id: "q_modes_vie_profession",
    level: 2,
    module: "modes_vie",
    text: "Votre profession comporte-t-elle des risques particuliers ?",
    hint: "Travail en hauteur, milieux dangereux, exposition à des produits chimiques ou toxiques...",
    type: "yesno",
    next: { oui: "q_modes_vie_profession_detail", non: "q_modes_vie_fin" },
    required: true,
  },
  {
    id: "q_modes_vie_profession_detail",
    level: 2,
    module: "modes_vie",
    text: "Décrivez votre profession et les risques associés.",
    type: "text",
    next: { default: "q_modes_vie_fin" },
    required: true,
  },
  {
    id: "q_modes_vie_fin",
    level: 2,
    module: "modes_vie",
    text: "Avez-vous des voyages fréquents dans des pays à risques sanitaires (zones de conflit, épidémies) ?",
    type: "yesno",
    next: { default: "__END__" },
    required: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NIVEAU 3 — 21 modules spécialisés
// Seule la structure de branchement est ici.
// Le contenu détaillé des questions provient de docs/questionnaires_specialises.json
// et est résolu dynamiquement par engine.ts.
// ─────────────────────────────────────────────────────────────────────────────

export interface N3Module {
  id: string;
  trigger: string;           // valeur de q11_systemes qui déclenche ce module
  bareme_key: string;        // clé dans Sylow_bareme_etoiles.json
  label: string;
  firstQuestionId: string;   // première question du module
  sensitiveModule: boolean;  // true → ton épuré (psychiatrie)
}

export const N3_MODULES: N3Module[] = [
  // Cardiovasculaire
  { id: "cardiaque_ischemique",    trigger: "coeur",        bareme_key: "cardiovasculaire",   label: "Maladie coronarienne / infarctus",           firstQuestionId: "q3_card_isch_diagnostic",  sensitiveModule: false },
  { id: "cardiaque_non_ischemique",trigger: "coeur",        bareme_key: "cardiovasculaire",   label: "Trouble du rythme / valvulopathie",          firstQuestionId: "q3_card_noisch_diagnostic", sensitiveModule: false },
  { id: "hypertension",            trigger: "coeur",        bareme_key: "cardiovasculaire",   label: "Hypertension artérielle (détail)",           firstQuestionId: "q3_hta_type",              sensitiveModule: false },
  { id: "chirurgie_valvulaire",    trigger: "coeur",        bareme_key: "cardiovasculaire",   label: "Chirurgie valvulaire",                       firstQuestionId: "q3_valv_type_intervention", sensitiveModule: false },
  { id: "transplantation_cardiaque",trigger: "coeur",       bareme_key: "cardiovasculaire",   label: "Transplantation cardiaque",                  firstQuestionId: "q3_tc_affection",          sensitiveModule: false },
  // Neurologie
  { id: "neurologie",              trigger: "neurologie",   bareme_key: "neurologie",         label: "Atteinte neurologique (AVC, SEP, Parkinson…)",firstQuestionId: "q3_neuro_diagnostic",     sensitiveModule: false },
  { id: "epilepsie",               trigger: "neurologie",   bareme_key: "neurologie",         label: "Épilepsie",                                   firstQuestionId: "q3_epi_diagnostic",       sensitiveModule: false },
  // Respiratoire
  { id: "respiratoire",            trigger: "respiratoire", bareme_key: "respiratoire",       label: "Atteinte respiratoire",                      firstQuestionId: "q3_resp_diagnostic",       sensitiveModule: false },
  { id: "apnees_sommeil",          trigger: "respiratoire", bareme_key: "respiratoire",       label: "Syndrome d'apnées du sommeil",               firstQuestionId: "q3_apn_diagnostic",        sensitiveModule: false },
  { id: "mucoviscidose",           trigger: "respiratoire", bareme_key: "respiratoire",       label: "Mucoviscidose",                              firstQuestionId: "q3_muco_evaluation",       sensitiveModule: false },
  // Foie / digestif
  { id: "hepatique",               trigger: "foie",         bareme_key: "hepato_digestif",    label: "Atteinte hépatique",                         firstQuestionId: "q3_hep_diagnostic",        sensitiveModule: false },
  { id: "crohn_colite",            trigger: "digestif",     bareme_key: "hepato_digestif",    label: "Maladie de Crohn / Colite ulcéreuse",        firstQuestionId: "q3_crohn_localisation",    sensitiveModule: false },
  // Reins
  { id: "dialyse",                 trigger: "reins",        bareme_key: "nephro_urologique",  label: "Dialyse",                                    firstQuestionId: "q3_dialyse_type",          sensitiveModule: false },
  { id: "transplantation_renale",  trigger: "reins",        bareme_key: "nephro_urologique",  label: "Transplantation rénale",                     firstQuestionId: "q3_tr_cause_irt",          sensitiveModule: false },
  { id: "lithiase",                trigger: "reins",        bareme_key: "nephro_urologique",  label: "Lithiase urinaire",                          firstQuestionId: "q3_lith_localisation",     sensitiveModule: false },
  { id: "prostate_urinaire",       trigger: "reins",        bareme_key: "nephro_urologique",  label: "Atteinte prostatique / urinaire",            firstQuestionId: "q3_pros_glomerulaire",     sensitiveModule: false },
  // Ostéo-articulaire
  { id: "osteo_articulaire",       trigger: "osteo",        bareme_key: "osteo_articulaire",  label: "Atteinte ostéo-articulaire",                 firstQuestionId: "q3_osteo_diagnostic",      sensitiveModule: false },
  // Psychiatrie
  { id: "psychisme",               trigger: "psy",          bareme_key: "psychisme",          label: "Troubles du psychisme",                      firstQuestionId: "q3_psy_diagnostic",        sensitiveModule: true  },
  // Cancer / tumeurs
  { id: "tumeurs",                 trigger: "cancer",       bareme_key: "tumeurs",            label: "Cancer ou tumeur",                           firstQuestionId: "q3_tum_diagnostic",        sensitiveModule: false },
  { id: "lymphome_hemopathie",     trigger: "sang",         bareme_key: "tumeurs",            label: "Lymphome / hémopathie maligne",              firstQuestionId: "q3_lymph_diagnostic",      sensitiveModule: false },
  // Endocrinologie
  { id: "diabete",                 trigger: "diabete",      bareme_key: "diabete",            label: "Diabète (détail complet)",                   firstQuestionId: "q3_diab_diagnostic",       sensitiveModule: false },
  { id: "thyroide",                trigger: "thyroide",     bareme_key: "endocrinologie",     label: "Atteinte thyroïdienne / hormonale",          firstQuestionId: "q3_thy_diagnostic",        sensitiveModule: false },
  { id: "obesite",                 trigger: "__imc_obese__",bareme_key: "poids_silhouette",   label: "Obésité (IMC ≥ 30)",                         firstQuestionId: "q3_obe_mesures",           sensitiveModule: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Résolution : question par ID (index global)
// ─────────────────────────────────────────────────────────────────────────────

const ALL_QUESTIONS: Question[] = [
  ...LEVEL0_QUESTIONS,
  ...LEVEL1_QUESTIONS,
  ...MODES_VIE_QUESTIONS,
];

export function getQuestionById(id: string): Question | undefined {
  const found = ALL_QUESTIONS.find((q) => q.id === id);
  if (found) return found;

  // Stub générique pour les questions N3 non encore développées
  // Permet au moteur et aux tests de fonctionner avant que le contenu soit rédigé
  const n3Module = N3_MODULES.find((m) => m.firstQuestionId === id);
  if (n3Module || id.startsWith("q3_")) {
    return {
      id,
      level: 3,
      module: n3Module?.id ?? id.replace(/^q3_/, "").split("_")[0],
      textSensitive: n3Module?.sensitiveModule ?? false,
      text: `[Module N3 — ${id}] — Contenu à développer en J2`,
      type: "text",
      next: { default: END_MARKER },
      required: true,
      allowUpload: true,
    };
  }

  return undefined;
}

export function getN3ModuleByTrigger(trigger: string): N3Module[] {
  return N3_MODULES.filter((m) => m.trigger === trigger);
}

/** ID de la première question du parcours */
export const FIRST_QUESTION_ID = "q00_prenom";

/** Marqueur de fin de questionnaire */
export const END_MARKER = "__END__";
