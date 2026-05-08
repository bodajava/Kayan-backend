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
import { PaginatDTO, paginationValidationSchema } from "../../common/validation/validation.faild.js";
import { reactPostParamsDTO, reactPostQueryDTO, UpdatePostParamsDTO, UpdatePostQueryDTO } from "./post.dto.js";
import commentRouter from "../comment/comment.controller.js";


const postRouter = Router();
postRouter.use('/:postId/comment', commentRouter)

postRouter.patch(
  "/:postId/react",
  authentication(), validation(validators.reactPostSchema),
  asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const data = await postService.reactPost(req.params as reactPostParamsDTO, req.query as unknown as reactPostQueryDTO, req.user)
    return successResponse({ res, message: "Done", data, });
  })
);

postRouter.patch(
  "/:postId",
  authentication(),
  cloudFileUpload({
    validation: fileFaildValifation.image,
    storageApproach: storageEnum.MEMORY,
    uploadApproach: uploadEnum.LARGE,
  }).array("attachments", 2),
  validation(validators.updatePost),
  asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const data = await postService.updatePosts(req.params as UpdatePostParamsDTO, { ...req.body, files: req.files } as UpdatePostQueryDTO, req.user)
    return successResponse({ res, message: "Done", data, });
  })
);

postRouter.get(
  "/all-posts",
  authentication(), validation(paginationValidationSchema),
  asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const data = await postService.postList(req.query as PaginatDTO, req.user)
    return successResponse({ res, message: "Done", data, });
  })
);

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
    const data = await postService.createPost({ ...req.body, files: req.files }, req.user)
    return successResponse({ res, message: "Done", data, });
  })
);

export default postRouter;