// lib/providers/storage.provider.ts
// Interface StorageProvider — isoler OVHcloud Object Storage (S3-compatible HDS)
// Le changement de fournisseur ne touche qu'un adaptateur, jamais la logique métier

export interface UploadUrlRequest {
  key: string;           // clé S3 — ex. "files/{fileId}/documents/{docId}.pdf"
  contentType: string;   // MIME type — "application/pdf", "image/jpeg", etc.
  expiresInSeconds?: number; // durée de validité de l'URL signée (défaut : 300s)
}

export interface UploadUrlResult {
  uploadUrl: string;     // URL pré-signée PUT vers l'Object Storage
  storageKey: string;    // clé confirmée à stocker en base
}

export interface DownloadUrlRequest {
  key: string;
  expiresInSeconds?: number; // défaut : 300s — courte durée pour données de santé
}

export interface DownloadUrlResult {
  downloadUrl: string;
  expiresAt: Date;
}

export interface DeleteRequest {
  key: string;
}

/**
 * Interface abstraite — tous les adaptateurs de stockage l'implémentent.
 * Fournisseur actuel : OVHcloud Object Storage HDS (lib/providers/ovhcloud-storage.adapter.ts)
 * Les fichiers ne transitent JAMAIS par le serveur applicatif — upload direct via URL signée.
 */
export interface StorageProvider {
  /** Génère une URL pré-signée pour upload direct (PUT) depuis le client */
  getUploadUrl(request: UploadUrlRequest): Promise<UploadUrlResult>;

  /** Génère une URL pré-signée pour téléchargement (GET) à durée courte */
  getDownloadUrl(request: DownloadUrlRequest): Promise<DownloadUrlResult>;

  /** Supprime un objet (purge RGPD) */
  delete(request: DeleteRequest): Promise<void>;
}
