# Sylow & Co — Système de notation par étoiles & langage client

**Objet de ce document :** première trame du système de score utilisé dans le compte-rendu de synthèse (Phase 3) et l'analyse (Phase 4), + reformulation en langage simple des questions de Niveau 1 et Niveau 2 (Phase 2).

---

## 1. Principe général de la notation

Chaque **thématique** reçoit une note de **1 à 5 étoiles** (5 = aucun signal, 1 = signal de santé marqué). Le **score global** est obtenu en **multipliant** les notes de toutes les thématiques, puis en le ramenant sur une échelle lisible de 1 à 5 étoiles (moyenne géométrique du produit). Les modules de **Niveau 2/3** viennent ensuite **affiner** ce score en ajoutant leurs propres thématiques (une par système du corps déclaré) ou en abaissant une thématique existante du Niveau 1 si une réponse plus précise le justifie.

### 1.1 Règle des paliers de tolérance (indicateurs mesurables)

Pour tout indicateur chiffré possédant un **seuil normal habituel T** (ex. IMC, tension), on garde **5 étoiles jusqu'à 15 % au-dessus de T** (tolérance), puis la note baisse par paliers :

| Étoiles | Zone | Formule |
|---|---|---|
| ★★★★★ | Normal + tolérance | valeur ≤ **T × 1,15** |
| ★★★★☆ | Dépassement modéré | T × 1,15 < valeur ≤ **T × 1,30** |
| ★★★☆☆ | Dépassement significatif | T × 1,30 < valeur ≤ **T × 1,50** |
| ★★☆☆☆ | Dépassement important | T × 1,50 < valeur ≤ **T × 1,75** |
| ★☆☆☆☆ | Dépassement majeur | valeur > **T × 1,75** |

*Exemple donné : IMC, seuil T = 30 (repère "obésité" de l'OMS, identique pour les deux sexes) → 5 étoiles jusqu'à 34,5 ; 4 étoiles jusqu'à 39 ; 3 étoiles jusqu'à 45 ; 2 étoiles jusqu'à 52,5 ; 1 étoile au-delà.*

> Pour les indicateurs où le seuil de référence diffère usuellement selon le sexe (ex. repères de consommation d'alcool), le seuil T est adapté en conséquence avant application de la même règle des paliers.

### 1.2 Règle pour les indicateurs binaires ou qualitatifs (oui/non, catégories)

Ces indicateurs n'ont pas de "dépassement en %" : on leur attribue directement une note par une **grille de correspondance dédiée** (donnée thème par thème en section 2). Principe par défaut : *"Non" → 5★*, et chaque palier de gravité déclarée abaisse la note.

### 1.3 Note d'une thématique regroupant plusieurs indicateurs

**La note d'une thématique = la note la plus basse parmi ses indicateurs** (principe de prudence : le maillon le plus faible détermine la note globale du thème). Ce choix est un point à valider avec le médecin-conseil — une moyenne pondérée est une alternative possible.

### 1.4 Score global

```
Score brut = Note(thème 1) × Note(thème 2) × ... × Note(thème n)
Score affiché = racine n-ième du score brut   (n = nombre de thématiques notées)
              → arrondi à la demi-étoile la plus proche
```

La moyenne géométrique restitue une note finale sur la même échelle 1-5 tout en respectant la logique multiplicative demandée : un seul thème très dégradé (1★) pèse beaucoup plus lourd qu'une moyenne arithmétique ne le ferait, ce qui reflète le principe assurantiel "le risque le plus grave domine l'appréciation globale".

### 1.5 Affinement par les Niveaux 2 et 3

- Chaque système du corps déclaré positif en **Niveau 2** crée une **thématique additionnelle** ("État de santé déclaré : [système]"), notée d'après les réponses du module de **Niveau 3** correspondant, selon la grille suivante :

| Constat sur le module Niveau 3 | Note |
|---|---|
| Aucun seuil interne dépassé | ★★★★★ |
| Seulement des signaux "à surveiller" mineurs (info) | ★★★★☆ |
| Au moins un seuil "à surveiller" (warn) | ★★★☆☆ |
| Plusieurs seuils "à surveiller" ou un signal "majeur" (danger) isolé | ★★☆☆☆ |
| Plusieurs signaux "majeurs" (danger) | ★☆☆☆☆ |

- Ces thématiques additionnelles entrent **dans le même calcul multiplicatif** que les thématiques de Niveau 1.
- Si un module de Niveau 3 apporte une précision qui contredit une estimation faite au Niveau 1 (ex. le client a déclaré une tension à la limite au Niveau 1, mais le module Cardio confirme un traitement bien équilibré), la note de la thématique Niveau 1 concernée peut être **recalculée** avec l'information la plus précise disponible plutôt que cumulée une seconde fois.

---

## 2. Thématiques de Niveau 1 — langage simple, seuils et notation

Chaque ligne montre : la formulation technique d'origine → **la formulation proposée au client** → le principe de notation.

### 2.1 Thématique « Poids et silhouette »

| Donnée | Formulation client | Notation |
|---|---|---|
| Taille / Poids | *« Quelle est votre taille et votre poids ? »* | Sert à calculer l'IMC (indice de corpulence) — non affiché comme "IMC" mais comme *« votre indice de corpulence »* avec une jauge visuelle plutôt qu'un chiffre médical brut |
| IMC calculé | *(affiché comme une jauge : « Votre poids est dans la zone... »)* | Seuil T = 30 → paliers §1.1 |
| Perte de poids involontaire | *« Avez-vous perdu du poids sans le vouloir au cours de la dernière année ? Si oui, à peu près combien (en %) ? »* | Seuil T = 10 % → paliers §1.1 |

### 2.2 Thématique « Tension artérielle »

| Donnée | Formulation client | Notation |
|---|---|---|
| Tension systolique/diastolique | *« Connaissez-vous votre tension artérielle habituelle ? C'est le chiffre que votre médecin ou une pharmacie peut mesurer avec un brassard au bras. »* + aide visuelle (schéma du brassard, exemple "12/8") | Seuil T = 140/90 → paliers §1.1 sur la valeur systolique |

### 2.3 Thématique « Tabac »

| Donnée | Formulation client | Notation |
|---|---|---|
| Tabac | *« Fumez-vous (cigarettes, cigares, pipe) ou utilisez-vous une cigarette électronique ? Si oui, à peu près combien par jour ? »* | Grille dédiée : 0 = ★★★★★ · 1-9/j = ★★★★☆ · 10-19/j = ★★★☆☆ · 20-29/j = ★★☆☆☆ · ≥30/j = ★☆☆☆☆ |

### 2.4 Thématique « Alcool et autres consommations »

| Donnée | Formulation client | Notation |
|---|---|---|
| Alcool | *« Environ combien de verres d'alcool buvez-vous par semaine (vin, bière, apéritif...) ? »* + exemple visuel d'un "verre standard" | Seuil T = 14 verres/semaine → paliers §1.1 |
| Substances | *« Consommez-vous ou avez-vous consommé d'autres substances (cannabis, autres) ? »* | Grille dédiée : Non = ★★★★★ · Usage occasionnel = ★★★☆☆ · Usage régulier = ★☆☆☆☆ |

### 2.5 Thématique « Activité physique et loisirs »

| Donnée | Formulation client | Notation |
|---|---|---|
| Sport/activités | *« Pratiquez-vous un sport ou une activité physique ? Est-ce en compétition, ou un sport que l'on pourrait qualifier de « sensations fortes » (plongée profonde, sports mécaniques, sports aériens...) ? »* | Grille dédiée : aucune pratique à risque = ★★★★★ · loisir régulier = ★★★★☆ · pratique intensive/compétition = ★★★☆☆ · pratique extrême régulière = ★★☆☆☆ |

### 2.6 Thématique « Voyages et environnement »

| Donnée | Formulation client | Notation |
|---|---|---|
| Voyages | *« Prévoyez-vous ou avez-vous prévu de vivre plus de 3 mois d'affilée en dehors de l'Europe, des États-Unis, du Canada, du Japon, de l'Australie, de la Nouvelle-Zélande, de Hong Kong ou de Singapour ? »* | Grille dédiée : Non = ★★★★★ · Oui, séjour touristique = ★★★★☆ · Oui, séjour prolongé/zone à risque sanitaire = ★★★☆☆ |

### 2.7 Thématique « Vie professionnelle et arrêts de travail »

| Donnée | Formulation client | Notation |
|---|---|---|
| Arrêt de travail (durée) | *« Au cours des 5 dernières années, avez-vous eu un arrêt de travail prescrit par un médecin ? Si oui, quelle a été la durée du plus long ? »* | Seuil T = 21 jours → paliers §1.1 |
| Arrêt en cours | *« Êtes-vous actuellement en arrêt de travail ? »* | Non = ★★★★★ · Oui = ★★★☆☆ |
| Invalidité/pension/AAH | *« Percevez-vous une pension, une rente, ou une allocation liée à un handicap ou une incapacité de travail ? »* | Non = ★★★★★ · Oui = ★☆☆☆☆ |
| Refus antérieur | *« Une compagnie d'assurance a-t-elle déjà refusé, ajourné, ou appliqué une majoration de tarif sur un contrat d'assurance vie/emprunteur vous concernant ? »* | Non = ★★★★★ · Oui = ★★☆☆☆ |

### 2.8 Thématique « Suivi médical récent »

| Donnée | Formulation client | Notation |
|---|---|---|
| Prise en charge à 100 % / ALD | *« Bénéficiez-vous d'une prise en charge à 100 % par l'Assurance Maladie pour une maladie de longue durée ? »* | Non = ★★★★★ · Oui = ★★★☆☆ |
| Examen/hospitalisation prévue | *« Un examen médical, une consultation chez un spécialiste ou une hospitalisation est-il déjà prévu dans les 6 prochains mois ? »* | Non = ★★★★★ · Oui = ★★★★☆ |

---

## 3. Niveau 2 — reformulation en langage simple

La question d'introduction du Niveau 2 est reformulée ainsi :

> *« Au cours des 10 dernières années, avez-vous eu l'un des problèmes de santé suivants ? Cochez tout ce qui vous concerne — même des épisodes anciens ou aujourd'hui résolus. »*

Chaque système est reformulé en évitant le jargon médical :

| Terme technique (référentiel interne) | Formulation client | Exemples reformulés donnés au client |
|---|---|---|
| Infectieux / parasitaire | **Infections** | « une infection sévère ou de longue durée (tuberculose, hépatite, VIH, infection sexuellement transmissible...) » |
| Endocrino-métabolique | **Diabète, cholestérol, thyroïde** | « diabète, taux de cholestérol élevé, problème de thyroïde, goutte » |
| Hématologique | **Sang** | « anémie, problème de coagulation du sang, maladie du sang » |
| Psychiatrique | **Moral et santé mentale** | « anxiété, déprime ou dépression, stress important, troubles de l'humeur » |
| Neurologique | **Cerveau et système nerveux** | « AVC, épilepsie, sclérose en plaques, paralysie, sciatique sévère » |
| ORL / Ophtalmologique | **Oreilles, nez, gorge, yeux** | « surdité, vertiges, problème de vue important (cataracte, glaucome...) » |
| Cardio-vasculaire | **Cœur et circulation du sang** | « souffle au cœur, tension trop élevée, douleur dans la poitrine, infarctus, rythme cardiaque irrégulier » |
| Respiratoire | **Respiration** | « bronchite qui dure, asthme, essoufflement, apnée du sommeil (ronflement avec pauses respiratoires) » |
| Digestif | **Digestion** | « problème d'estomac, de foie, hépatite, maladie inflammatoire de l'intestin » |
| Uro-néphrologique | **Reins et voies urinaires** | « calculs rénaux, protéines dans les urines, infection urinaire à répétition, problème de prostate » |
| Dermatologique | **Peau** | « eczéma, psoriasis, grain de beauté suspect, kyste » |
| Ostéo-articulaire | **Os, articulations et dos** | « arthrose, hernie discale, mal de dos chronique, ostéoporose » |
| Oncologique | **Cancer** | « une tumeur ou un cancer, quel qu'il soit » |
| Autre | **Autre chose non listée ici** | libre |

**Principe de reformulation appliqué systématiquement :**
1. Remplacer le terme médical par le nom de la fonction du corps concernée (« cœur et circulation » plutôt que « cardio-vasculaire »).
2. Donner 3 à 4 exemples concrets et connus du grand public entre parenthèses.
3. Ajouter, si le champ le permet, une icône ou un pictogramme représentant la partie du corps concernée (à intégrer en phase de maquette visuelle).
4. Pour les questions de Niveau 3 (approfondissement), reprendre le même principe pour chaque champ technique (ex. *« Fraction d'éjection »* → *« Efficacité de pompage de votre cœur, mesurée lors d'une échographie cardiaque »*) — un lexique complet reste à produire pour les 21 modules, ce document pose la méthode à appliquer.

---

## 4. Modèle du rapport de synthèse (Phase 3 + 4)

### 4.1 Structure du rapport

```
1. En-tête : identité, date, statut de confidentialisation
2. Score global (étoiles + libellé qualitatif)
3. Détail par thématique (Niveau 1) — étoiles + valeur déclarée + explication en langage simple
4. Thématiques additionnelles (Niveau 2/3) — une par système déclaré positif, avec étoiles
5. Tableau récapitulatif des pièces justificatives à demander
6. Mentions : caractère non contractuel, validation médecin-conseil
```

### 4.2 Exemple chiffré (client fictif)

**Données saisies (exemple) :**
IMC = 33 · Tension = 138/88 · Tabac = 5 cig/j · Alcool = 6 verres/sem · Sport = loisir régulier ·
Voyages = non · Arrêt de travail le plus long = 10 jours · Aucune invalidité/ALD/refus ·
Niveau 2 : "Cœur et circulation" coché → Module Cardio : aucun seuil interne dépassé.

**Calcul :**

| Thématique | Valeur | Note |
|---|---|---|
| Poids et silhouette | IMC 33 (≤ 34,5) | ★★★★★ |
| Tension artérielle | 138/88 (< 140/90) | ★★★★★ |
| Tabac | 5 cig/j (1-9) | ★★★★☆ |
| Alcool et autres consommations | 6 verres/sem (≤16) | ★★★★★ |
| Activité physique et loisirs | loisir régulier | ★★★★☆ |
| Voyages et environnement | non concerné | ★★★★★ |
| Vie professionnelle et arrêts | 10 jours (≤24) | ★★★★★ |
| Suivi médical récent | rien à signaler | ★★★★★ |
| État de santé déclaré : Cœur et circulation | aucun seuil interne dépassé | ★★★★★ |

```
Score brut    = 5×5×4×5×4×5×5×5×5 = 500 000
Score affiché = (500 000)^(1/9) ≈ 4,79 → arrondi ★★★★★ (4,5-5 = affichage 5 pleines avec mention "quasi-parfait")
```

**Rendu visuel proposé pour le rapport :**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SYLOW & CO — Compte-rendu de santé
  Score global : ★★★★★ (4,8/5) — Dossier standard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Poids et silhouette .................... ★★★★★
  Tension artérielle ...................... ★★★★★
  Tabac .................................... ★★★★☆
  Alcool et autres consommations ......... ★★★★★
  Activité physique et loisirs ............ ★★★★☆
  Voyages et environnement ................ ★★★★★
  Vie professionnelle et arrêts ........... ★★★★★
  Suivi médical récent .................... ★★★★★
  Cœur et circulation (approfondi) ........ ★★★★★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.3 Libellés qualitatifs du score global (à valider)

| Score affiché | Libellé | Correspondance indicative avec le scoring Phase 4 existant |
|---|---|---|
| 4,5 – 5,0 ★ | Excellent dossier | Standard |
| 3,5 – 4,4 ★ | Bon dossier, quelques points de vigilance | Standard / à examiner selon détail |
| 2,5 – 3,4 ★ | Dossier à examiner | À examiner par le médecin-conseil |
| 1,5 – 2,4 ★ | Dossier nécessitant une analyse approfondie | Complexe |
| 1,0 – 1,4 ★ | Dossier complexe | Complexe |

---

## 5. Points à valider avec Sylow & Co avant implémentation

- Confirmer le choix **note minimale** (vs moyenne pondérée) pour agréger les indicateurs d'une même thématique.
- Confirmer la méthode de la **moyenne géométrique** pour le score global (elle sanctionne fortement un seul thème dégradé — cohérent avec une logique assurantielle, mais à valider).
- Valider les **grilles de correspondance** des indicateurs binaires (ex. "invalidité = 1★" est une proposition, pas une règle actuarielle établie).
- Faire relire l'ensemble des **reformulations en langage simple** par le médecin-conseil pour s'assurer qu'aucune perte de sens médical ne se glisse dans la simplification (risque de sous-déclaration si une reformulation est trop vague).
- Étendre le lexique simplifié aux 21 modules de Niveau 3 (seuls les principes sont posés ici, le travail exhaustif reste à faire).
- Décider si les thématiques Niveau 2/3 "additionnelles" doivent avoir le même poids dans le produit global que les thématiques Niveau 1, ou un poids réduit (étant donné qu'elles ne concernent qu'une partie des clients).
