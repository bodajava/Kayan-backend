import multer from "multer";
import { Request } from 'express';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { storageEnum, uploadEnum } from "../../enums/multer.enum.js";

export const cloudFileUpload = ({
  storageApproach = storageEnum.MEMORY,
  validation = [],
  maxSize = 2
}: {
  validation: string[];
  uploadApproach?: uploadEnum.LARGE;
  storageApproach?: storageEnum;
  maxSize?: number;
}) => {
  const storage = storageApproach === storageEnum.MEMORY 
    ? multer.memoryStorage() 
    : multer.diskStorage({
        destination(req: Request, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) {
          callback(null, tmpdir());
        },
        filename(req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) {
          callback(null, `${randomUUID()}______${file.originalname}`);
        }
      });

  const fileFilter = (validation: string[]) => {
    return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (validation.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type"));
      }
    };
  };

  return multer({ 
    fileFilter: fileFilter(validation), 
    storage, 
    limits: { fileSize: maxSize * 1024 * 1024 } 
  });
};
