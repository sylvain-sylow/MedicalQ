// app/api/documents/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAssuredSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { scanFile } from "@/lib/services/clamav";
import { OvhcloudStorageAdapter } from "@/lib/providers/ovhcloud-storage.adapter";

const confirmSchema = z.object({
  fileId: z.string(),
  questionId: z.string().optional(),
  storageKey: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().max(15 * 1024 * 1024, "La taille du fichier ne doit pas dépasser 15 Mo."),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getAssuredSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { fileId, questionId, storageKey, fileName, mimeType, sizeBytes } = parsed.data;

    // 1. Vérifier que le dossier appartient bien à l'assuré
    const file = await prisma.healthFile.findFirst({
      where: { id: fileId, insuredId: session.insuredId },
    });

    if (!file) {
      return NextResponse.json({ error: "Dossier non autorisé" }, { status: 404 });
    }

    // 2. Enregistrer le document en statut "PENDING"
    const doc = await prisma.document.create({
      data: {
        fileId,
        questionId: questionId ?? null,
        storageKey,
        fileName,
        mimeType,
        sizeBytes,
        virusScan: "PENDING",
      },
    });

    // 3. Déclencher le scan antivirus ClamAV de manière asynchrone (sans await)
    // Nous simulons un traitement asynchrone en arrière-plan
    (async () => {
      try {
        console.log(`[Antivirus] Démarrage du scan pour le document ${doc.id} : ${fileName}`);
        
        // Simuler ou effectuer la lecture du fichier pour inspecter son contenu si nécessaire
        // Ici, on passe simplement le nom de fichier. Le service détecte aussi la signature EICAR
        const scanResult = await scanFile(fileName);
        
        console.log(`[Antivirus] Résultat du scan pour ${doc.id} : ${scanResult}`);

        if (scanResult === "INFECTED") {
          // Si le fichier est infecté, on le supprime de l'Object Storage
          const storage = new OvhcloudStorageAdapter();
          await storage.delete({ key: storageKey });

          // Mettre à jour en base avec le statut INFECTED
          await prisma.document.update({
            where: { id: doc.id },
            data: { virusScan: "INFECTED" },
          });
          console.warn(`[Antivirus] FICHIER INFECTÉ SUPPRIMÉ : ${fileName} (${doc.id})`);
        } else {
          // Mettre à jour en base avec le statut CLEAN
          await prisma.document.update({
            where: { id: doc.id },
            data: { virusScan: "CLEAN" },
          });
        }
      } catch (scanErr) {
        console.error(`[Antivirus] Erreur lors du scan pour le document ${doc.id}`, scanErr);
        await prisma.document.update({
          where: { id: doc.id },
          data: { virusScan: "ERROR" },
        });
      }
    })();

    // Répondre immédiatement au client que le document a été enregistré et est en cours d'analyse
    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        fileName: doc.fileName,
        virusScan: "PENDING",
      },
    });
  } catch (err) {
    console.error("[POST /api/documents/confirm]", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
