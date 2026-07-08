// app/api/documents/presigned-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAssuredSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { OvhcloudStorageAdapter } from "@/lib/providers/ovhcloud-storage.adapter";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/heic",
];

const requestSchema = z.object({
  fileId: z.string(),
  questionId: z.string().optional(),
  fileName: z.string(),
  mimeType: z.string().refine((val) => ALLOWED_MIME_TYPES.includes(val), {
    message: "Format de fichier non supporté. Seuls les PDF, PNG, JPG et HEIC sont autorisés.",
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getAssuredSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { fileId, questionId, fileName, mimeType } = parsed.data;

    // 1. Vérifier que le dossier appartient bien à l'assuré connecté
    const file = await prisma.healthFile.findFirst({
      where: { id: fileId, insuredId: session.insuredId },
    });

    if (!file) {
      return NextResponse.json({ error: "Dossier introuvable ou non autorisé" }, { status: 404 });
    }

    // 2. Vérifier la limite de 10 documents par dossier
    const documentCount = await prisma.document.count({
      where: { fileId },
    });

    if (documentCount >= 10) {
      return NextResponse.json(
        { error: "Limite de 10 documents par dossier atteinte." },
        { status: 400 }
      );
    }

    // 3. Générer la clé de stockage unique
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storageKey = `files/${fileId}/documents/${uniqueId}_${sanitizedName}`;

    // 4. Générer l'URL signée PUT via l'adaptateur
    const storage = new OvhcloudStorageAdapter();
    const uploadResult = await storage.getUploadUrl({
      key: storageKey,
      contentType: mimeType,
      expiresInSeconds: 300, // Valide 5 minutes
    });

    return NextResponse.json({
      uploadUrl: uploadResult.uploadUrl,
      storageKey: uploadResult.storageKey,
      documentId: uniqueId,
    });
  } catch (err) {
    console.error("[POST /api/documents/presigned-url]", err);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
