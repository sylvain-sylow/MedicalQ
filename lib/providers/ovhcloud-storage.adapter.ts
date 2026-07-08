// lib/providers/ovhcloud-storage.adapter.ts
// Adaptateur Object Storage OVHcloud (S3-compatible, périmètre HDS)
// Variables d'env : S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY

import type {
  StorageProvider,
  UploadUrlRequest,
  UploadUrlResult,
  DownloadUrlRequest,
  DownloadUrlResult,
  DeleteRequest,
} from "./storage.provider";

// TODO J4-stub : à remplacer par l'appel réel au SDK AWS S3 (@aws-sdk/client-s3 + @aws-sdk/s3-request-presigner)
// OVHcloud Object Storage est compatible S3 — même API, endpoint différent

export class OvhcloudStorageAdapter implements StorageProvider {
  private readonly endpoint: string;
  private readonly region: string;
  private readonly bucket: string;
  private readonly accessKey: string;
  private readonly secretKey: string;

  constructor() {
    this.endpoint  = process.env.S3_ENDPOINT  ?? "";
    this.region    = process.env.S3_REGION    ?? "gra";
    this.bucket    = process.env.S3_BUCKET    ?? "medical-sylow-docs";
    this.accessKey = process.env.S3_ACCESS_KEY ?? "";
    this.secretKey = process.env.S3_SECRET_KEY ?? "";
  }

  async getUploadUrl(request: UploadUrlRequest): Promise<UploadUrlResult> {
    const expiresIn = request.expiresInSeconds ?? 300;
    // STUB — à remplacer par :
    // const client = new S3Client({ endpoint: this.endpoint, region: this.region, credentials: { ... } });
    // const command = new PutObjectCommand({ Bucket: this.bucket, Key: request.key, ContentType: request.contentType });
    // const uploadUrl = await getSignedUrl(client, command, { expiresIn });
    console.log(`[OvhcloudStorageAdapter] STUB getUploadUrl — key: ${request.key}, expires: ${expiresIn}s`);
    return {
      uploadUrl: `https://stub-storage.example.com/${this.bucket}/${request.key}?stub=true`,
      storageKey: request.key,
    };
  }

  async getDownloadUrl(request: DownloadUrlRequest): Promise<DownloadUrlResult> {
    const expiresIn = request.expiresInSeconds ?? 300;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    // STUB — à remplacer par getSignedUrl avec GetObjectCommand
    console.log(`[OvhcloudStorageAdapter] STUB getDownloadUrl — key: ${request.key}`);
    return {
      downloadUrl: `https://stub-storage.example.com/${this.bucket}/${request.key}?stub=true`,
      expiresAt,
    };
  }

  async delete(request: DeleteRequest): Promise<void> {
    // STUB — à remplacer par DeleteObjectCommand
    console.log(`[OvhcloudStorageAdapter] STUB delete — key: ${request.key}`);
  }
}
