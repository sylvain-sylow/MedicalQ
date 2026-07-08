// lib/design/tokens.ts
// Charte graphique Sylow & Co — source unique de vérité
// Relevée depuis le logo officiel Sylow & Co (Annexe A de la spec)

export const tokens = {
  color: {
    brand:        "#0A2E5C", // bleu marque — titres, texte fort, éléments de marque
    brandDeep:    "#00275B", // variante foncée — survols, contrastes
    accent:       "#CC1C29", // rouge accent (usage parcimonieux) — CTA, élément actif, poignée réglette
    accentHover:  "#E11B2A", // survol CTA (usage très limité)
    bg:           "#FCFBF6", // fond crème — fond d'application
    surface:      "#FFFFFF", // cartes, panneaux
    ink:          "#16233A", // texte courant
    inkMuted:     "#5B6472", // légendes, aides, placeholders
    success:      "#2E7D5B", // confirmations (JAMAIS sur une réponse de santé)
    border:       "#E7E3DA", // séparateurs discrets sur fond crème
    techError:    "#CC1C29", // erreurs techniques uniquement (réutilise rouge marque)
  },
  font: {
    heading: "'Goldman Sans', system-ui, -apple-system, sans-serif",
    body:    "'Goldman Sans', system-ui, -apple-system, sans-serif",
    // Goldman Sans : licence web validée ✅ — self-host woff2 requis
    // Fallback system-ui actif automatiquement si fichier non chargé
  },
  fontSize: {
    question: "clamp(1.5rem, 4vw, 2rem)",  // 28–32px — questions
    body:     "1rem",
    sm:       "0.875rem",
    lg:       "1.125rem",
  },
  fontWeight: {
    regular: "400",
    medium:  "500",
    bold:    "700",
  },
  radius: {
    sm:   "8px",
    md:   "14px",
    lg:   "22px",
    pill: "999px",
  },
  shadow: {
    card: "0 4px 24px rgba(10, 46, 92, 0.06)",
    lift: "0 8px 32px rgba(10, 46, 92, 0.10)",
  },
  motion: {
    question: "380ms cubic-bezier(0.16, 1, 0.3, 1)", // glissement entre questions
    fast:     "150ms ease-out",
    standard: "250ms ease-out",
  },
  spacing: {
    xs:  "4px",
    sm:  "8px",
    md:  "16px",
    lg:  "24px",
    xl:  "40px",
    xxl: "64px",
  },
  breakpoint: {
    sm:  "640px",
    md:  "768px",
    lg:  "1024px",
    xl:  "1280px",
  },
} as const;

// ─── Types utilitaires ────────────────────────────────────────────────────────

export type ColorToken   = keyof typeof tokens.color;
export type RadiusToken  = keyof typeof tokens.radius;
export type ShadowToken  = keyof typeof tokens.shadow;
export type MotionToken  = keyof typeof tokens.motion;

// ─── CSS variables (à injecter dans globals.css) ──────────────────────────────

export const cssVariables = Object.entries(tokens.color)
  .map(([key, value]) => `  --color-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value};`)
  .join("\n");
