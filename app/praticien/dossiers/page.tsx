// app/praticien/dossiers/page.tsx
// Liste des dossiers — back-office médecin conseil (server component).
// Accès : rôle praticien obligatoire (redirection sinon).

import { redirect } from "next/navigation";
import { getPraticienSession } from "@/lib/auth/session";
import { listDossiers, type DossierSummary } from "@/lib/praticien/dossiers";
import { DossierTable } from "@/components/praticien/DossierTable";

export const dynamic = "force-dynamic";

export default async function PraticienDossiersPage() {
  const session = await getPraticienSession();
  if (!session) {
    redirect("/praticien/connexion");
  }

  let dossiers: DossierSummary[] = [];
  let error: string | null = null;
  try {
    dossiers = await listDossiers();
  } catch {
    error = "Base de données indisponible — impossible de charger les dossiers.";
  }

  return (
    <main className="min-h-screen bg-[#FCFBF6] px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#0A2E5C]">Dossiers</h1>
              <p className="text-sm text-[#5B6472] mt-1">
                Triés par priorité — les scores les plus faibles en premier.
              </p>
            </div>
            <div className="text-xs text-[#5B6472] text-right">
              Connecté en tant que <span className="font-semibold text-[#16233A]">{session.praticienRole}</span>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-[#E7E3DA] bg-white p-8 text-center text-[#5B6472]">
            {error}
          </div>
        ) : (
          <DossierTable dossiers={dossiers} />
        )}
      </div>
    </main>
  );
}
