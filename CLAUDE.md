# CLAUDE.md — medical.sylow.co

Mémoire de projet pour Claude Code. Lis ce fichier à chaque session. La spécification
complète fait autorité : `docs/Sylow_spec_dev_medical_sylow_co.md`. En cas de doute,
elle prime sur ce résumé.

## Ce qu'on construit
Application web **medical.sylow.co** : questionnaire de santé digital adaptatif pour
l'assurance emprunteur, propriété de **Sylow & Co** (France / Luxembourg). Deux interfaces :
un espace **assuré** (parcours ludique, une question à la fois) et un back-office
**médecin conseil** (`/praticien`).

## Règles non négociables (ne jamais enfreindre)
1. **Le scoring en étoiles n'est JAMAIS exposé à l'assuré** — ni dans l'UI, ni dans les
   réponses API du parcours client, ni dans le bundle JS, ni dans le localStorage. Le calcul
   est exclusivement côté serveur, dans des endpoints réservés au rôle praticien. Un test
   Playwright anti-fuite doit tourner en CI (échoue si un champ `score`/`stars`/`etoile`
   apparaît côté assuré).
2. **Hébergement HDS obligatoire** — base PostgreSQL, stockage documents et sauvegardes chez
   **OVHcloud (France)**. Données de santé chiffrées au niveau champ (AES-256-GCM), clés hors base.
3. **L'arbre de décision est un actif propriétaire** — ne jamais embarquer l'arbre complet
   dans le bundle client ; le serveur ne renvoie que la prochaine question.
4. **Aucune référence à des bibliothèques assureurs tierces** dans l'UI, les PDF, les exports.
   Tout est présenté comme le référentiel propriétaire Sylow & Co.
5. **Questions sensibles** (module psychiatrie, ex. idées suicidaires) : ton strictement
   neutre, pas d'habillage ludique, pas d'animation festive, pas d'étoiles.
6. Tout code livré avec ses **tests** dans le même commit (moteur de décision et scoring).

## Stack
- Next.js 15 (App Router) + TypeScript · Tailwind + shadcn/ui + Framer Motion
- PostgreSQL (OVHcloud HDS) + Prisma · Object Storage OVHcloud (S3-compatible) pour les documents
- Auth assuré : OTP SMS via **Free** (derrière une interface `SmsProvider`) + JWT court httpOnly
- Auth praticien : credentials + TOTP 2FA obligatoire
- PDF : Puppeteer (HTML → PDF) · Validation : Zod · Tests : Vitest + Playwright
- Isoler tout fournisseur externe derrière une interface (`SmsProvider`, `StorageProvider`).

## Charte graphique Sylow & Co
- Bleu marque `#0A2E5C` · Rouge accent `#CC1C29` (parcimonieux) · Fond crème `#FCFBF6`
- Encre `#16233A` · Encre atténuée `#5B6472` · Bordure `#E7E3DA`
- Police **Goldman Sans** sur toute l'interface (self-host woff2 ; valider la licence web ;
  fallback `system-ui`). Le rouge reste un accent ponctuel (poignée de réglette, élément
  actif, CTA, trait de progression), jamais un aplat massif.
- Tokens centralisés dans `lib/design/tokens.ts` — source unique.

## Les 4 phases
1. Inscription/auth : téléphone + OTP, identité, pré-filtre loi Lemoine, consentement santé,
   encart droit à l'oubli AERAS avant toute pathologie, reprise de session.
2. Collecte médicale + modes de vie : moteur adaptatif niveaux 0→3, Q11 = branchement
   principal (14 systèmes), 21 modules spécialisés, module « modes de vie », autosave.
3. Synthèse : rapport structuré, pièces justificatives manquantes par module, signature
   électronique (L113-8/L113-9), validité 4 mois.
4. Scoring : moteur étoilé **back-office uniquement** (tolérance 15 %, min par rubrique,
   moyenne géométrique globale).

## Barème étoilé (source de vérité)
- Fichier fonctionnel éditable : `docs/Sylow_bareme_etoiles.xlsx` (médecin conseil).
- Export machine : `docs/Sylow_bareme_etoiles.json` → sert à générer `lib/scoring/config.ts`.
  Un test compare `config.ts` au JSON pour empêcher toute dérive.
- Écran d'admin `/praticien/admin/bareme` : édition des seuils 5★→1★, aperçu en direct,
  versionnement, import/export xlsx.
- `pendingValidation: true` → question posée à l'assuré mais contribution au score suspendue.

## Modèle de données
Voir section 8 de la spec. Entités : Insured, HealthFile, Answer, Document, Scoring
(back-office only), ExamRequest, Praticien, AuditLog. Journaliser chaque accès praticien.

## Conventions
- Commits : Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
- Français pour l'UI et les libellés métier ; anglais pour le code et les identifiants techniques.
- Fenêtres temporelles harmonisées et documentées dans `lib/decision-tree/timeframes.ts`.
- Arrondir tout nombre affiché. Accessibilité WCAG 2.1 AA, mobile-first.
- Purge : dossier non abouti à 6 mois ; conservation sans limite tant que le contrat court,
  puis purge après le délai de prescription.

## Ordre de travail conseillé (jalons)
J1 socle → J2 moteur d'arbre → J3 UX assuré → J4 documents → J5 scoring+synthèse →
J6 back-office praticien → J7 durcissement. Détail en section 12 de la spec.
Commencer par les contrats : `schema.prisma`, `tree.config.ts`, schémas Zod, puis le reste.
