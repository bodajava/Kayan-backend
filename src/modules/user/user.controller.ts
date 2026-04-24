import { Router, Request, Response } from "express";
import { successResponse } from "../../common/res/index.js";
import userService from "./user.service.js";
import { authentication, authorization } from "../../middleware/index.js";
import { endPoint } from "./user.authrization.js";
import { tokenTypeEnum } from "../../common/enums/token.enum.js";
import { logoutEnum } from "../../common/enums/user.enum.js";
import { BadRequestException } from "../../common/exception/domain.exception.js";
import { cloudFileUpload } from "../../common/utils/multer/cloud.multer.js";
import { fileFaildValifation } from "../../common/utils/multer/validation.multer.js";
import { storageEnum, uploadEnum } from "../../common/enums/multer.enum.js";
import { asyncHandler } from "../../common/utils/async-handler.util.js";

const userRouter = Router();

userRouter.get('/', authentication(), authorization(endPoint.profile), asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.profile((req as any).user);
  return successResponse({ res, data });
}));

userRouter.post('/logout', authentication(), asyncHandler(async (req: Request, res: Response) => {
  const flag = req.body?.flag !== undefined ? req.body.flag : req.body?.flage;

  if (flag !== logoutEnum.only && flag !== logoutEnum.all) {
    throw new BadRequestException(`Invalid logout flag. Use 0 (this device only) or 1 (all devices). Received: ${flag}`);
  }

  const status = await userService.logout(flag, (req as any).user, (req as any).decoded as { jti: string, iat: number, sub: string });
  return successResponse({ res, message: "You have been logged out successfully. See you soon!", data: { status } });
}));

userRouter.post('/refresh-token', authentication(tokenTypeEnum.Refresh), asyncHandler(async (req: Request, res: Response) => {
  const credentials = await userService.rotateToken((req as any).user, (req as any).decoded as { jti: string, iat: number, sub: string }, `${req.protocol}://${req.hostname}`);
  return successResponse({ res, message: "Session refreshed successfully.", data: { ...credentials }, statusCode: 200 });
}));

userRouter.patch('/profile-image', authentication(), asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.profileImgae(req.body, (req as any).user);
  return successResponse({ res, message: "Profile image uploaded successfully.", data: { user } });
}));

userRouter.patch('/profile-cover-image', authentication(), cloudFileUpload({
  validation: fileFaildValifation.image, storageApproach: storageEnum.DISK, uploadApproach: uploadEnum.LARGE
}).array('image', 2), asyncHandler(async (req: Request, res: Response) => {
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    throw new BadRequestException("No files uploaded.");
  }
  const user = await userService.profileCoverImages(req.files as Express.Multer.File[], (req as any).user);
  return successResponse({ res, message: "Profile cover images uploaded successfully.", data: { user } });
}));

export default userRouter;