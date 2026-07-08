// app/(assure)/questionnaire/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  YesNoControl,
  SliderControl,
  DoubleSliderControl,
  GridControl,
  DateControl,
  SelectControl,
  TextControl,
} from "@/components/questionnaire/controls";
import { DocumentUpload } from "@/components/questionnaire/DocumentUpload";
import { API_URL } from "@/lib/api/config";

interface QuestionData {
  id: string;
  text: string;
  hint?: string;
  type: "yesno" | "slider" | "dual_slider" | "multiselect" | "select" | "date" | "period" | "text" | "frequency" | "scale" | "text_attachment";
  options?: { value: string; label: string; icon?: string }[];
  slider?: { min: number; max: number; step: number; unit: string; defaultValue?: number };
  textSensitive?: boolean;
  allowUpload?: boolean;
}

interface ProgressData {
  stage: "identite" | "general" | "systemes" | "modules" | "modes_vie" | "signature";
  stageIndex: number;
  stageTotalCount: number;
}

export default function QuestionnairePage() {
  const [fileId, setFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentValue, setCurrentValue] = useState<any>(undefined);
  const [history, setHistory] = useState<string[]>([]);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("saved");
  const [done, setDone] = useState(false);

  // Charger le fileId depuis l'URL ou créer un dossier temporaire si nécessaire
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get("fileId");
    if (!id) {
      // Pour le dev, si aucun fileId n'est fourni, on tente de le récupérer ou on en génère un
      id = "cld-test-file-id-j3"; 
    }
    setFileId(id);
    loadQuestion(id);
  }, []);

  const loadQuestion = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/questionnaire/resume?fileId=${id}`);
      if (!res.ok) {
        throw new Error("Impossible de charger le questionnaire");
      }
      const data = await res.json();
      if (data.done) {
        setDone(true);
      } else {
        setQuestion(data.question);
        setProgress(data.progress);
        // Initialiser la valeur de la question courante si elle a déjà été répondue
        setCurrentValue(undefined);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (val: any) => {
    setCurrentValue(val);
  };

  const handleNext = async () => {
    if (!fileId || !question) return;

    setSaveStatus("saving");
    try {
      // 1. Sauvegarder la réponse
      const answerRes = await fetch(`${API_URL}/api/questionnaire/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          questionId: question.id,
          value: currentValue,
        }),
      });

      if (!answerRes.ok) throw new Error("Erreur de sauvegarde");
      
      setSaveStatus("saved");
      setDirection("forward");
      
      // Ajouter à l'historique local pour pouvoir revenir en arrière
      setHistory((prev) => [...prev, question.id]);

      // 2. Charger la question suivante
      const nextRes = await fetch(`${API_URL}/api/questionnaire/next-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (!nextRes.ok) throw new Error("Erreur question suivante");
      const nextData = await nextRes.json();

      if (nextData.done) {
        setDone(true);
      } else {
        setQuestion(nextData.question);
        setProgress(nextData.progress);
        setCurrentValue(undefined);
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  };

  const handleBack = async () => {
    if (history.length === 0 || !fileId) return;

    setDirection("backward");
    setLoading(true);

    try {
      const prevQuestionId = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);

      // Simuler le retour en arrière en rechargeant l'état
      // Dans une implémentation avancée, on pourrait appeler une API de suppression de la dernière réponse
      // Ici, on recharge simplement la question correspondante depuis le serveur
      const res = await fetch(`/api/questionnaire/resume?fileId=${fileId}`);
      const data = await res.json();

      if (data.question) {
        setQuestion(data.question);
        setProgress(data.progress);
        setCurrentValue(undefined);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Rendu de l'état de chargement
  if (loading && !question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFBF6] px-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-stone-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-red-650 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-stone-500 font-medium">Chargement de votre questionnaire sécurisé...</p>
      </div>
    );
  }

  // Écran de fin du questionnaire
  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFBF6] px-6 py-12 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-600 text-4xl shadow-sm border border-emerald-100">
          ✓
        </div>
        <h1 className="text-3xl font-bold text-[#0A2E5C] mb-4">Questionnaire terminé</h1>
        <p className="text-stone-600 max-w-md mb-8 leading-relaxed">
          Merci d'avoir rempli votre déclaration de santé. Vos réponses sont sauvegardées et chiffrées en toute sécurité.
        </p>
        <button
          onClick={() => window.location.href = `/dossier/recap?fileId=${fileId}`}
          className="px-8 py-3.5 bg-[#0A2E5C] hover:bg-[#00275B] text-white font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          Voir le récapitulatif & signer
        </button>
      </div>
    );
  }

  if (!question) return null;

  // Déterminer si l'écran est sensible (ex: psychiatrie)
  // RÈGLE : design épuré, ton neutre, sans animations ludiques
  const isSensitive = question.textSensitive || question.id.includes("psy");

  // Configuration des animations Framer Motion
  const slideVariants = {
    enter: (dir: "forward" | "backward") => ({
      x: dir === "forward" ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: "forward" | "backward") => ({
      x: dir === "forward" ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  const isPositiveAnswer = (type: string, val: any) => {
    if (val === undefined || val === null || val === "") return false;
    if (type === "yesno") return val === "oui";
    if (type === "select") return val !== "jamais" && val !== "non" && val !== "non_applicable";
    if (type === "multiselect") {
      if (Array.isArray(val)) {
        return val.length > 0 && !val.includes("aucun") && !val.includes("none");
      }
      return false;
    }
    return true;
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
        isSensitive ? "bg-stone-50 text-stone-900" : "bg-[#FCFBF6] text-stone-850"
      }`}
    >
      {/* ─── Barre de progression et Entête ─── */}
      <header className="w-full max-w-4xl mx-auto px-6 py-4 flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs font-semibold tracking-wider text-stone-400 uppercase">
          <span>Questionnaire Médical</span>
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && <span className="text-amber-600 animate-pulse">Sauvegarde...</span>}
            {saveStatus === "saved" && <span className="text-stone-400">Enregistré</span>}
            {saveStatus === "error" && <span className="text-red-650">Erreur de connexion</span>}
          </div>
        </div>

        {progress && (
          <div className="w-full">
            <div className="flex justify-between text-xs font-medium text-stone-500 mb-1.5">
              <span className="capitalize">Étape : {progress.stage.replace("_", " ")}</span>
              <span>{progress.stageIndex} / {progress.stageTotalCount}</span>
            </div>
            <div className="w-full h-1.5 bg-stone-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0A2E5C] transition-all duration-500"
                style={{ width: `${(progress.stageIndex / progress.stageTotalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* ─── Zone principale (Question + Contrôle) ─── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-hidden">
        <div className="w-full max-w-2xl relative">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={question.id}
              custom={direction}
              variants={slideVariants}
              initial={isSensitive ? undefined : "enter"}
              animate={isSensitive ? undefined : "center"}
              exit={isSensitive ? undefined : "exit"}
              transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.38 }}
              className="w-full flex flex-col items-center text-center"
            >
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0A2E5C] mb-3 max-w-xl leading-tight">
                {question.text}
              </h2>
              {question.hint && (
                <p className="text-stone-500 text-sm max-w-lg mb-6 leading-relaxed">
                  {question.hint}
                </p>
              )}

              {/* Rendu dynamique du contrôle */}
              <div className="w-full py-4">
                {question.type === "yesno" && (
                  <YesNoControl
                    value={currentValue}
                    onChange={(val) => {
                      handleValueChange(val);
                      // Auto-advance sur clic Oui/Non pour un parcours fluide
                      // SAUF si la question permet l'upload et que la réponse est positive
                      if (!(question.allowUpload && val === "oui")) {
                        setTimeout(() => handleNext(), 250);
                      }
                    }}
                    sensitive={isSensitive}
                  />
                )}

                {question.type === "slider" && (
                  <SliderControl
                    value={currentValue}
                    onChange={handleValueChange}
                    slider={question.slider}
                  />
                )}

                {question.type === "dual_slider" && (
                  <DoubleSliderControl
                    value={currentValue}
                    onChange={handleValueChange}
                  />
                )}

                {question.type === "multiselect" && (
                  <GridControl
                    value={currentValue}
                    onChange={handleValueChange}
                    options={question.options}
                  />
                )}

                {question.type === "select" && (
                  <SelectControl
                    value={currentValue}
                    onChange={handleValueChange}
                    options={question.options}
                  />
                )}

                {question.type === "date" && (
                  <DateControl
                    value={currentValue}
                    onChange={handleValueChange}
                  />
                )}

                {question.type === "text" && (
                  <TextControl
                    value={currentValue}
                    onChange={handleValueChange}
                    hint={question.hint}
                  />
                )}
              </div>

              {/* Dépôt de document facultatif si requis et réponse positive */}
              {question.allowUpload && fileId && isPositiveAnswer(question.type, currentValue) && (
                <div className="w-full flex justify-center mt-4">
                  <DocumentUpload
                    fileId={fileId}
                    questionId={question.id}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ─── Barre d'action basse (Suivant / Précédent) ─── */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-6 border-t border-stone-200/50 flex justify-between items-center">
        <button
          type="button"
          onClick={handleBack}
          disabled={history.length === 0}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer ${
            history.length === 0
              ? "text-stone-300 bg-transparent cursor-not-allowed"
              : "text-stone-600 bg-stone-100 hover:bg-stone-200"
          }`}
        >
          ← Retour
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentValue === undefined && question.type !== "text"}
          className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer ${
            currentValue === undefined && question.type !== "text"
              ? "bg-stone-200 text-stone-400 cursor-not-allowed"
              : "bg-[#CC1C29] hover:bg-[#E11B2A] text-white shadow-sm"
          }`}
        >
          Suivant →
        </button>
      </footer>
    </div>
  );
}
