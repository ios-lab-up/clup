import "server-only";
import {
  S3Client,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageAdapter, StoredObjectMetadata, UploadPolicy } from "@/lib/storage/storage-adapter";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

const UPLOAD_POLICY_TTL_SECONDS = 300;

export class R2StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = requiredEnv("R2_BUCKET");
    this.client = new S3Client({
      region: "auto",
      endpoint: requiredEnv("R2_ENDPOINT"),
      // R2 firma correctamente las URLs presignadas en estilo path
      // (endpoint/bucket/key); el virtual-hosted (bucket.endpoint) provoca 403.
      forcePathStyle: true,
      credentials: {
        accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }

  async createUploadPolicy(
    key: string,
    contentType: string,
    // El tamaño no se restringe en la URL presignada PUT (R2 no lo soporta como
    // POST policy); se valida server-side con headObject antes de persistir.
    _maxSizeBytes: number,
  ): Promise<UploadPolicy> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: UPLOAD_POLICY_TTL_SECONDS });

    return { url, headers: { "Content-Type": contentType }, key };
  }

  async getDownloadUrl(key: string, expiresInSeconds = 60): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async headObject(key: string): Promise<StoredObjectMetadata | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return { size: result.ContentLength ?? 0, contentType: result.ContentType ?? "" };
    } catch {
      return null;
    }
  }

  async getObjectBuffer(key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!result.Body) return null;
      const bytes = await result.Body.transformToByteArray();
      return { body: bytes, contentType: result.ContentType ?? "application/octet-stream" };
    } catch {
      return null;
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
