// components/praticien/DossierTable.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { StarRating } from "./StarRating";
import type { DossierSummary } from "@/lib/praticien/dossiers";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
  SIGNED: "Signé",
  UNDER_REVIEW: "En revue",
  EXAMS_REQUESTED: "Examens demandés",
  CLOSED: "Clôturé",
};

type Filter = "all" | "at_risk" | "comorbidity" | "signed";

export function DossierTable({ dossiers }: { dossiers: DossierSummary[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    return dossiers.filter((d) => {
      if (query && !d.insuredName.toLowerCase().includes(query.toLowerCase()) && !d.id.includes(query)) {
        return false;
      }
      if (filter === "at_risk") return d.globalScore <= 3 || d.weakThemes.length > 0;
      if (filter === "comorbidity") return d.comorbidityCount > 0 || d.metabolicCluster;
      if (filter === "signed") return d.status === "SIGNED";
      return true;
    });
  }, [dossiers, query, filter]);

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: `Tous (${dossiers.length})` },
    { key: "at_risk", label: "À risque (≤3★)" },
    { key: "comorbidity", label: "Comorbidités" },
    { key: "signed", label: "Signés" },
  ];

  return (
    <div>
      {/* Barre de recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou numéro de dossier…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#E7E3DA] bg-white text-[#16233A] focus:outline-none focus:border-[#0A2E5C]"
        />
        <div className="flex gap-2 flex-wrap">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filter === c.key
                  ? "bg-[#0A2E5C] text-white"
                  : "bg-white border border-[#E7E3DA] text-[#5B6472] hover:border-[#0A2E5C]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto rounded-2xl border border-[#E7E3DA] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[#5B6472] border-b border-[#E7E3DA]">
              <th className="px-4 py-3 font-semibold">Assuré</th>
              <th className="px-4 py-3 font-semibold">Score global</th>
              <th className="px-4 py-3 font-semibold">Alertes</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Validité</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-[#F0EDE4] last:border-0 hover:bg-[#FCFBF6] transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/praticien/dossiers/${d.id}`} className="font-semibold text-[#0A2E5C] hover:underline">
                    {d.insuredName || "Sans nom"}
                  </Link>
                  <div className="text-xs text-[#5B6472] font-mono">{d.id.slice(0, 12)}…</div>
                </td>
                <td className="px-4 py-3">
                  <StarRating value={d.globalScore} size="sm" />
                  {d.globalScore < d.rawGlobalScore && (
                    <div className="text-[11px] text-[#CC1C29] mt-0.5">
                      brut {d.rawGlobalScore.toFixed(1)} · comorbidité −{(d.rawGlobalScore - d.globalScore).toFixed(1)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {d.weakThemes.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FBE9EA] text-[#CC1C29] text-xs font-semibold">
                        {d.weakThemes.length} rubrique{d.weakThemes.length > 1 ? "s" : ""} ≤2★
                      </span>
                    )}
                    {d.comorbidityCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FCEFD9] text-[#B7791F] text-xs font-semibold">
                        {d.comorbidityCount} comorbidité{d.comorbidityCount > 1 ? "s" : ""}
                      </span>
                    )}
                    {d.metabolicCluster && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FCEFD9] text-[#B7791F] text-xs font-semibold">
                        syndrome métabolique
                      </span>
                    )}
                    {d.weakThemes.length === 0 && d.comorbidityCount === 0 && !d.metabolicCluster && (
                      <span className="text-[#5B6472] text-xs">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[#16233A]">{STATUS_LABELS[d.status] ?? d.status}</span>
                </td>
                <td className="px-4 py-3 text-[#5B6472]">
                  {d.validUntil ? new Date(d.validUntil).toLocaleDateString("fr-FR") : "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#5B6472]">
                  Aucun dossier ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
