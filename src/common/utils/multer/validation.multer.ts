import { FileFilterCallback } from "multer";
import { Request } from "express";
import { BadRequestException } from "../../exception/domain.exception.js";

export const fileFaildValifation = {
    image: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
    document: ['application/pdf', 'application/msword'],
    video: ['video/mp4']
  }
  export const validationFileFilter = (validation : string[]) => {
    return function (req:Request, file:Express.Multer.File, cb:FileFilterCallback) {
  
      if (!file) {
        return cb(new BadRequestException("no file uploaded" ));
      }
  
      if (validation.length && !validation.includes(file.mimetype)) {
        return cb(
          new BadRequestException("invalid file format please try again 🐸")
        );
      }
  
      return cb(null, true);
    };
  };
  