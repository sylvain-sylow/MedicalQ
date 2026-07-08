// lib/providers/ovhcloud-storage.adapter.ts
// Adaptateur Object Storage OVHcloud (S3-compatible, périmètre HDS)
// Variables d'env : S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  StorageProvider,
  UploadUrlRequest,
  UploadUrlResult,
  DownloadUrlRequest,
  DownloadUrlResult,
  DeleteRequest,
} from "./storage.provider";

export class OvhcloudStorageAdapter implements StorageProvider {
  private readonly endpoint: string;
  private readonly region: string;
  private readonly bucket: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private client: S3Client | null = null;

  constructor() {
    this.endpoint  = process.env.S3_ENDPOINT  ?? "";
    this.region    = process.env.S3_REGION    ?? "gra";
    this.bucket    = process.env.S3_BUCKET    ?? "medical-sylow-docs";
    this.accessKey = process.env.S3_ACCESS_KEY ?? "";
    this.secretKey = process.env.S3_SECRET_KEY ?? "";

    // N'instancier le client S3 que si les clés sont fournies
    if (this.accessKey && this.secretKey && this.endpoint) {
      this.client = new S3Client({
        endpoint: this.endpoint,
        region: this.region,
        credentials: {
          accessKeyId: this.accessKey,
          secretAccessKey: this.secretKey,
        },
        forcePathStyle: true, // Requis pour la compatibilité OVH Object Storage
      });
    }
  }

  async getUploadUrl(request: UploadUrlRequest): Promise<UploadUrlResult> {
    const expiresIn = request.expiresInSeconds ?? 300;

    // Fallback Mock en développement si les identifiants S3 ne sont pas configurés
    if (!this.client) {
      console.warn("[OvhcloudStorageAdapter] S3 non configuré. Utilisation d'un mock d'upload.");
      return {
        uploadUrl: `https://stub-storage.example.com/${this.bucket}/${request.key}?stub=true&contentType=${encodeURIComponent(request.contentType)}`,
        storageKey: request.key,
      };
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: request.key,
        ContentType: request.contentType,
      });

      const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
      return {
        uploadUrl,
        storageKey: request.key,
      };
    } catch (err) {
      console.error("[OvhcloudStorageAdapter] Erreur lors de la génération de l'URL d'upload", err);
      throw new Error("Impossible de générer l'URL de téléversement sécurisée");
    }
  }

  async getDownloadUrl(request: DownloadUrlRequest): Promise<DownloadUrlResult> {
    const expiresIn = request.expiresInSeconds ?? 300;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    if (!this.client) {
      console.warn("[OvhcloudStorageAdapter] S3 non configuré. Utilisation d'un mock de téléchargement.");
      return {
        downloadUrl: `https://stub-storage.example.com/${this.bucket}/${request.key}?stub=true`,
        expiresAt,
      };
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: request.key,
      });

      const downloadUrl = await getSignedUrl(this.client, command, { expiresIn });
      return {
        downloadUrl,
        expiresAt,
      };
    } catch (err) {
      console.error("[OvhcloudStorageAdapter] Erreur lors de la génération de l'URL de téléchargement", err);
      throw new Error("Impossible de générer l'URL de téléchargement sécurisée");
    }
  }

  async delete(request: DeleteRequest): Promise<void> {
    if (!this.client) {
      console.warn("[OvhcloudStorageAdapter] S3 non configuré. Ignorer la suppression.");
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: request.key,
      });
      await this.client.send(command);
    } catch (err) {
      console.error("[OvhcloudStorageAdapter] Erreur lors de la suppression de l'objet", err);
      throw new Error("Impossible de supprimer le document sécurisé");
    }
  }
}
