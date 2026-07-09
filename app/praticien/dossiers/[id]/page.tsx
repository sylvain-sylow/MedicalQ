// app/praticien/dossiers/[id]/page.tsx
// Détail d'un dossier — back-office médecin conseil (server component).
// Journalise l'accès (spec § 9). Affiche score ajusté, comorbidités, rubriques, pièces manquantes.

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getPraticienSession } from "@/lib/auth/session";
import { getDossierDetail } from "@/lib/praticien/dossiers";
import { logPraticienAccess } from "@/lib/audit";
import { StarRating } from "@/components/praticien/StarRating";
import { RISK_FACTOR_LABELS } from "@/lib/scoring/comorbidities";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
  SIGNED: "Signé",
  UNDER_REVIEW: "En revue",
  EXAMS_REQUESTED: "Examens demandés",
  CLOSED: "Clôturé",
};

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getPraticienSession();
  if (!session) redirect("/praticien/connexion");

  const { id } = await params;
  const detail = await getDossierDetail(id);
  if (!detail) notFound();

  // Journalisation de l'accès (obligatoire, spec § 9).
  await logPraticienAccess({
    praticienId: session.praticienId,
    fileId: id,
    action: "dossier.view",
  });

  const { scoring, missingDocuments, signature } = detail.synthesis;
  const comorbidities = scoring.comorbidities;
  const themes = Object.entries(scoring.perTheme).sort((a, b) => a[1] - b[1]);

  return (
    <main className="min-h-screen bg-[#FCFBF6] px-4 sm:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/praticien/dossiers" className="text-sm text-[#5B6472] hover:text-[#0A2E5C]">
          ← Retour aux dossiers
        </Link>

        {/* ── Bandeau de synthèse ── */}
        <section className="mt-4 rounded-2xl border border-[#E7E3DA] bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0A2E5C]">{detail.insuredName || "Sans nom"}</h1>
              <div className="text-sm text-[#5B6472] mt-1 space-x-3">
                {detail.age !== null && <span>{detail.age} ans</span>}
                <span>Statut : {STATUS_LABELS[detail.status] ?? detail.status}</span>
                {signature?.validUntil && (
                  <span>Valide jusqu'au {new Date(signature.validUntil).toLocaleDateString("fr-FR")}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-[#5B6472] mb-1">Score global ajusté</div>
              <StarRating value={scoring.adjustedGlobalScore} size="lg" />
              {comorbidities.totalPenalty > 0 && (
                <div className="text-xs text-[#CC1C29] mt-1">
                  brut {scoring.globalScore.toFixed(1)} · pénalité comorbidité −{comorbidities.totalPenalty.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Comorbidités (couples de pathologies défavorables) ── */}
        <section className="mt-5 rounded-2xl border border-[#E7E3DA] bg-white p-6">
          <h2 className="text-lg font-bold text-[#0A2E5C] mb-1">Comorbidités &amp; facteurs de risque</h2>
          <p className="text-sm text-[#5B6472] mb-4">
            Couples de pathologies dont l&apos;association aggrave le pronostic au-delà de la somme des risques isolés.
          </p>

          {comorbidities.factors.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {comorbidities.factors.map((f) => (
                <span key={f} className="px-2.5 py-1 rounded-full bg-[#F0EDE4] text-[#16233A] text-xs font-medium">
                  {RISK_FACTOR_LABELS[f] ?? f}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5B6472]">Aucun facteur de risque majeur détecté.</p>
          )}

          {comorbidities.metabolicCluster && (
            <div className="mb-4 rounded-xl border border-[#EBD9AF] bg-[#FCEFD9] px-4 py-3">
              <div className="font-semibold text-[#B7791F] text-sm">⚠ Cluster syndrome métabolique</div>
              <div className="text-xs text-[#8A6D2F] mt-0.5">
                {comorbidities.metabolicCluster.factors.map((f) => RISK_FACTOR_LABELS[f]).join(" · ")} — pénalité additionnelle −{comorbidities.metabolicCluster.penalty.toFixed(2)}★
              </div>
            </div>
          )}

          {comorbidities.triggered.length > 0 ? (
            <ul className="space-y-3">
              {comorbidities.triggered.map((c, i) => (
                <li key={i} className="rounded-xl border border-[#E7E3DA] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#16233A]">{c.label}</span>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#FBE9EA] text-[#CC1C29] text-xs font-bold">
                      −{c.penalty.toFixed(2)}★
                    </span>
                  </div>
                  <p className="text-sm text-[#5B6472] mt-1.5 leading-relaxed">{c.rationale}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#5B6472]">Aucun couple défavorable déclenché.</p>
          )}
        </section>

        {/* ── Scores par rubrique ── */}
        <section className="mt-5 rounded-2xl border border-[#E7E3DA] bg-white p-6">
          <h2 className="text-lg font-bold text-[#0A2E5C] mb-4">Scores par rubrique</h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {themes.map(([theme, score]) => (
              <div key={theme} className="flex items-center justify-between border-b border-[#F0EDE4] py-1.5">
                <span className={`text-sm ${score <= 2 ? "text-[#CC1C29] font-semibold" : "text-[#16233A]"}`}>
                  {theme}
                </span>
                <StarRating value={score} size="sm" showValue={false} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Pièces manquantes ── */}
        <section className="mt-5 rounded-2xl border border-[#E7E3DA] bg-white p-6">
          <h2 className="text-lg font-bold text-[#0A2E5C] mb-3">Pièces justificatives manquantes</h2>
          {missingDocuments.length > 0 ? (
            <ul className="space-y-2">
              {missingDocuments.map((doc) => (
                <li key={doc.id} className="flex items-start gap-2 text-sm">
                  <span className="text-[#CC1C29] mt-0.5">•</span>
                  <div>
                    <span className="font-medium text-[#16233A]">{doc.label}</span>
                    <span className="text-[#5B6472]"> — {doc.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#5B6472]">Toutes les pièces attendues sont présentes.</p>
          )}
        </section>

        <div className="mt-5 flex gap-3">
          <Link
            href={`/praticien/dossiers/${id}/examens`}
            className="px-5 py-2.5 rounded-xl bg-[#0A2E5C] text-white font-semibold text-sm hover:bg-[#00275B] transition-colors"
          >
            Demander des examens complémentaires
          </Link>
        </div>
      </div>
    </main>
  );
}
