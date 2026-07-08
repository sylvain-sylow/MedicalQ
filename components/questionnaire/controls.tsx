// components/questionnaire/controls.tsx
"use client";

import React, { useState, useEffect } from "react";

// --- Types ---
export interface ControlProps<T = any> {
  value: T;
  onChange: (val: T) => void;
  options?: { value: string; label: string; icon?: string }[];
  slider?: { min: number; max: number; step: number; unit: string; defaultValue?: number };
  hint?: string;
  sensitive?: boolean;
}

// ─── 1. YES / NO CONTROL ──────────────────────────────────────────────────────
export function YesNoControl({ value, onChange, sensitive }: ControlProps<string>) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto my-6">
      <button
        type="button"
        onClick={() => onChange("oui")}
        className={`flex-1 py-6 px-8 rounded-2xl border-2 text-xl font-medium transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[100px] ${
          value === "oui"
            ? "border-emerald-600 bg-emerald-50/50 text-emerald-950"
            : "border-stone-200 bg-white hover:border-stone-300 text-stone-700"
        }`}
      >
        <span className="text-2xl">Oui</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("non")}
        className={`flex-1 py-6 px-8 rounded-2xl border-2 text-xl font-medium transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[100px] ${
          value === "non"
            ? "border-rose-600 bg-rose-50/50 text-rose-950"
            : "border-stone-200 bg-white hover:border-stone-300 text-stone-700"
        }`}
      >
        <span className="text-2xl">Non</span>
      </button>
    </div>
  );
}

// ─── 2. SLIDER CONTROL ────────────────────────────────────────────────────────
export function SliderControl({ value, onChange, slider }: ControlProps<number>) {
  const min = slider?.min ?? 0;
  const max = slider?.max ?? 100;
  const step = slider?.step ?? 1;
  const unit = slider?.unit ?? "";

  const [inputValue, setInputValue] = useState<string>(String(value ?? slider?.defaultValue ?? min));

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(String(value));
    }
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onChange(val);
    setInputValue(String(val));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const val = Number(e.target.value);
    if (!isNaN(val) && val >= min && val <= max) {
      onChange(val);
    }
  };

  const currentVal = value ?? slider?.defaultValue ?? min;

  return (
    <div className="w-full max-w-md mx-auto my-6 p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-medium text-stone-500">Ajustez la valeur :</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            min={min}
            max={max}
            className="w-20 px-3 py-1.5 border border-stone-200 rounded-lg text-right font-semibold text-lg text-stone-850 focus:outline-none focus:border-red-650"
          />
          <span className="text-sm font-semibold text-stone-600">{unit}</span>
        </div>
      </div>

      <div className="relative pt-6 pb-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentVal}
          onChange={handleSliderChange}
          className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#CC1C29]"
        />
        <div className="flex justify-between text-xs text-stone-400 mt-3 px-1">
          <span>{min} {unit}</span>
          <span>{max} {unit}</span>
        </div>
      </div>
    </div>
  );
}

// ─── 3. DOUBLE SLIDER CONTROL (Taille & Poids) ──────────────────────────────
export function DoubleSliderControl({
  value,
  onChange,
}: ControlProps<{ taille: number; poids: number }>) {
  const currentVal = value || { taille: 170, poids: 70 };

  const handleTailleChange = (taille: number) => {
    onChange({ ...currentVal, taille });
  };

  const handlePoidsChange = (poids: number) => {
    onChange({ ...currentVal, poids });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-stone-700">Taille</span>
          <span className="text-xl font-bold text-[#0A2E5C]">{currentVal.taille} cm</span>
        </div>
        <input
          type="range"
          min={100}
          max={220}
          value={currentVal.taille}
          onChange={(e) => handleTailleChange(Number(e.target.value))}
          className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#0A2E5C]"
        />
      </div>

      <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-stone-700">Poids actuel</span>
          <span className="text-xl font-bold text-[#0A2E5C]">{currentVal.poids} kg</span>
        </div>
        <input
          type="range"
          min={30}
          max={250}
          value={currentVal.poids}
          onChange={(e) => handlePoidsChange(Number(e.target.value))}
          className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#0A2E5C]"
        />
      </div>
      {/* Remarque : L'IMC n'est jamais calculé ou affiché ici, respect de la règle d'isolation */}
    </div>
  );
}

// ─── 4. GRID CONTROL (Q11 14 systèmes) ──────────────────────────────────────
export function GridControl({ value, onChange, options }: ControlProps<string[]>) {
  const selected = value || [];

  const handleToggle = (val: string) => {
    if (val === "aucun") {
      onChange(["aucun"]);
      return;
    }

    let next = selected.filter((item) => item !== "aucun");
    if (next.includes(val)) {
      next = next.filter((item) => item !== val);
    } else {
      next.push(val);
    }

    if (next.length === 0) {
      next = ["aucun"];
    }

    onChange(next);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options?.map((opt) => {
          const isSelected = selected.includes(opt.value);
          const isAucun = opt.value === "aucun";

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleToggle(opt.value)}
              className={`p-4 rounded-xl border-2 transition-all duration-150 flex flex-col items-center justify-center gap-3 text-center cursor-pointer min-h-[96px] ${
                isSelected
                  ? isAucun
                    ? "border-stone-500 bg-stone-100 text-stone-900 font-medium"
                    : "border-red-650 bg-red-50/20 text-[#0A2E5C] font-semibold"
                  : "border-stone-200 bg-white hover:border-stone-300 text-stone-600"
              }`}
            >
              <span className="text-2xl select-none" role="img" aria-label={opt.label}>
                {getEmojiForIcon(opt.icon)}
              </span>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getEmojiForIcon(icon?: string): string {
  switch (icon) {
    case "heart": return "❤️";
    case "brain": return "🧠";
    case "lungs": return "🫁";
    case "stomach": return "🍕";
    case "liver": return "🏺";
    case "kidney": return "🥜";
    case "bone": return "🦴";
    case "mind": return "💭";
    case "cell": return "🔬";
    case "glucose": return "🩸";
    case "thyroid": return "🦋";
    case "blood": return "💉";
    case "shield": return "🛡️";
    case "check": return "✨";
    default: return "📄";
  }
}

// ─── 5. DATE CONTROL ──────────────────────────────────────────────────────────
export function DateControl({ value, onChange }: ControlProps<string>) {
  return (
    <div className="w-full max-w-md mx-auto my-6 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center">
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-xs px-4 py-3 border border-stone-200 rounded-xl font-medium text-lg text-stone-800 focus:outline-none focus:border-red-650"
      />
    </div>
  );
}

// ─── 6. SELECT CONTROL ────────────────────────────────────────────────────────
export function SelectControl({ value, onChange, options }: ControlProps<string>) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto my-6">
      {options?.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full py-4 px-6 rounded-xl border-2 text-left font-medium transition-all duration-150 flex items-center justify-between cursor-pointer min-h-[56px] ${
              isSelected
                ? "border-red-650 bg-red-50/20 text-[#0A2E5C]"
                : "border-stone-200 bg-white hover:border-stone-300 text-stone-700"
            }`}
          >
            <span>{opt.label}</span>
            {isSelected && (
              <span className="w-5 h-5 rounded-full bg-[#CC1C29] flex items-center justify-center text-white text-xs">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── 7. TEXT CONTROL ──────────────────────────────────────────────────────────
export function TextControl({ value, onChange, hint }: ControlProps<string>) {
  return (
    <div className="w-full max-w-md mx-auto my-6 flex flex-col gap-2">
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Saisissez votre réponse ici..."
        rows={4}
        className="w-full p-4 border border-stone-200 rounded-2xl font-medium text-stone-850 focus:outline-none focus:border-red-650 resize-y min-h-[120px]"
      />
      {hint && <span className="text-xs text-stone-400 px-1">{hint}</span>}
    </div>
  );
}
