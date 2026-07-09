// components/questionnaire/GamifiedProgress.tsx
// En-tête de progression "ludique" du parcours assuré.
// RÈGLE : jamais de score/étoile ici. Sur les écrans sensibles, on désactive
// l'habillage ludique (messages d'encouragement, animation de pastille).

"use client";

import React from "react";
import { motion } from "framer-motion";

export interface ProgressData {
  stage: "identite" | "general" | "systemes" | "modules" | "modes_vie" | "signature";
  stageIndex: number;
  stageTotalCount: number;
}

const STAGES: {
  key: ProgressData["stage"];
  label: string;
  icon: string;
  cheer: string;
}[] = [
  { key: "identite", label: "Vous", icon: "👤", cheer: "Faisons connaissance" },
  { key: "general", label: "Santé", icon: "🩺", cheer: "Quelques bases, tout simplement" },
  { key: "systemes", label: "Bilan", icon: "🫀", cheer: "On fait le tour, rien de plus" },
  { key: "modules", label: "Précisions", icon: "🔍", cheer: "On précise pour bien vous représenter" },
  { key: "modes_vie", label: "Quotidien", icon: "🌿", cheer: "Presque fini — parlons de votre quotidien" },
  { key: "signature", label: "Signature", icon: "✍️", cheer: "Dernière étape, bravo !" },
];

export function GamifiedProgress({
  progress,
  sensitive = false,
}: {
  progress: ProgressData;
  sensitive?: boolean;
}) {
  const currentIndex = STAGES.findIndex((s) => s.key === progress.stage);
  const safeIndex = currentIndex < 0 ? 0 : currentIndex;
  const current = STAGES[safeIndex];

  // Progression globale : étape franchie + fraction dans l'étape courante.
  const withinStage =
    progress.stageTotalCount > 0
      ? Math.min(1, progress.stageIndex / progress.stageTotalCount)
      : 0;
  const globalPct = ((safeIndex + withinStage) / STAGES.length) * 100;

  return (
    <div className="w-full">
      {/* Stepper : le voyage en pastilles */}
      <div className="flex items-center justify-between mb-3">
        {STAGES.map((s, i) => {
          const done = i < safeIndex;
          const active = i === safeIndex;
          return (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center gap-1 min-w-0">
                <motion.div
                  initial={false}
                  animate={{
                    scale: active && !sensitive ? [1, 1.12, 1] : 1,
                    backgroundColor: done || active ? "#0A2E5C" : "#EFEBE1",
                    color: done || active ? "#FFFFFF" : "#9C9484",
                  }}
                  transition={{ duration: 0.4 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm"
                  aria-current={active ? "step" : undefined}
                >
                  {done ? "✓" : <span className="text-[15px] leading-none">{s.icon}</span>}
                </motion.div>
                <span
                  className={`text-[10px] font-semibold tracking-wide hidden sm:block ${
                    active ? "text-[#0A2E5C]" : "text-[#9C9484]"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 rounded-full bg-[#EFEBE1] relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#0A2E5C] rounded-full transition-all duration-500"
                    style={{ width: i < safeIndex ? "100%" : "0%" }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Barre de progression globale animée */}
      <div className="w-full h-2 bg-[#EFEBE1] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: sensitive
              ? "#0A2E5C"
              : "linear-gradient(90deg, #0A2E5C 0%, #1E4E8C 60%, #CC1C29 100%)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${globalPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Message d'encouragement (masqué sur écran sensible) */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-[#5B6472]">
          {sensitive ? current.label : current.cheer}
        </span>
        <span className="text-xs font-semibold text-[#0A2E5C] tabular-nums">
          {Math.round(globalPct)}%
        </span>
      </div>
    </div>
  );
}
