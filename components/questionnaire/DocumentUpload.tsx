// components/questionnaire/DocumentUpload.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "@/lib/api/config";

interface AttachedDocument {
  id: string;
  fileName: string;
  virusScan: "PENDING" | "CLEAN" | "INFECTED" | "ERROR";
}

interface DocumentUploadProps {
  fileId: string;
  questionId: string;
  onUploadSuccess?: () => void;
}

export function DocumentUpload({ fileId, questionId, onUploadSuccess }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<AttachedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les documents déjà rattachés à cette question
  useEffect(() => {
    loadAttachedDocuments();
    // Poll toutes les 3 secondes si des scans sont PENDING
    const interval = setInterval(() => {
      if (documents.some((d) => d.virusScan === "PENDING")) {
        loadAttachedDocuments();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [documents]);

  const loadAttachedDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/questionnaire/resume?fileId=${fileId}`);
      if (!res.ok) return;
      const data = await res.json();
      // Filtrer les documents rattachés à la question courante
      if (data.documents) {
        const questionDocs = data.documents
          .filter((d: any) => d.questionId === questionId)
          .map((d: any) => ({
            id: d.id,
            fileName: d.fileName,
            virusScan: d.virusScan,
          }));
        setDocuments(questionDocs);
      }
    } catch (err) {
      console.error("Erreur de chargement des documents joints", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    // 1. Validation côté client
    const allowedExtensions = /(\.pdf|\.png|\.jpg|\.jpeg|\.heic)$/i;
    if (!allowedExtensions.exec(file.name)) {
      setError("Format de fichier non supporté. Seuls PDF, PNG, JPG et HEIC sont autorisés.");
      setUploading(false);
      return;
    }

    const maxSize = 15 * 1024 * 1024; // 15 Mo
    if (file.size > maxSize) {
      setError("Le fichier dépasse la taille maximale autorisée de 15 Mo.");
      setUploading(false);
      return;
    }

    if (documents.length >= 10) {
      setError("Vous avez atteint la limite de 10 documents par dossier.");
      setUploading(false);
      return;
    }

    try {
      // 2. Demander une URL pré-signée
      const presignedRes = await fetch(`${API_URL}/api/documents/presigned-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          questionId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
        }),
      });

      const presignedData = await presignedRes.json();
      if (!presignedRes.ok) {
        throw new Error(presignedData.error || "Impossible d'obtenir une URL signée");
      }

      const { uploadUrl, storageKey } = presignedData;

      // 3. Téléverser le fichier directement sur S3 via XHR (pour le suivi de la progression)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            setProgress(percentage);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201 || uploadUrl.includes("stub=true")) {
            resolve();
          } else {
            reject(new Error(`Le téléversement a échoué (Status: ${xhr.status})`));
          }
        };

        xhr.onerror = () => reject(new Error("Erreur réseau lors du téléversement"));
        xhr.send(file);
      });

      // 4. Confirmer le téléversement au serveur
      const confirmRes = await fetch(`${API_URL}/api/documents/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          questionId,
          storageKey,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) {
        throw new Error(confirmData.error || "Échec de confirmation");
      }

      // Recharger la liste locale des documents
      await loadAttachedDocuments();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-6 p-5 bg-white rounded-2xl border border-stone-250/70 shadow-sm text-left">
      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
        Pièce justificative (Optionnel)
      </h4>

      {/* Zone de glisser-déposer */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[120px] ${
          uploading
            ? "border-stone-200 bg-stone-50"
            : "border-stone-250 bg-stone-50/30 hover:bg-stone-50"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.heic"
        />

        {uploading ? (
          <div className="w-full max-w-[200px] text-center">
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-2">
              <div className="bg-[#CC1C29] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-semibold text-stone-500">Envoi en cours : {progress}%</span>
          </div>
        ) : (
          <>
            <span className="text-2xl mb-1">📎</span>
            <span className="text-sm font-semibold text-[#0A2E5C]">Déposez un document ou cliquez ici</span>
            <span className="text-xs text-stone-400 mt-1">Formats PDF, PNG, JPG, HEIC (max 15 Mo)</span>
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 p-2.5 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Liste des documents rattachés */}
      {documents.length > 0 && (
        <div className="mt-4 space-y-2">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Documents joints :
          </span>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <span className="text-base select-none">📄</span>
                <span className="font-medium text-stone-700 truncate">{doc.fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                    doc.virusScan === "CLEAN"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : doc.virusScan === "INFECTED"
                      ? "bg-rose-50 text-rose-700 border border-rose-100"
                      : "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse"
                  }`}
                >
                  {doc.virusScan === "PENDING" && "Analyse..."}
                  {doc.virusScan === "CLEAN" && "Sain"}
                  {doc.virusScan === "INFECTED" && "Rejeté (Infecté)"}
                  {doc.virusScan === "ERROR" && "Erreur scan"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
