import { Router, Request, Response, NextFunction } from "express";
import { authentication } from "../../middleware/authentication.middleware.js";
import { asyncHandler } from "../../common/utils/async-handler.util.js";
import * as validators from "./comment.validation.js";
import { validation } from "../../middleware/validation.middleware.js";
import commentService from "./comment.service.js";
import { createCommentParamsDTO, createReplatCommentDTO } from "./comment.dto.js";
import { successResponse } from "../../common/res/success.response.js";
import { IComment } from "../../common/interface/comment.interface.js";
import { cloudFileUpload } from "../../common/utils/multer/cloud.multer.js";
import { fileFaildValifation } from "../../common/utils/multer/validation.multer.js";
import { storageEnum, uploadEnum } from "../../common/enums/multer.enum.js";



const commentRouter = Router({ mergeParams: true });


commentRouter.post('/crete-comment',
    authentication(),
    cloudFileUpload({
        validation: fileFaildValifation.image,
        storageApproach: storageEnum.MEMORY,
        uploadApproach: uploadEnum.LARGE,
    }).array("attaattachments", 2),
    validation(validators.commentSchema),
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const data = await commentService.createComment(req.params as createCommentParamsDTO, { ...req.body, files: req.files }, req.user)
        return successResponse<IComment>({ res, message: "Done", data, statusCode: 201 })
    }))


commentRouter.post('/:commentId/replay',
    authentication(),
    cloudFileUpload({
        validation: fileFaildValifation.image,
        storageApproach: storageEnum.MEMORY,
        uploadApproach: uploadEnum.LARGE,
    }).array("attaattachments", 2),
    validation(validators.replayCommentSchema),
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const data = await commentService.replayComment(req.params as createReplatCommentDTO, { ...req.body, files: req.files }, req.user)
        return successResponse<IComment>({ res, message: "Done", data, statusCode: 201 })
    }))

export default commentRouter;