// lib/audit.ts
// Helper centralisé pour journaliser les accès praticien
// Spec § 9 — "chaque lecture d'un dossier par un praticien est tracée"

import { prisma } from "./db/prisma";
import { Prisma } from "@prisma/client";

export interface AuditParams {
  praticienId: string;
  action: string;
  fileId?: string;
  meta?: Record<string, unknown>;
}

/**
 * Journalise une action praticien dans AuditLog.
 * Ne lève jamais d'exception (log best-effort).
 */
export async function logPraticienAccess(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        praticienId: params.praticienId,
        fileId: params.fileId ?? null,
        actor: params.praticienId,
        action: params.action,
        meta: params.meta ? (params.meta as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch (err) {
    // Best-effort — ne pas bloquer la réponse si l'audit échoue
    console.error("[AuditLog] Échec journalisation:", err);
  }
}
