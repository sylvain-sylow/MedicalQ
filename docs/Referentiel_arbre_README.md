# Bibliothèque de questionnaires de santé — Assurance emprunteur

Constituée à partir de :
- 4 questionnaires simplifiés (Groupama Gan Vie, MetLife QUSA, AXA, April) → référentiel de niveau 0 (filtres généraux)
- 24 questionnaires spécialisés MetLife + 7 lettres génériques, extraits en texte intégral depuis
  `https://www.metlife.fr/assurance-emprunteur/questionnaires-de-sante-assurance-emprunteur/`
  (index couvrant ~300 pathologies nommées)

## Fichiers

| Fichier | Contenu |
|---|---|
| `questionnaires_specialises.json` | Les 24 sous-questionnaires MetLife, structurés en champs (id, label, type, condition) prêts à être rejoués dans un moteur de formulaire |
| `lettres_generiques.json` | Les 7 demandes de pièces justificatives génériques (CRO/CRH, CR hospitalisation, bilan pathologie, bilan cardio, bilan lipidique, bilan sérologies, RMC) |
| `pathologie_to_categorie.json` | Mapping pathologie déclarée → catégorie(s) de questionnaire à déclencher (~180 pathologies représentatives sur 23 catégories + fourre-tout "générique") |
| `arbre_decision_v1.json` | Arbre de décision v1 : niveau 0 (filtres généraux) → niveau 1 (systèmes du corps) → niveau 2 (renvoi vers le sous-questionnaire spécialisé) |

## Logique de l'arbre v1

1. **Niveau 0 — Filtres généraux** : mesures systématiques (taille/poids, tabac, alcool, drogues, sport, voyages) + questions oui/non type "questionnaire simplifié" (hospitalisation, colonne/articulations, psychisme, arrêt de travail, prise en charge 100%, invalidité, examens à venir).
2. **Niveau 1 — Routage par système** : chaque réponse positive et chaque pathologie citée en texte libre est rapprochée d'un des 20 systèmes du corps via mots-clés, qui pointe vers une catégorie spécialisée.
3. **Niveau 2 — Creusage** : la catégorie ouvre le sous-questionnaire structuré correspondant (champs réels extraits des PDF MetLife : diagnostic, dates, traitements, examens, complications...).
4. **Cas non couverts** : toute pathologie hors des 23 catégories déclenche uniquement la lettre générique adaptée (ex. bilan de la pathologie déclarée).
5. **Multi-déclenchement** : plusieurs branches peuvent s'ouvrir en parallèle (ex. obésité + diabète + apnées du sommeil + cardio en cas de comorbidités), pas de blocage séquentiel.

## Limites connues (à traiter en v2)
- Le mapping pathologie→catégorie n'est pas exhaustif sur les ~300 entrées de l'index (échantillon représentatif) — à compléter si besoin d'une couverture à 100%.
- Le texte "Questionnaire cardiaque ischémique" est parfois mal lié sur le site MetLife lui-même (ex. INFARCTUS DU MYOCARDE pointe vers Q_Maladie_Cardiaque_Non_Isch.pdf) : dans notre référentiel, ces cas ont été corrigés vers la bonne catégorie.
- Les conditions de branchement (`condition`) dans `questionnaires_specialises.json` sont exprimées en pseudo-langage ; à traduire en règles machine (JSONLogic ou équivalent) lors de l'implémentation.
- Ce référentiel est spécifique à MetLife ; à confronter avec les grilles Groupama/AXA/April/Generali etc. pour une v2 assureur-agnostique.
