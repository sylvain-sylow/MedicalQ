# Prompt de lancement — Claude Code

Copie-colle ces prompts dans Claude Code, dans l'ordre. Un jalon à la fois : laisse Claude
finir et vérifie avant de passer au suivant. Le fichier `CLAUDE.md` à la racine est lu
automatiquement à chaque session — inutile de re-préciser le contexte permanent.

---

## Prompt 0 — Cadrage (à envoyer en premier)

```
Lis CLAUDE.md et docs/Sylow_spec_dev_medical_sylow_co.md en entier : c'est la spec de
référence du projet medical.sylow.co. Ne code encore rien.

Réponds-moi avec :
1. Un récapitulatif en 10 lignes de ce que tu as compris (les 4 phases, les 2 interfaces,
   les règles non négociables).
2. Le plan des 7 jalons avec, pour chacun, les fichiers principaux que tu vas créer.
3. Les 3 points où tu vois un risque technique ou une ambiguïté à lever avant de commencer.

Attends ma validation avant d'écrire du code.
```

---

## Prompt 1 — Jalon J1 : socle

```
Jalon J1 (socle). Initialise le projet :
- Next.js 15 (App Router) + TypeScript, ESLint + Prettier, Vitest et Playwright configurés.
- Tailwind + shadcn/ui + Framer Motion.
- Prisma avec PostgreSQL. Génère prisma/schema.prisma d'après la section 8 de la spec
  (Insured, HealthFile, Answer, Document, Scoring, ExamRequest, Praticien, AuditLog).
- lib/design/tokens.ts avec la charte Sylow (couleurs + Goldman Sans, section Annexe A).
- Interfaces SmsProvider et StorageProvider (implémentations Free et OVHcloud en stubs).
- Auth assuré par OTP (send/verify) avec un SmsProvider mocké en dev, session JWT httpOnly.
- Squelette d'arborescence de la section 4 (routes assuré + praticien + api, vides mais typées).
- Un test Playwright « anti-fuite scoring » qui échoue si un champ score/stars/etoile
  apparaît dans une réponse réseau côté assuré. Il doit tourner en CI dès maintenant.

Livre le tout avec les tests, puis fais un commit `chore: bootstrap projet + socle J1`.
Explique-moi comment lancer le dev et les tests en local.
```

---

## Prompt 2 — Jalon J2 : moteur d'arbre de décision

```
Jalon J2 (moteur adaptatif). D'après la spec (sections 2 et 6) :
- lib/decision-tree/tree.config.ts : transcris l'arbre niveaux 0→3. Commence par le
  Niveau 0 (identité, pré-filtre Lemoine, consentement santé, encart AERAS) et le Niveau 1
  complet (IMC en temps réel, tabac, alcool, etc.), puis Q11 (14 systèmes) comme point de
  branchement, et la structure des 21 modules niveau 3 + le module « modes de vie ».
  Utilise les IDs du barème (docs/Sylow_bareme_etoiles.json) quand une question est notée.
- lib/decision-tree/timeframes.ts : fenêtres temporelles harmonisées et documentées.
- lib/decision-tree/triggers.ts : déclencheurs numériques (IMC avec bande de tolérance).
- lib/decision-tree/engine.ts : getNextQuestion(answers) -> Question | End, machine à états pure.
- API questionnaire : next-question, answer (autosave immédiat + révisions), resume.
  Le serveur ne renvoie QUE la prochaine question, jamais l'arbre entier.

Chaque chemin de branchement doit avoir un test unitaire. Commit `feat: moteur d'arbre J2`.
```

---

## Prompt 3 — Jalon J3 : UX assuré

```
Jalon J3 (interface assuré). D'après la section 5 (le soin graphique est une exigence) :
- Une question par écran, plein écran, transitions Framer Motion (glissement 380ms).
- Contrôles : Slider (poignée tactile, valeur affichée au-dessus, saisie numérique
  alternative), double réglette taille+poids avec IMC calculé mais JAMAIS affiché côté
  assuré, cartes OUI/NON, grille de cartes pour Q11 (14 systèmes, sélection multiple +
  « Aucun de ces éléments »), curseur de fréquence, sélecteur de date/période, champ texte.
- Barre de progression par grandes étapes (jamais un pourcentage précis).
- Écrans sensibles (psychiatrie) : épurés, ton neutre, sans animation ludique, sans étoile.
- Mobile-first, WCAG 2.1 AA, autosave visible, retour arrière avec animation inverse.

Propose-moi d'abord 2 variantes de l'écran « question avec réglette », j'en choisis une,
puis tu déclines. Commit `feat: parcours assuré J3` une fois validé.
```

---

## Prompt 4 — Jalon J4 : documents joints

```
Jalon J4 (documents). Section 7 :
- Sur chaque déclaration positive `allowUpload`, proposer le dépôt (optionnel, jamais bloquant).
- Upload direct vers l'Object Storage OVHcloud via URL signée (le fichier ne transite pas
  par le serveur applicatif), scan antivirus (ClamAV) avant mise à disposition, chiffrement
  au repos. Formats PDF/JPG/PNG/HEIC, 15 Mo max/fichier, 10 max/dossier.
- Rattacher chaque document à la question/rubrique d'origine.
- Écran récap avant signature : documents joints + pièces recommandées manquantes par module.

Tests d'upload (dont un gros fichier et un format refusé). Commit `feat: documents joints J4`.
```

---

## Prompt 5 — Jalon J5 : scoring + synthèse

```
Jalon J5 (scoring back-office + synthèse). Sections 3, 11 et 11 bis :
- lib/scoring/config.ts généré depuis docs/Sylow_bareme_etoiles.json, typé (StarRule).
  Ajoute un test qui compare config.ts au JSON pour empêcher toute dérive.
- lib/scoring/stars.ts : starFor(rule, answer) reproduisant EXACTEMENT la logique du
  classeur (numeric_high_bad/low_bad avec tolérance 15 %, binary onNo=5/onYes, frequency).
  Score rubrique = min ; score global = moyenne géométrique. Stocke engineVersion.
- Endpoints scoring réservés au rôle praticien (vérif serveur-side). RIEN côté assuré :
  le test anti-fuite de J1 doit toujours passer.
- Génération de la synthèse structurée + liste des pièces manquantes par module.
- Signature électronique : mention L113-8/L113-9, horodatage, validité 4 mois.

Commit `feat: scoring serveur + synthèse J5`.
```

---

## Prompt 6 — Jalon J6 : back-office médecin conseil

```
Jalon J6 (praticien). Section 10 :
- Auth praticien email + TOTP 2FA obligatoire.
- Liste des dossiers : filtrable, score global en étoiles, alertes (rubriques <=2★,
  documents manquants, examens en attente), tri par priorité.
- Détail dossier : bandeau synthèse, vue par rubriques dépliables (réponses détaillées +
  terme médical + révisions + documents joints prévisualisés), badges pendingValidation.
- Génération du dossier PDF en 3 parties (synthèse + détail intégral + annexes documents).
- Écran /praticien/admin/bareme : édition des seuils 5★→1★ avec aperçu en direct,
  versionnement, import/export du classeur xlsx.
- Demande d'examens complémentaires : référentiel maximal (Annexe B), notification SMS+email
  à l'assuré, parcours de dépôt ciblé, suivi de statut, relance auto J+15.

Journaliser chaque accès praticien (AuditLog). Commit `feat: back-office praticien J6`.
```

---

## Prompt 7 — Jalon J7 : durcissement

```
Jalon J7 (durcissement). Section 9 :
- Passe la checklist sécurité/conformité : TLS/HSTS, CSP stricte, chiffrement champ,
  rate limiting OTP et upload, audit exhaustif, séparation des rôles côté API.
- RGPD : purges (6 mois non abouti ; sans limite si contrat en vigueur puis prescription),
  consentement versionné, droits d'accès/rectification/effacement.
- Tests de charge basiques et revue des cas limites du moteur et du scoring.
- Rends-moi une checklist Go/No-go production avec l'état de chaque point.

Commit `chore: durcissement + conformité J7`.
```
