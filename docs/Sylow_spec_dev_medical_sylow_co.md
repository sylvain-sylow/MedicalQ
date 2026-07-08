# medical.sylow.co — Spécification de développement

**Questionnaire de santé digital adaptatif — Assurance emprunteur**
Document de lancement destiné au développement assisté par IA (Antigravity / VS Code + agent).
Version 1.0 — Juillet 2026 — Propriété Sylow & Co (France / Luxembourg)

---

## 1. Vision produit

Construire une application web sur **medical.sylow.co** qui transforme le questionnaire de santé
en une expérience fluide, élégante et rassurante :

- L'assuré répond à **une seule question à la fois**, en plein écran, avec des animations
  soignées et des contrôles tactiles (réglettes, curseurs, cartes à sélectionner).
- Le parcours est **adaptatif** : un profil sain traverse le questionnaire en quelques minutes,
  un profil complexe est routé automatiquement vers les modules d'approfondissement pertinents.
- Le **scoring en étoiles est strictement invisible pour l'assuré**. Il n'apparaît que dans le
  rapport final consulté par le médecin conseil. Côté client : aucun jugement de santé,
  aucun indicateur de "bonne" ou "mauvaise" réponse — uniquement une progression de parcours.
- Le médecin conseil dispose d'un **back-office complet** : consultation des réponses,
  dossier PDF (synthèse + détails), scoring étoilé par rubrique, demande d'examens complémentaires.

### Les deux interfaces

| | Espace Assuré | Espace Médecin Conseil |
|---|---|---|
| URL | `medical.sylow.co` | `medical.sylow.co/praticien` |
| Authentification | Téléphone + OTP SMS | Email + mot de passe + 2FA obligatoire |
| Ton | Chaleureux, ludique, rassurant | Sobre, dense, professionnel |
| Scoring visible | **Jamais** | Oui (étoiles par rubrique + score global) |

---

## 2. Périmètre fonctionnel — les 4 phases

### Phase 1 — Inscription & authentification
1. Landing minimaliste : logo Sylow, promesse ("Votre déclaration de santé, simplement"), CTA unique.
2. Saisie du numéro de téléphone → envoi OTP 6 chiffres par SMS (validité 5 min, 3 tentatives).
3. Création du dossier : identité (nom, prénom, date et lieu de naissance), pièce d'identité
   (nature + numéro), adresse, profession.
4. **Pré-filtre loi Lemoine** : montant assuré et âge en fin de prêt. Si part assurée ≤ 200 000 €
   et fin de prêt avant le 60ᵉ anniversaire → **aucun questionnaire médical** ; parcours court
   de confirmation et sortie. Ce contrôle est bloquant et tracé.
5. **Consentement données de santé** (modèle : page consentement du rapport médical Allianz) :
   choix explicite OUI/NON, mention du caractère bloquant du refus, durées de conservation
   (6 mois si non-adhésion), coordonnées DPO, droit de retrait. Horodaté et versionné.
6. **Encart droit à l'oubli (convention AERAS)** affiché AVANT toute question de pathologie,
   avec lien vers le document d'information. L'assuré confirme en avoir pris connaissance.
7. Reprise de session : le dossier est sauvegardé à chaque réponse ; l'assuré peut revenir
   plus tard avec un nouvel OTP et reprendre exactement où il s'était arrêté.

### Phase 2 — Collecte médicale & modes de vie
Moteur adaptatif à 4 niveaux (arbre de décision propriétaire Sylow, cf. document
`Sylow_arbre_decision_questionnaire_sante.md`) :

- **Niveau 0** — Identification, consentements, pré-filtre Lemoine (phase 1 ci-dessus).
- **Niveau 1** — Filtres généraux à seuils numériques : taille/poids (**IMC calculé en temps
  réel**, déclencheur automatique du module correspondant en cas de franchissement de seuil),
  variation de poids > 5 kg sur 12 mois, tabac, alcool (quantifié par type de boisson),
  stupéfiants, arrêts de travail > 21 jours, traitements en cours et > 21 jours,
  prise en charge à 100 %, pension/rente d'invalidité, AAH, hospitalisations,
  sérologies VIH/hépatites (préciser : répondre OUI uniquement si résultat positif),
  hospitalisation ou intervention programmée.
- **Niveau 2** — **Q11, point de branchement principal** : déclaration multi-systèmes sur
  les **14 systèmes corporels** (infectieux, endocrinien/métabolisme, sang, psychiatrie,
  sommeil, neurologie/muscles, ORL/yeux, cardio-vasculaire, respiratoire, digestif,
  urinaire/génital, peau, ostéo-articulaire, auto-immun/tumeurs). Présentation en grille
  de cartes illustrées à sélection multiple.
- **Niveau 3** — Routage vers les **21 modules spécialisés** avec seuils de matérialité
  internes (🔻). Chaque déclaration positive collecte systématiquement :
  *nature, date de début, date de fin/guérison, traitement, interventions, séquelles* —
  et propose de **joindre un document** (compte rendu, bilan, ordonnance).
- **Module "Modes de vie & activités"** (nouveau, calqué sur la section 1 du questionnaire
  financier Allianz) : séjours hors zone géographique de référence, aviation privée,
  deux-roues motorisé, sports (liste des sports à approfondissement : plongée, alpinisme,
  sports mécaniques, ski hors-piste, parachutisme…), activités dangereuses, professions à risque.

Règle transverse : **harmoniser et documenter les fenêtres temporelles** par type de question
(12 mois / 5 ans / 10 ans / 15 ans) dans un fichier de configuration unique, pour que toutes
les synthèses soient comparables.

Règle rédactionnelle : **toutes les questions en langage courant** (reformulations plain-language
du document `Sylow_trame_scoring_etoiles.md`), le terme médical exact étant conservé en
métadonnée pour la synthèse. Les modules sensibles (psychiatrie, notamment tentative de
suicide / idées suicidaires) adoptent un **ton strictement neutre** : pas d'illustration
ludique, pas d'animation festive, formulation validée par le médecin conseil.

### Phase 3 — Retranscription de synthèse
- Génération automatique du **rapport de synthèse structuré** à la clôture du questionnaire.
- Pour chaque déclaration positive : rubrique, détails collectés, documents joints,
  **liste des pièces justificatives manquantes à réclamer** (générée par module — ex. EFR
  pour l'asthme, HbA1c pour le diabète, comptes rendus opératoires et histologiques
  pour toute chirurgie).
- Signature électronique de la déclaration : mention de sincérité, rappel des articles
  L113-8 et L113-9 du Code des assurances, horodatage, validité 4 mois.

### Phase 4 — Analyse & scoring (back-office uniquement)
Moteur de scoring exécuté **côté serveur, jamais exposé à l'assuré** (ni dans l'UI, ni dans
les réponses API du parcours client) :

- Échelle 1 à 5 étoiles (5 = bonne santé, 1 = santé dégradée).
- **Bande de tolérance de 15 %** au-dessus du seuil normal préservant les 5 étoiles
  (exemple canonique : IMC 5★ jusqu'à 34,5 = 30 × 1,15).
- **Score thématique = minimum** des scores des indicateurs de la rubrique.
- **Score global = moyenne géométrique** des scores thématiques (logique multiplicative,
  résultat maintenu sur l'échelle 1–5).
- Les items en attente de validation par le médecin conseil sont marqués `pending_validation`
  dans la configuration du scoring et signalés dans le back-office.

---

## 3. Stack technique recommandée

| Couche | Choix | Justification |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | SSR pour le back-office, SPA fluide côté assuré, un seul repo |
| UI | **Tailwind CSS + shadcn/ui + Framer Motion** | Design system rapide + animations de qualité pour le côté ludique |
| Base de données | **PostgreSQL managé — OVHcloud HDS (France)** | Données de santé → hébergement HDS obligatoire en France ; OVHcloud est certifié HDS |
| ORM | Prisma | Migrations versionnées, typage bout en bout |
| Auth assuré | **OTP SMS via OVHcloud (API SMS)** (derrière une interface `SmsProvider`) + session JWT courte (httpOnly, secure) | Même périmètre HDS ; vérifier la couverture +33 et +352 en recette |
| Auth médecin | Credentials + TOTP (2FA obligatoire) | |
| Stockage documents | **Object Storage OVHcloud** (S3-compatible, même périmètre HDS), chiffrement au repos, URLs signées à durée courte | |
| PDF | Puppeteer (rendu HTML → PDF) ou react-pdf | Le template HTML de synthèse sert aussi de prévisualisation |
| Validation | Zod (schémas partagés client/serveur) | |
| Tests | Vitest + Playwright (parcours E2E complet du questionnaire) | |

> **Point non négociable** : les données de santé de résidents français doivent être hébergées
> chez un hébergeur certifié HDS. **Retenu : OVHcloud (France)** pour la base, les fichiers
> et les sauvegardes. Archiver l'attestation HDS d'OVHcloud dans le registre de conformité.

---

## 4. Arborescence du projet

```
medical-sylow/
├── app/
│   ├── (assure)/
│   │   ├── page.tsx                  # Landing
│   │   ├── connexion/                # Téléphone + OTP
│   │   ├── dossier/                  # Identité, Lemoine, consentements
│   │   ├── questionnaire/            # Moteur une-question-à-la-fois
│   │   └── confirmation/             # Signature + récapitulatif (SANS scoring)
│   ├── praticien/
│   │   ├── connexion/                # Email + 2FA
│   │   ├── dossiers/                 # Liste + filtres + statuts
│   │   ├── dossiers/[id]/            # Détail : réponses, docs, scoring ★
│   │   └── dossiers/[id]/examens/    # Demandes d'examens complémentaires
│   └── api/
│       ├── auth/otp/                 # send / verify
│       ├── questionnaire/            # next-question, answer, resume
│       ├── documents/                # upload (URL signée), list, download
│       ├── scoring/                  # ADMIN ONLY — jamais appelé côté assuré
│       ├── synthese/[id]/pdf/
│       └── examens/
├── lib/
│   ├── decision-tree/
│   │   ├── tree.config.ts            # Arbre complet niveaux 0→3 (source de vérité)
│   │   ├── engine.ts                 # getNextQuestion(state) → Question | End
│   │   ├── triggers.ts               # Seuils (IMC, etc.) + déclenchement modules
│   │   └── timeframes.ts             # Fenêtres temporelles harmonisées
│   ├── scoring/
│   │   ├── stars.ts                  # Tolérance 15 %, min thématique, moy. géométrique
│   │   └── config.ts                 # Barèmes par indicateur + flags pending_validation
│   ├── pdf/
│   │   └── synthese-template.tsx
│   └── security/                     # Chiffrement champ, audit log, rate limiting
├── prisma/schema.prisma
└── components/
    ├── questionnaire/                # QuestionCard, Slider, ChoiceCards, ProgressBar…
    └── praticien/                    # StarRating, AnswerTable, ExamRequestForm…
```

---

## 5. Interface assuré — le soin graphique est une exigence, pas un bonus

### 5.1 Direction artistique
- **Une question par écran**, centrée, typographie généreuse (question en 28–32 px),
  beaucoup d'espace blanc. Aucun formulaire multi-champs visible d'un coup.
- Palette apaisante et premium : fond crème/ivoire, encre bleu nuit, un accent chaleureux
  (à caler sur la charte Sylow & Co). Mode sombre optionnel. Jamais de rouge "erreur"
  sur une réponse de santé — le rouge est réservé aux erreurs techniques.
- Transitions **Framer Motion** entre questions : glissement horizontal doux (300–400 ms,
  easing `easeOut`), la question sortante s'efface, l'entrante arrive. Retour arrière
  possible avec l'animation inverse.
- Micro-interactions : bouton "Continuer" qui ne s'active qu'une fois la réponse donnée,
  léger retour haptique sur mobile, coche animée à la validation.
- **Barre de progression** en haut : par grandes étapes ("Vous", "Votre quotidien",
  "Votre santé", "Finalisation") — jamais un pourcentage précis, car le parcours est
  adaptatif et le nombre de questions varie.
- Le côté ludique vient de la **fluidité et de la progression**, pas de la notation :
  étapes franchies célébrées sobrement ("Plus que quelques questions"), illustrations
  légères sur les écrans de transition, jamais sur les questions médicales sensibles.
- Accessibilité : WCAG 2.1 AA, navigation clavier complète, tailles de cibles ≥ 44 px,
  contraste vérifié. Mobile-first : la majorité des assurés répondront sur téléphone.

### 5.2 Types de contrôles de réponse

| Type | Usage | Détails d'implémentation |
|---|---|---|
| **Réglette / slider** | Taille, poids, quantités (cigarettes/jour, cl d'alcool par type), années | Grosse poignée tactile, valeur affichée en direct au-dessus de la poignée, pas d'incrément fin au clavier (+/–), bornes réalistes, saisie numérique alternative accessible d'un tap |
| **Double réglette taille + poids** | Niveau 1 | **IMC recalculé en direct** mais AFFICHÉ NULLE PART côté assuré — le calcul sert uniquement au moteur de déclenchement |
| **Cartes OUI / NON** | Questions binaires | Deux grandes cartes cliquables, sélection animée |
| **Grille de cartes illustrées** | Q11 — 14 systèmes corporels | Sélection multiple, icônes sobres par système, bouton "Aucun de ces éléments" bien visible |
| **Curseur de fréquence** | "Jamais / Occasionnellement / Régulièrement / Quotidiennement" | Slider à crans avec labels |
| **Sélecteur de date/période** | Débuts, fins, durées | Roues mois/année (le jour exact est rarement nécessaire) |
| **Champ texte court** | Nom d'un traitement, d'une maladie | Autocomplétion douce si référentiel disponible, sinon libre |
| **Zone de dépôt de document** | Sur chaque déclaration positive | Voir § 7 |

### 5.3 Règles d'or côté assuré
1. **Aucune étoile, aucun score, aucun indicateur de santé** ne transite vers le client :
   ni dans le DOM, ni dans les réponses API, ni dans le localStorage. Le scoring est
   calculé exclusivement côté serveur, dans des endpoints réservés au rôle praticien.
2. Chaque réponse est **persistée immédiatement** (autosave) — une coupure réseau ou
   une fermeture d'onglet ne fait rien perdre.
3. L'assuré peut **revenir en arrière** et corriger ; chaque modification est journalisée
   (version précédente conservée pour l'audit).
4. Les questions sensibles (module psychiatrie, notamment TS/idées suicidaires) :
   écran épuré, ton neutre, pas d'illustration, mention discrète de confidentialité.

---

## 6. Moteur de questionnaire adaptatif

Le moteur est une **machine à états pure** : `getNextQuestion(answers) → Question | End`.

```ts
// lib/decision-tree/tree.config.ts (extrait de structure)
type Question = {
  id: string;                    // ex. "N1_POIDS", "N3_CARDIO_HTA_TRAITEMENT"
  level: 0 | 1 | 2 | 3;
  module?: string;               // ex. "cardio", "psy", "modes_de_vie"
  wording: string;               // formulation plain-language (affichée)
  medicalTerm?: string;          // terme exact (synthèse uniquement)
  input: "slider" | "yesno" | "cards_multi" | "frequency" | "date" | "text";
  sliderConfig?: { min: number; max: number; step: number; unit: string };
  timeframe?: "12m" | "5y" | "10y" | "15y";   // depuis timeframes.ts
  sensitive?: boolean;           // désactive toute touche ludique
  allowUpload?: boolean;         // propose le dépôt de document
  triggers?: Trigger[];          // ex. IMC > seuil → module surpoids
  materiality?: "low" | "medium" | "high";    // seuils 🔻
};
```

- L'arbre complet (niveaux 0–3, Q11, 21 modules, seuils de matérialité) est transcrit
  depuis `Sylow_arbre_decision_questionnaire_sante.md` dans `tree.config.ts`,
  **unique source de vérité**, testée unitairement (chaque chemin de branchement a un test).
- Les déclencheurs numériques (IMC avec bande de tolérance, seuils de consommation…)
  vivent dans `triggers.ts` et sont partagés avec le moteur de scoring pour garantir
  la cohérence seuils de routage ↔ seuils de notation.
- Le serveur ne renvoie au client **que la prochaine question** — jamais l'arbre entier
  (l'arbre est un actif propriétaire Sylow ; ne pas l'embarquer dans le bundle JS).

---

## 7. Documents joints

- Sur chaque déclaration positive marquée `allowUpload`, l'écran propose :
  *"Vous avez un compte rendu ou un résultat d'examen ? Ajoutez-le, cela accélérera
  l'étude de votre dossier."* — optionnel, jamais bloquant.
- Formats : PDF, JPG, PNG, HEIC. Taille max 15 Mo/fichier, 10 fichiers/dossier.
- Upload direct vers le stockage objet HDS via **URL signée** (le fichier ne transite
  pas par le serveur applicatif), scan antivirus (ClamAV) avant mise à disposition,
  chiffrement au repos.
- Chaque document est rattaché à la question/rubrique d'origine → il apparaît au bon
  endroit dans l'interface praticien et dans le PDF.
- Un écran récapitulatif avant signature liste les documents joints et les
  **pièces recommandées manquantes** (générées par module).

---

## 8. Modèle de données (Prisma — squelette)

```prisma
model Insured {
  id            String   @id @default(cuid())
  phone         String   @unique          // identifiant OTP
  firstName     String
  lastName      String
  birthDate     DateTime
  birthPlace    String
  idDocType     String?
  idDocNumber   String?                   // chiffré au niveau champ
  createdAt     DateTime @default(now())
  files         HealthFile[]
}

model HealthFile {                        // = un dossier / une demande
  id              String   @id @default(cuid())
  insuredId       String
  status          FileStatus              // DRAFT | IN_PROGRESS | SIGNED | UNDER_REVIEW | EXAMS_REQUESTED | CLOSED
  lemoineExempt   Boolean  @default(false)
  loanAmount      Decimal?
  loanEndAge      Int?
  consentHealth   Json?                   // {accepted, at, version}
  aerasAcked      DateTime?
  signedAt        DateTime?
  validUntil      DateTime?               // signature + 4 mois
  answers         Answer[]
  documents       Document[]
  scoring         Scoring?                // relation 1-1, back-office only
  examRequests    ExamRequest[]
  auditLogs       AuditLog[]
}

model Answer {
  id          String   @id @default(cuid())
  fileId      String
  questionId  String                      // clé de tree.config.ts
  value       Json                        // chiffré au niveau champ (AES-256-GCM)
  answeredAt  DateTime @default(now())
  revision    Int      @default(1)        // corrections journalisées
  @@unique([fileId, questionId, revision])
}

model Document {
  id          String   @id @default(cuid())
  fileId      String
  questionId  String?                     // rattachement à la rubrique
  storageKey  String                      // clé S3 HDS
  fileName    String
  mimeType    String
  sizeBytes   Int
  virusScan   ScanStatus @default(PENDING)
  uploadedAt  DateTime @default(now())
}

model Scoring {                           // JAMAIS exposé aux endpoints assuré
  id            String  @id @default(cuid())
  fileId        String  @unique
  perTheme      Json    // { cardio: 4, metabolisme: 5, ... }
  globalScore   Float   // moyenne géométrique, 1–5
  computedAt    DateTime
  engineVersion String
}

model ExamRequest {
  id          String   @id @default(cuid())
  fileId      String
  praticienId String
  exams       Json     // [{type, motif, rubrique}]
  message     String?
  status      ExamStatus // SENT | DOCS_RECEIVED | REVIEWED
  createdAt   DateTime @default(now())
}

model Praticien {
  id           String @id @default(cuid())
  email        String @unique
  passwordHash String
  totpSecret   String
  role         Role   // MEDECIN_CONSEIL | GESTIONNAIRE | ADMIN
}

model AuditLog {
  id        String   @id @default(cuid())
  fileId    String?
  actor     String                        // insuredId | praticienId | "system"
  action    String                        // "answer.update", "pdf.generate", "document.download"…
  meta      Json?
  at        DateTime @default(now())
}
```

---

## 9. Sécurité & conformité — checklist bloquante

- [ ] **Hébergement certifié HDS** pour base de données, stockage objet et sauvegardes.
- [ ] TLS partout, HSTS, en-têtes de sécurité (CSP stricte, X-Frame-Options…).
- [ ] **Chiffrement au niveau champ** (AES-256-GCM) pour les valeurs de réponses et
      identifiants sensibles ; clés gérées hors base (KMS/variables sécurisées, rotation).
- [ ] Sessions assuré courtes (30 min inactivité), praticien avec 2FA TOTP obligatoire.
- [ ] Rate limiting sur OTP (anti-brute-force) et sur les endpoints d'upload.
- [ ] **Journal d'audit exhaustif** : chaque lecture d'un dossier par un praticien est tracée.
- [ ] Séparation stricte des rôles côté API : les routes `scoring/*` et `praticien/*`
      vérifient le rôle serveur-side ; test automatisé qui échoue si un endpoint assuré
      renvoie un champ de scoring.
- [ ] RGPD : registre de traitement, consentement versionné, droit d'accès/rectification/
      effacement outillé. **Purge auto à 6 mois** des dossiers non aboutis ;
      **conservation sans limite tant que le contrat est en vigueur**, puis purge après le
      délai de prescription à la clôture du contrat (§ 14.6).
- [ ] Droit à l'oubli AERAS : encart obligatoire avant les pathologies ; la configuration
      des questions oncologie doit permettre l'exclusion des antécédents couverts.
- [ ] Mentions L113-8 / L113-9 à la signature ; validité de la déclaration : 4 mois.
- [ ] Aucune référence à des bibliothèques assureurs tierces dans les écrans, PDF et
      exports : l'ensemble est présenté comme le référentiel propriétaire Sylow & Co.

---

## 10. Interface médecin conseil (`/praticien`)

### 10.1 Liste des dossiers
Tableau dense et filtrable : nom, date de signature, statut, **score global en étoiles**,
alertes (rubriques ≤ 2★, documents manquants, examens en attente). Tri par priorité
(scores faibles d'abord). Recherche par nom/téléphone/numéro de dossier.

### 10.2 Détail d'un dossier
- **Bandeau de synthèse** : identité, âge, IMC, statut, score global ★★★★☆,
  date de validité de la déclaration.
- **Vue par rubriques** (les 14 systèmes + hygiène de vie + modes de vie/activités) :
  chaque rubrique affiche son **score en étoiles**, se déplie sur les questions/réponses
  détaillées (formulation plain-language + terme médical + valeur + date de réponse
  + révisions éventuelles), et regroupe les **documents joints** (prévisualisation
  intégrée, téléchargement tracé).
- **Indicateurs `pending_validation`** : les items du barème en attente de validation
  médicale sont signalés par un badge, avec un écran d'administration dédié pour les
  approuver/ajuster (le moteur consigne la version du barème utilisée pour chaque dossier).
- **Pièces manquantes** : liste générée automatiquement des justificatifs recommandés
  non fournis, par rubrique.

### 10.3 Génération du dossier PDF
Un bouton **"Générer le dossier PDF"** produit un document en trois parties :
1. **Page de synthèse** : identité, contexte du prêt, score global et tableau des scores
   par rubrique (étoiles), alertes de matérialité, liste des pièces manquantes.
2. **Détail intégral** : toutes les questions posées et réponses données, dans l'ordre
   du parcours, avec termes médicaux, dates et révisions.
3. **Annexes** : bordereau des documents joints (les fichiers eux-mêmes peuvent être
   fusionnés en annexe du PDF via pdf-lib, ou livrés en archive séparée).

Chaque génération est horodatée, versionnée et tracée dans l'audit log.

### 10.4 Demande d'examens complémentaires
- Formulaire : sélection d'examens dans un référentiel (bilan biologique, HbA1c, EFR,
  ECG, échographie, IRM, compte rendu spécialiste…), rubrique concernée, motif,
  message libre à l'assuré.
- L'envoi notifie l'assuré par SMS + email avec un lien de reconnexion (OTP) ouvrant
  un **parcours de dépôt ciblé** : uniquement les documents demandés, même UX de dépôt.
- Suivi des statuts : envoyé → documents reçus → examiné. Relance automatique à J+15.

---

## 11. Barème étoilé par question (grille de seuils éditable)

Chaque question notée possède sa **grille de seuils 1★ → 5★**, éditable par le médecin
conseil. Le classeur `Sylow_bareme_etoiles.xlsx` (livré avec cette spec) est la **source de
vérité fonctionnelle** de ce barème : une ligne par indicateur, colonnes de seuils, et une
colonne « Étoiles (test) » qui recalcule en direct pour vérifier le réglage.

### Type de barème selon la question

| Type | Questions concernées | Grille de seuils |
|---|---|---|
| `numeric_haut_mauvais` | IMC, tabac, alcool, tension… (valeur haute = défavorable) | Chaque colonne 5★→1★ = **valeur maximale** encore acceptée pour ce nombre d'étoiles. Bande de tolérance +15 % appliquée sur le seuil 5★ |
| `numeric_bas_mauvais` | IMC versant maigreur… (valeur basse = défavorable) | Chaque colonne = **valeur minimale** pour ce nombre d'étoiles |
| `binaire` | Déclarations OUI/NON (14 systèmes, ALD, invalidité, activités…) | **NON → 5★** ; **OUI → nombre d'étoiles configuré** (colonne « OUI = »), éventuellement affiné par les questions de sévérité du niveau 3 (seuils 🔻) |
| `frequence` / `ordinal` | Activité physique, fréquences… | Chaque modalité (Jamais…Quotidien) porte un nombre d'étoiles |

### Représentation technique
Le barème vit dans `lib/scoring/config.ts` (généré/importé depuis le classeur), typé :

```ts
type StarRule =
  | { id: string; theme: string; type: "numeric_high_bad" | "numeric_low_bad";
      unit: string; bounds: { s5: number; s4: number; s3: number; s2: number };
      tolerancePct: number; pendingValidation: boolean; notes?: string }
  | { id: string; theme: string; type: "binary";
      onYes: 1|2|3|4|5; pendingValidation: boolean; notes?: string }   // onNo = 5 implicite
  | { id: string; theme: string; type: "frequency";
      map: Record<string, 1|2|3|4|5>; pendingValidation: boolean; notes?: string };
```

- La fonction `starFor(rule, answer)` reproduit **exactement** la logique du classeur
  (testée sur les mêmes cas). Un test compare `config.ts` au classeur pour éviter toute dérive.
- Chaque calcul de dossier stocke la **version du barème** appliquée (`engineVersion`) —
  une mise à jour du barème ne recalcule jamais rétroactivement un dossier déjà scoré sans
  action explicite.

### Écran d'administration du barème (back-office praticien)
`/praticien/admin/bareme` — réservé au rôle médecin conseil / admin :
- Tableau éditable **une ligne par question** : libellé, type, seuils 5★→1★, tolérance,
  « OUI = », statut « À valider », notes. Même structure que le classeur.
- **Aperçu en direct** : un champ « valeur test » affiche le nombre d'étoiles calculé,
  comme dans le classeur — le médecin voit l'effet d'un seuil avant d'enregistrer.
- **Versionnement** : chaque enregistrement crée une nouvelle version datée et signée
  (qui, quand, quoi) ; historique consultable et restaurable.
- **Import / export** du classeur `.xlsx` : le médecin peut préparer le barème hors ligne
  puis l'importer (même format que le fichier livré), ou exporter la version en vigueur.
- Les indicateurs `pending_validation = Oui` sont **posés à l'assuré** mais leur
  contribution au score est **suspendue** tant qu'ils ne sont pas validés ici.

### Agrégation (rappel)
Score d'une rubrique = **MIN** des étoiles de ses indicateurs. Score global =
**moyenne géométrique** des scores de rubrique (échelle 1–5). Le mapping
indicateurs → rubriques figure dans l'onglet « Rubriques » du classeur et dans `config.ts`.

---

## 11 bis. Moteur de scoring (rappel d'implémentation)

```ts
// lib/scoring/stars.ts — logique de référence
// 1. Score d'un indicateur numérique : 5★ tant que valeur ≤ seuil × 1,15
//    (bande de tolérance 15 %), puis dégressif par paliers configurés.
//    Exemple canonique : IMC — 5★ jusqu'à 34,5 (= 30 × 1,15).
// 2. Score thématique = MIN(scores des indicateurs de la rubrique).
// 3. Score global = moyenne GÉOMÉTRIQUE des scores thématiques
//    (préserve la logique multiplicative, résultat sur 1–5).
// 4. Chaque calcul stocke engineVersion + snapshot du barème appliqué.
```

Exécution : au fil de l'eau côté serveur (recalcul à chaque réponse) ou à la signature —
au choix, mais **toujours hors du chemin de réponse client**. Tests unitaires sur le cas
client exemple du document `Sylow_trame_scoring_etoiles.md`.

---

## 12. Plan de développement par jalons

| Jalon | Contenu | Critère de sortie |
|---|---|---|
| **J1 — Socle** (sem. 1–2) | Repo Next.js + Prisma + Postgres HDS, CI, auth OTP, modèle de données, audit log | Un assuré crée un dossier et reprend sa session |
| **J2 — Moteur** (sem. 2–4) | `tree.config.ts` complet (niveaux 0–3 + modes de vie), engine + triggers IMC, autosave, pré-filtre Lemoine, consentements/AERAS | Tous les chemins de branchement couverts par des tests |
| **J3 — UX assuré** (sem. 4–6) | Design system, une-question-à-la-fois, réglettes, cartes Q11, animations, écrans sensibles neutres, accessibilité, mobile | Parcours complet < 10 min pour un profil sain, revue design |
| **J4 — Documents** (sem. 6–7) | Upload URL signée, antivirus, rattachement rubrique, récap pièces manquantes | Dépôt fiable depuis mobile (photo d'un document) |
| **J5 — Scoring & synthèse** (sem. 7–8) | Moteur étoiles serveur, génération synthèse, signature + validité 4 mois | Test anti-fuite : aucun endpoint assuré n'expose le scoring |
| **J6 — Back-office praticien** (sem. 8–10) | Liste, détail par rubriques, étoiles, PDF, demandes d'examens, 2FA | Le médecin conseil traite un dossier de bout en bout |
| **J7 — Durcissement** (sem. 10–12) | Pentest léger, RGPD/purges, charge, validation médicale des items `pending_validation` | Go/No-go production |

---

## 13. Utilisation avec Antigravity / VS Code — conseils de pilotage de l'agent

1. **Commencer par les contrats** : faire générer d'abord `schema.prisma`,
   `tree.config.ts` (structure + 10 questions exemples) et les schémas Zod partagés.
   Tout le reste en découle.
2. **Une tâche = un module** : "implémente le composant Slider avec valeur flottante
   au-dessus de la poignée et saisie numérique alternative", plutôt qu'une demande globale.
3. Fournir à l'agent les deux documents de spécification métier
   (`Sylow_arbre_decision_questionnaire_sante.md` et `Sylow_trame_scoring_etoiles.md`)
   dans le contexte du workspace — c'est la source de vérité pour l'arbre et le barème.
4. Exiger systématiquement les tests avec le code : le moteur de décision et le moteur
   de scoring doivent être livrés avec leurs tests unitaires dans le même commit.
5. Verrouiller tôt le **test anti-fuite du scoring** (un test Playwright qui parcourt
   le questionnaire en interceptant toutes les réponses réseau et échoue si un champ
   `score`/`stars` apparaît) — puis le laisser tourner en CI pendant tout le projet.
6. Pour la qualité visuelle : demander à l'agent des variantes (2–3 propositions de
   l'écran question avec réglette), puis itérer sur la retenue — moins d'effets,
   plus de justesse dans les espacements et la typographie. Injecter les **design tokens
   de l'Annexe A** dès qu'ils sont relevés sur sylow.co (fichier unique `tokens.ts`).
7. Isoler les fournisseurs externes derrière des interfaces (`SmsProvider`, `StorageProvider`)
   dès le départ : OVHcloud est retenu pour le SMS et le stockage, mais un changement d'adaptateur ne doit
   jamais toucher la logique métier.

---

## 14. Décisions arrêtées & paramètres de projet

Les points ouverts de la version 1.0 ont été tranchés comme suit.

### 14.1 Charte graphique — **relevée depuis le logo Sylow & Co**
Couleurs et typographie extraites du logo officiel : **bleu marine `#0A2E5C`**,
**rouge accent `#CC1C29`**, **fond crème `#FCFBF6`**, police de marque **Goldman Sans**
(interface entière). Détail complet, tokens et règles d'usage en **Annexe A**. Reste à fournir
côté Sylow : le logo vectoriel (SVG) + favicon, et les fichiers web Goldman Sans (woff2) avec
validation de la licence pour un usage web public.

### 14.2 Hébergement HDS — **OVHcloud (France)**
- Base **PostgreSQL managée** sur l'offre HDS d'OVHcloud, région France.
- Stockage des documents : **Object Storage OVHcloud** (compatible S3), même périmètre HDS,
  chiffrement au repos activé, URLs signées à durée courte.
- Sauvegardes chiffrées, conservées dans le même périmètre HDS.
- Récupérer et archiver l'**attestation HDS** d'OVHcloud dans le registre de conformité.

### 14.3 SMS OTP — **OVHcloud (API SMS)**
- Envoi des OTP via l’**API SMS OVHcloud** (même périmètre HDS que la base et le stockage).
- **Décision arrêtée ✅** : Free écarté (l'offre historique ne couvre pas l'envoi transactionnel
  vers des numéros tiers). OVHcloud retenu — cohérent avec l’hébergement HDS et une seule
  relation fournisseur pour base, stockage et SMS.
- **Point à vérifier en recette** : bonne réception sur les préfixes **+33** (France) et
  **+352** (Luxembourg) avant mise en production.
- Le code est isolé derrière l’interface `SmsProvider` — un changement d’adaptateur ne
  touche qu’un seul fichier (`lib/providers/ovhcloud-sms.adapter.ts`).

### 14.4 Examens complémentaires — **liste maximale**
Le référentiel des demandes d'examens est **exhaustif** (cf. § 10.4 et **Annexe B**),
couvrant biologie, imagerie, explorations fonctionnelles, comptes rendus spécialisés et
pièces administratives. Le médecin conseil coche ce dont il a besoin ; rien n'est masqué.

### 14.5 Périmètre des questions — **toutes les questions retenues**
Aucune question n'est retirée du parcours : l'intégralité de l'arbre Sylow et l'ensemble
des items issus des référentiels (y compris les questions sensibles du module psychiatrie
et toutes les fenêtres temporelles) sont conservés.
- Les items marqués `pending_validation` dans le barème de scoring **restent présents et
  posés** ; seule leur **contribution au score** est suspendue jusqu'à validation par le
  médecin conseil (signalés par un badge dans le back-office, versionnés).
- Les questions sensibles gardent leur **formulation neutre** (§ 5.3) : elles sont bien
  posées, mais sans habillage ludique.

### 14.6 Politique de purge / conservation
- **Dossier non abouti** (non signé / adhésion sans suite) : purge automatique à **6 mois**.
- **Contrat en vigueur** : **conservation sans limite tant que le contrat court**, puis,
  à sa clôture, conservation pendant le délai de prescription applicable avant purge.
- Purge = suppression des données de santé et documents ; conservation éventuelle d'un
  enregistrement d'audit minimal (sans donnée de santé) pour la traçabilité légale.
- Tâche planifiée quotidienne de purge, journalisée.

---

## Annexe A — Charte graphique Sylow & Co

Relevée depuis le **logo officiel Sylow & Co** (logotype serif bleu marine + rouge sur
fond crème). Identité sobre et institutionnelle : le bleu porte le sérieux et la confiance,
le rouge est un accent rare (le « w » cursif, le trait, le chiffre). Cette parcimonie du
rouge est une règle de marque à respecter dans l'application : **rouge = accent ponctuel**
(élément actif, CTA principal, trait de séparation), jamais aplat massif.

### Couleurs (relevées à la pipette sur le logo)

| Rôle | Hex | Usage |
|---|---|---|
| **Bleu marque** | `#0A2E5C` | Titres, texte fort, éléments de marque, en-têtes |
| Bleu profond | `#00275B` | Variante foncée (survols, contrastes) |
| **Rouge accent** | `#CC1C29` | CTA principal, élément actif/sélectionné, trait signature, poignée de réglette |
| Rouge vif | `#E11B2A` | Survol du CTA (usage très limité) |
| **Fond crème** | `#FCFBF6` | Fond d'application (rappel du fond du logo) |
| Surface | `#FFFFFF` | Cartes, panneaux |
| Encre | `#16233A` | Texte courant |
| Encre atténuée | `#5B6472` | Légendes, aides, placeholders |
| Succès | `#2E7D5B` | Confirmations (jamais sur une réponse de santé) |
| Bordure/ligne | `#E7E3DA` | Séparateurs discrets sur fond crème |

> **Note d'accessibilité** : le rouge `#CC1C29` sur fond crème passe le contraste AA pour
> les éléments graphiques et le texte de grande taille ; pour du texte courant rouge,
> préférer le bleu marque. Ne jamais coder une information uniquement par la couleur.

### Typographie — **Goldman Sans**
La police de la marque Sylow & Co est **Goldman Sans** (sans-serif géométrique).
Elle est utilisée pour **l'ensemble de l'interface** — titres, questions, corps, réglettes,
back-office praticien — ce qui garantit la cohérence avec l'identité Sylow et une excellente
lisibilité sur mobile comme en affichage dense.

```ts
// lib/design/tokens.ts — charte Sylow & Co
export const tokens = {
  color: {
    brand:      "#0A2E5C",  // bleu marque
    brandDeep:  "#00275B",
    accent:     "#CC1C29",  // rouge accent (usage parcimonieux)
    accentHover:"#E11B2A",
    bg:         "#FCFBF6",  // fond crème (logo)
    surface:    "#FFFFFF",
    ink:        "#16233A",
    inkMuted:   "#5B6472",
    success:    "#2E7D5B",
    border:     "#E7E3DA",
    techError:  "#CC1C29",  // erreurs techniques uniquement (réutilise le rouge marque)
  },
  font: {
    heading: "'Goldman Sans', system-ui, -apple-system, sans-serif",
    body:    "'Goldman Sans', system-ui, -apple-system, sans-serif",
  },
  radius: { sm: "8px", md: "14px", lg: "22px", pill: "999px" },
  shadow: {
    card: "0 4px 24px rgba(10,46,92,0.06)",
    lift: "0 8px 32px rgba(10,46,92,0.10)",
  },
  motion: { question: "380ms cubic-bezier(0.16,1,0.3,1)" },
};
```

**Poids** : réserver un poids fort (Medium/Bold Goldman Sans) aux questions et aux titres,
et le Regular au corps et aux aides. Pour distinguer visuellement les questions du reste
sans changer de fonte, jouer sur la taille et le poids (question en 28–32 px / Medium).

> **Licence web validée ✅** : Goldman Sans est autorisée pour un usage web public sur medical.sylow.co. Héberger les fichiers en self-host (woff2) — pas de CDN tiers, cohérent avec le périmètre HDS. Fallback `system-ui` déjà en place dans les tokens.

### Application à l'interface
- **Assuré** : fond crème `#FCFBF6`, questions en serif bleu marque, une seule touche de
  rouge par écran (la poignée de réglette, la carte sélectionnée, ou le bouton Continuer).
  Le **trait rouge** du logo peut servir de signature discrète (soulignement de l'étape
  active dans la barre de progression).
- **Praticien** : plus dense, fond blanc/surface, bleu marque pour la structure ;
  les **étoiles de scoring en rouge accent** `#CC1C29` sur fond neutre — cohérent avec le
  chiffre « 1 » rouge du logo, et bien lisible dans les tableaux.
- **Logo** : fournir les déclinaisons (couleur sur crème, monochrome bleu, monochrome blanc
  sur fond bleu) et un favicon dérivé (le « w » rouge cursif seul fait une bonne icône d'app).

### Checklist de finalisation (à faire côté Sylow)
- [ ] Fournir le logo en **vectoriel (SVG)** + versions monochromes et favicon.
- [x] Fonte de marque confirmée : **Goldman Sans** (interface entière).
- [x] Licence web **Goldman Sans (woff2)** validée ✅ — self-host autorisé pour medical.sylow.co ; récupérer les fichiers woff2 auprès de la source officielle.
- [ ] Valider les nuances sur maquette (le crème peut être ajusté ±2 % selon les écrans).

---

## Annexe B — Référentiel maximal des examens complémentaires

Le médecin conseil sélectionne dans cette liste ; chaque item porte un libellé, une
catégorie et la rubrique médicale associée (pré-remplie selon la déclaration concernée).

**Biologie / sang & urine**
NFS-plaquettes · VS · CRP · ionogramme sanguin · glycémie à jeun · **HbA1c** ·
bilan lipidique (cholestérol total, LDL, HDL, triglycérides) · bilan hépatique
(ASAT, ALAT, GGT, PAL, bilirubine) · bilan rénal (créatinine, DFG, urée) · uricémie ·
TSH (± T3/T4) · bilan martial (ferritine, fer sérique) · électrophorèse des protéines ·
bilan de coagulation (TP, TCA, INR) · sérologies hépatites B et C · sérologie VIH ·
PSA · bêta-HCG · marqueurs tumoraux (selon contexte) · bandelette urinaire ·
protéinurie / albuminurie · ECBU · microalbuminurie.

**Imagerie**
Radiographie (thorax, rachis, membres…) · échographie (abdominale, pelvienne, thyroïdienne,
mammaire, doppler vasculaire) · **échographie-doppler** artériel/veineux · scanner (TDM) ·
**IRM** (cérébrale, médullaire, articulaire, abdomino-pelvienne) · mammographie ·
scintigraphie (osseuse, myocardique, thyroïdienne) · TEP-scan · ostéodensitométrie ·
angiographie / artériographie.

**Explorations fonctionnelles**
ECG de repos · **ECG d'effort** · Holter ECG (24-48 h) · Holter tensionnel (MAPA) ·
échocardiographie · **EFR** (explorations fonctionnelles respiratoires) · gaz du sang ·
**EEG** · électromyogramme (EMG) · potentiels évoqués · polysomnographie (sommeil) ·
test de marche de 6 minutes · épreuve d'effort cardio-respiratoire (VO₂max).

**Endoscopies**
Fibroscopie œso-gastro-duodénale · **coloscopie** · rectosigmoïdoscopie ·
bronchoscopie · cystoscopie.

**Spécialités — comptes rendus & consultations**
Compte rendu de consultation spécialisée (cardiologie, pneumologie, neurologie,
psychiatrie, rhumatologie, néphrologie, urologie, hématologie, oncologie, gynécologie,
ORL, ophtalmologie, dermatologie, endocrinologie, gastro-entérologie) ·
**compte rendu opératoire** · **compte rendu histologique / anatomopathologique** ·
compte rendu d'hospitalisation · bilan ophtalmologique (acuité, champ visuel, tonométrie) ·
audiogramme.

**Documents administratifs / médico-légaux**
Notification de taux d'invalidité · décision de prise en charge ALD (100 %) ·
notification AAH / pension d'invalidité · certificat du médecin traitant ·
ordonnances en cours · carnet de suivi (diabète, anticoagulants…).

> Le référentiel est stocké en configuration (`lib/exams/catalog.ts`) pour être étendu
> sans redéploiement lourd. Chaque examen demandé génère une entrée `ExamRequest` reliée
> à la rubrique, avec suivi de statut et relance automatique à J+15 (§ 10.4).

---

*Document propriétaire Sylow & Co — diffusion interne et prestataires sous NDA uniquement.*
