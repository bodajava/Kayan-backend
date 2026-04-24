import {
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
  CompleteMultipartUploadCommandOutput,
  GetObjectCommandOutput,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput
} from "@aws-sdk/client-s3";

import { Upload } from "@aws-sdk/lib-storage";
import { randomUUID } from "node:crypto";
import { storageEnum, uploadEnum } from "../enums/multer.enum.js";
import { createReadStream } from "node:fs";
import { BadRequestException } from "../exception/domain.exception.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { configService } from "./config.service.js";

export class S3Service {
  private client: S3Client | null = null;

  constructor() {}

  private getClient(): S3Client {
    if (!this.client) {
      this.client = new S3Client({
        region: configService.get('S3_REGION'),
        credentials: {
          accessKeyId: configService.get('S3_ACCESS_KEY_ID'),
          secretAccessKey: configService.get('S3_SECRET_ACCESS_KEY')
        }
      });
    }

    return this.client;
  }

  async uploadFile({
    storageAprotch = storageEnum.MEMORY,
    Bucket = configService.get('S3_BUCKET_NAME'),
    path = "general",
    file,
    ACL = ObjectCannedACL.private,
    ContentType
  }: {
    storageAprotch?: storageEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${path}/${randomUUID()}_____${file.originalname}`,
      ACL,
      Body:
        storageAprotch === storageEnum.MEMORY
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype || ContentType
    });

    await this.getClient().send(command);

    if (!command.input.Key) {
      throw new BadRequestException("Failed to upload file");
    }

    return command.input.Key;
  }

  async uploadLargeFile({
    storageAprotch = storageEnum.DISK,
    Bucket = configService.get('S3_BUCKET_NAME'),
    path = "general",
    file,
    ACL = ObjectCannedACL.private,
    ContentType,
    partSize = 5
  }: {
    storageAprotch?: storageEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string;
    partSize?: number;
  }): Promise<CompleteMultipartUploadCommandOutput> {
    const uploadedFile = new Upload({
      client: this.getClient(),
      params: {
        Bucket,
        Key: `${path}/${randomUUID()}_____${file.originalname}`,
        ACL,
        Body:
          storageAprotch === storageEnum.MEMORY
            ? file.buffer
            : createReadStream(file.path),
        ContentType: file.mimetype || ContentType
      },
      partSize: partSize * 1024 * 1024
    });

    uploadedFile.on("httpUploadProgress", (progress) => {
      const percent =
        ((progress.loaded as number) / (progress.total as number)) * 100;
      console.log(`Upload Progress: ${percent.toFixed(2)}%`);
    });

    return await uploadedFile.done();
  }

  async uploadFiles({
    storageAprotch = storageEnum.MEMORY,
    uploadAprotch = uploadEnum.LARGE,
    Bucket = configService.get('S3_BUCKET_NAME'),
    path = "general",
    files,
    ACL = ObjectCannedACL.private
  }: {
    storageAprotch?: storageEnum;
    uploadAprotch?: uploadEnum;
    Bucket?: string;
    path?: string;
    files: Express.Multer.File[];
    ACL?: ObjectCannedACL;
  }): Promise<string[]> {
    if (!files || files.length === 0) return [];

    let urls: string[] = [];

    if (uploadAprotch === uploadEnum.LARGE) {
      const data = await Promise.all(
        files.map(file =>
          this.uploadLargeFile({
            storageAprotch,
            Bucket,
            path,
            file,
            ACL,
            ContentType: file.mimetype
          })
        )
      );
      urls = data.map(item => item.Key as string);
    } else {
      urls = await Promise.all(
        files.map(file =>
          this.uploadFile({
            storageAprotch,
            Bucket,
            path,
            file,
            ACL,
            ContentType: file.mimetype
          })
        )
      );
    }

    return urls;
  }

  async createPresignedUploadLink({
    Bucket = configService.get('S3_BUCKET_NAME'),
    path = "general",
    ContentType,
    originalname,
    expiresIn = configService.get('AWS_EXPIRES_IN')
  }: {
    Bucket?: string;
    path?: string;
    ContentType?: string;
    originalname: string | undefined;
    expiresIn?: number;
  }): Promise<{ url: string; Key: string }> {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${path}/${randomUUID()}_____${originalname}`,
      ContentType
    });

    if (!command.input.Key) {
      throw new BadRequestException("Failed to generate upload link");
    }

    const url = await getSignedUrl(this.getClient(), command, { expiresIn });

    return {
      url,
      Key: command.input.Key
    };
  }

  async createPresignedFetchLink({
    Bucket = configService.get('S3_BUCKET_NAME'),
    Key,
    download,
    fileName,
    expiresIn = configService.get('AWS_EXPIRES_IN')
  }: {
    Bucket?: string;
    Key: string;
    download?: string;
    fileName?: string;
    expiresIn?: number;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
      ResponseContentDisposition:
        download === "true"
          ? `attachment; filename="${fileName || Key.split("/").pop()}"`
          : undefined
    });

    return await getSignedUrl(this.getClient(), command, { expiresIn });
  }

  async getImage({
    Bucket = configService.get('S3_BUCKET_NAME'),
    Key
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<GetObjectCommandOutput> {
    return await this.getClient().send(
      new GetObjectCommand({
        Bucket,
        Key
      })
    );
  }

  async deleteImage({
    Bucket = configService.get('S3_BUCKET_NAME'),
    Key
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<DeleteObjectCommandOutput> {
    return await this.getClient().send(
      new DeleteObjectCommand({
        Bucket,
        Key
      })
    );
  }

  async deleteImages({
    Bucket = configService.get('S3_BUCKET_NAME'),
    Keys
  }: {
    Bucket?: string;
    Keys: { Key: string }[];
  }): Promise<DeleteObjectsCommandOutput> {
    return await this.getClient().send(
      new DeleteObjectsCommand({
        Bucket,
        Delete: {
          Objects: Keys,
          Quiet: false
        }
      })
    );
  }
}

export const s3Service = new S3Service();
