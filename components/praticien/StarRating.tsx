// components/praticien/StarRating.tsx
// Affichage étoiles pour le back-office praticien.
// RÈGLE : ce composant n'est JAMAIS importé côté assuré (dossier /praticien uniquement).

import React from "react";

interface StarRatingProps {
  /** Score 1–5 (peut être décimal, ex. 3.7). */
  value: number;
  /** Taille des étoiles. */
  size?: "sm" | "md" | "lg";
  /** Affiche la valeur numérique à côté des étoiles. */
  showValue?: boolean;
}

const SIZES = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };

/** Couleur selon le niveau de risque (bas = rouge accent, haut = bleu marque). */
function colorFor(value: number): string {
  if (value <= 2) return "#CC1C29"; // rouge accent — risque élevé
  if (value < 3.5) return "#B7791F"; // ambre — vigilance
  return "#0A2E5C"; // bleu marque — favorable
}

export function StarRating({ value, size = "md", showValue = true }: StarRatingProps) {
  const rounded = Math.round(value * 2) / 2; // demi-étoiles
  const full = Math.floor(rounded);
  const half = rounded - full === 0.5;
  const color = colorFor(value);

  return (
    <span className={`inline-flex items-center gap-1.5 ${SIZES[size]}`} aria-label={`${value.toFixed(1)} sur 5 étoiles`}>
      <span className="inline-flex" style={{ color }}>
        {[0, 1, 2, 3, 4].map((i) => {
          if (i < full) return <span key={i}>★</span>;
          if (i === full && half) return <span key={i} style={{ position: "relative" }}>⯪</span>;
          return (
            <span key={i} style={{ color: "#D8D3C8" }}>
              ★
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className="font-semibold tabular-nums" style={{ color }}>
          {value.toFixed(1)}
        </span>
      )}
    </span>
  );
}
