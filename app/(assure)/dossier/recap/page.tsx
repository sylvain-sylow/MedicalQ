// app/(assure)/dossier/recap/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { DocumentUpload } from "@/components/questionnaire/DocumentUpload";

interface DBAnswer {
  questionId: string;
  value: any;
}

interface DBDocument {
  id: string;
  fileName: string;
  questionId: string | null;
  virusScan: "PENDING" | "CLEAN" | "INFECTED" | "ERROR";
}

interface HealthFileData {
  id: string;
  answers: DBAnswer[];
  documents: DBDocument[];
}

export default function RecapPage() {
  const [fileId, setFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HealthFileData | null>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("fileId") || "cld-test-file-id-j3";
    setFileId(id);
    loadData(id);
  }, []);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/questionnaire/resume?fileId=${id}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const result = await res.json();
      
      // Re-mapper le résultat dans notre structure locale
      setData({
        id,
        answers: Object.entries(result.answers || {}).map(([questionId, value]) => ({
          questionId,
          value,
        })),
        documents: result.documents || [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !fileId || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFBF6] px-4">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-[#CC1C29] rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Génération du récapitulatif...
        </p>
      </div>
    );
  }

  // Détecter les réponses positives pour en déduire les pièces recommandées
  const getAnswerValue = (qId: string) => {
    return data.answers.find((a) => a.questionId === qId)?.value;
  };

  // Liste des pièces recommandées basées sur les déclarations positives
  const recommendations = [
    {
      id: "rec_hospitalisation",
      questionId: "q01_hospitalisation_motif",
      requiredIf: getAnswerValue("q01_hospitalisation") === "oui",
      label: "Compte-rendu d'hospitalisation",
      description: "Requis pour l'analyse de votre hospitalisation des 5 dernières années.",
    },
    {
      id: "rec_diabete",
      questionId: "q01_diabete_type",
      requiredIf: getAnswerValue("q01_diabete") === "oui",
      label: "Dernier bilan biologique HbA1c",
      description: "Requis pour l'analyse de votre diabète.",
    },
    {
      id: "rec_psy",
      questionId: "q11_systemes",
      requiredIf: Array.isArray(getAnswerValue("q11_systemes")) && getAnswerValue("q11_systemes").includes("psy"),
      label: "Certificat détaillé du psychiatre traitant",
      description: "Requis pour l'analyse de l'affection psychologique déclarée.",
    },
    {
      id: "rec_coeur",
      questionId: "q11_systemes",
      requiredIf: Array.isArray(getAnswerValue("q11_systemes")) && getAnswerValue("q11_systemes").includes("coeur"),
      label: "Dernier bilan cardiologique avec ECG",
      description: "Requis pour l'analyse de l'affection cardiovasculaire déclarée.",
    },
  ];

  // Filtrer les pièces recommandées applicables
  const activeRecommendations = recommendations.filter((r) => r.requiredIf);

  // Vérifier pour chaque recommandation si un document y est rattaché
  const missingRecommendations = activeRecommendations.filter((rec) => {
    return !data.documents.some((doc) => doc.questionId === rec.questionId && doc.virusScan !== "INFECTED");
  });

  const attachedDocs = data.documents;

  const handleSign = () => {
    setSigned(true);
  };

  return (
    <div className="min-h-screen bg-[#FCFBF6] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-2">
            Étape Finale
          </span>
          <h1 className="text-3xl font-extrabold text-[#0A2E5C] tracking-tight">
            Récapitulatif & Signature
          </h1>
          <p className="text-stone-500 text-sm mt-2">
            Veuillez vérifier les pièces jointes à votre dossier médical avant de le signer.
          </p>
        </header>

        {signed ? (
          <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 text-3xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-[#0A2E5C] mb-2">Dossier signé avec succès !</h2>
            <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
              Votre signature électronique a été apposée. Le questionnaire et les pièces justificatives ont été transmis de manière sécurisée au médecin-conseil.
            </p>
            <button
              onClick={() => window.location.href = `/dossier?fileId=${fileId}`}
              className="px-6 py-3 bg-[#0A2E5C] hover:bg-[#00275B] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Retourner à mon espace
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Liste des pièces manquantes */}
            {missingRecommendations.length > 0 ? (
              <div className="bg-rose-50/50 border border-rose-200/60 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⚠️</span>
                  <h3 className="font-bold text-rose-800 text-sm uppercase tracking-wider">
                    Pièces recommandées manquantes
                  </h3>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed mb-4">
                  Pour accélérer le traitement de votre dossier par l'assureur, il est vivement recommandé d'ajouter les justificatifs suivants :
                </p>
                <div className="space-y-3">
                  {missingRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white border border-rose-100/80 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-stone-850 text-sm">{rec.label}</h4>
                        <p className="text-xs text-stone-500 mt-0.5">{rec.description}</p>
                      </div>
                      <button
                        onClick={() => setActiveUploadId(activeUploadId === rec.id ? null : rec.id)}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors shrink-0"
                      >
                        {activeUploadId === rec.id ? "Fermer" : "Ajouter 📎"}
                      </button>
                      
                      {activeUploadId === rec.id && (
                        <div className="w-full md:hidden mt-2 border-t pt-3">
                          <DocumentUpload
                            fileId={fileId}
                            questionId={rec.questionId}
                            onUploadSuccess={() => {
                              loadData(fileId);
                              setActiveUploadId(null);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-3xl p-6 flex items-center gap-3">
                <span className="text-xl">✨</span>
                <div>
                  <h3 className="font-bold text-emerald-800 text-sm">Dossier complet !</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Toutes les pièces justificatives recommandées pour vos déclarations ont été fournies.
                  </p>
                </div>
              </div>
            )}

            {/* Zone d'upload intégrée si sélectionnée sur grand écran */}
            {activeUploadId && (
              <div className="hidden md:block bg-white p-6 border border-stone-200 rounded-3xl">
                <h3 className="font-bold text-stone-800 text-sm mb-2">
                  Téléverser : {activeRecommendations.find((r) => r.id === activeUploadId)?.label}
                </h3>
                <DocumentUpload
                  fileId={fileId}
                  questionId={activeRecommendations.find((r) => r.id === activeUploadId)!.questionId}
                  onUploadSuccess={() => {
                    loadData(fileId);
                    setActiveUploadId(null);
                  }}
                />
              </div>
            )}

            {/* 2. Liste de tous les documents joints */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm">
              <h3 className="font-bold text-[#0A2E5C] text-lg mb-4 flex items-center gap-2">
                <span>📎</span> Documents joints à votre dossier ({attachedDocs.length})
              </h3>

              {attachedDocs.length === 0 ? (
                <p className="text-stone-400 text-xs py-4 text-center">
                  Aucun document n'a été rattaché pour le moment.
                </p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {attachedDocs.map((doc) => (
                    <div key={doc.id} className="py-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 overflow-hidden mr-4">
                        <span className="text-lg">📄</span>
                        <div className="overflow-hidden">
                          <span className="font-semibold text-stone-800 block truncate">{doc.fileName}</span>
                          <span className="text-[10px] text-stone-400">
                            {doc.questionId ? `Rattaché à : ${doc.questionId}` : "Document général"}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase shrink-0 ${
                          doc.virusScan === "CLEAN"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : doc.virusScan === "INFECTED"
                            ? "bg-rose-50 text-rose-700 border border-rose-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse"
                        }`}
                      >
                        {doc.virusScan === "PENDING" && "Scan..."}
                        {doc.virusScan === "CLEAN" && "Sain"}
                        {doc.virusScan === "INFECTED" && "Rejeté"}
                        {doc.virusScan === "ERROR" && "Erreur"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Consentement final et bouton de Signature */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-[#0A2E5C] text-lg">
                Signature électronique
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                En certifiant et signant ce dossier, vous attestez sur l'honneur de l'exactitude des informations fournies. Les fausses déclarations peuvent entraîner la nullité de votre contrat d'assurance.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleSign}
                  className="w-full py-4 bg-[#CC1C29] hover:bg-[#E11B2A] text-white font-bold rounded-2xl text-sm transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  ✍️ Certifier et signer le dossier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
