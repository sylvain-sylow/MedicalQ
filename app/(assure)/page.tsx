// app/(assure)/page.tsx
import React from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FCFBF6] flex flex-col justify-between">
      {/* Navigation */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <span className="font-bold text-lg text-[#0A2E5C] tracking-wide">
          SYLOW <span className="text-[#CC1C29]">//</span> SANTÉ
        </span>
        <a
          href="/connexion"
          className="px-4 py-2 text-sm font-semibold text-[#0A2E5C] border border-[#0A2E5C] rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
        >
          Espace sécurisé
        </a>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-6 flex flex-col items-center justify-center text-center py-12">
        <span className="text-[#CC1C29] font-bold text-xs uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full mb-6">
          Assurance Emprunteur
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#0A2E5C] max-w-3xl leading-tight">
          Votre déclaration de santé, en toute simplicité.
        </h1>
        <p className="text-stone-600 md:text-lg max-w-xl mt-6 leading-relaxed">
          Un parcours guidé, dynamique et entièrement sécurisé pour remplir votre questionnaire médical de manière confidentielle.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <a
            href="/connexion"
            className="flex-1 py-4 bg-[#CC1C29] hover:bg-[#E11B2A] text-white font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Commencer mon parcours
          </a>
        </div>

        {/* Features/Reassurance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-3xl w-full text-left">
          <div className="p-5 bg-white rounded-2xl border border-stone-200/50 shadow-sm">
            <span className="text-2xl mb-2 block">🔒</span>
            <h3 className="font-bold text-[#0A2E5C] text-sm uppercase tracking-wider">Agréé HDS</h3>
            <p className="text-stone-500 text-xs mt-1 leading-normal">
              Vos données sont protégées sur des infrastructures certifiées par le Ministère de la Santé.
            </p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-stone-200/50 shadow-sm">
            <span className="text-2xl mb-2 block">⚡</span>
            <h3 className="font-bold text-[#0A2E5C] text-sm uppercase tracking-wider">Gain de temps</h3>
            <p className="text-stone-500 text-xs mt-1 leading-normal">
              Les questions s'adaptent à vos réponses pour un parcours simplifié au maximum.
            </p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-stone-200/50 shadow-sm">
            <span className="text-2xl mb-2 block">📋</span>
            <h3 className="font-bold text-[#0A2E5C] text-sm uppercase tracking-wider">Loi Lemoine</h3>
            <p className="text-stone-500 text-xs mt-1 leading-normal">
              Vérification automatique de votre éligibilité à l'exonération légale.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-stone-200/40 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} Sylow Courtage. Tous droits réservés. Agréé HDS.
      </footer>
    </div>
  );
}
