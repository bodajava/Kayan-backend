import { Router, Request, Response, NextFunction } from "express";
import { authentication } from "../../middleware/authentication.middleware.js";
import { successResponse } from "../../common/res/success.response.js";
import { asyncHandler } from "../../common/utils/async-handler.util.js";
import { cloudFileUpload } from "../../common/utils/multer/cloud.multer.js";
import { fileFaildValifation } from "../../common/utils/multer/validation.multer.js";
import { storageEnum, uploadEnum } from "../../common/enums/multer.enum.js";
import { BadRequestException } from "../../common/exception/domain.exception.js";
import * as validators from "./post.validation.js";
import { validation } from "../../middleware/validation.middleware.js";
import postService from "./post.service.js";

const postRouter = Router();

postRouter.post(
  "/",
  authentication(),
  cloudFileUpload({
    validation: fileFaildValifation.image,
    storageApproach: storageEnum.MEMORY,
    uploadApproach: uploadEnum.LARGE,
  }).array("image", 2),
  validation(validators.postSchema),
  asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      throw new BadRequestException("No files uploaded.");
    }
    const data = await postService.createPost({...req.body , files : req.files} , req.user)
    return successResponse({ res, message: "Done" , data, });
  })
);

export default postRouter;