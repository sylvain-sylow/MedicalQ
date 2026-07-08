// app/(assure)/dossier/page.tsx
import { redirect } from "next/navigation";
import { getAssuredSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function DossierPage() {
  const session = await getAssuredSession();
  if (!session) {
    redirect("/connexion");
  }

  // Récupérer le dossier de l'assuré
  let file = await prisma.healthFile.findFirst({
    where: { insuredId: session.insuredId },
    orderBy: { createdAt: "desc" },
  });

  // Si aucun dossier n'existe, on en crée un automatiquement pour simplifier le parcours
  if (!file) {
    file = await prisma.healthFile.create({
      data: {
        insuredId: session.insuredId,
        status: "DRAFT",
      },
    });
  }

  const answers = await prisma.answer.findMany({
    where: { fileId: file.id },
    orderBy: { answeredAt: "desc" },
  });

  const answersCount = new Set(answers.map((a) => a.questionId)).size;

  return (
    <div className="min-h-screen bg-[#FCFBF6] py-12 px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-white p-8 rounded-3xl border border-stone-200/60 shadow-xl shadow-stone-100/50">
        <div className="flex justify-between items-center mb-8 border-b border-stone-100 pb-6">
          <div>
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Votre Espace</span>
            <h1 className="text-2xl font-bold text-[#0A2E5C] mt-1">Dossier médical</h1>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            file.status === "DRAFT" || file.status === "IN_PROGRESS"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-250"
          }`}>
            {file.status === "DRAFT" && "Non démarré"}
            {file.status === "IN_PROGRESS" && "En cours"}
            {file.status === "SIGNED" && "Signé"}
            {file.status === "UNDER_REVIEW" && "En cours d'étude"}
          </span>
        </div>

        <div className="space-y-6 mb-8">
          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
            <h3 className="font-semibold text-[#0A2E5C] text-sm uppercase tracking-wider mb-2">Statut du questionnaire</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              {answersCount === 0
                ? "Vous n'avez pas encore commencé à répondre aux questions de santé."
                : `Vous avez répondu à ${answersCount} question(s).`}
            </p>
          </div>

          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
            <h3 className="font-semibold text-[#0A2E5C] text-sm uppercase tracking-wider mb-2">Sécurité & Confidentialité</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Vos données de santé sont stockées sur des serveurs agréés **HDS (Hébergeur de Données de Santé)** et chiffrées de bout en bout. Aucun intermédiaire n'y a accès.
            </p>
          </div>
        </div>

        <a
          href={`/questionnaire?fileId=${file.id}`}
          className="block w-full text-center py-4 bg-[#CC1C29] hover:bg-[#E11B2A] text-white font-semibold rounded-xl shadow-sm transition-all duration-150 cursor-pointer"
        >
          {answersCount === 0 ? "Démarrer le questionnaire" : "Reprendre le questionnaire"}
        </a>

        <div className="text-center mt-6">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-stone-500 hover:text-stone-700 text-xs font-semibold underline cursor-pointer"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
