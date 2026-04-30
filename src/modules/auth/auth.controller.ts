import { Request, Response, Router } from "express";
import { successResponse } from '../../common/res/index.js';
import authService from "./auth.service.js";
import { validation } from "../../middleware/index.js";
import { signupSchema, confirmEmail, reSendConfifrmEmailDto, loginSchema } from "./auth.validation.js";
import { asyncHandler } from "../../common/utils/async-handler.util.js";

const authRouter = Router();

authRouter.post("/signup", validation(signupSchema), asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.signup(req.body);
  return successResponse({
    res,
    message: "Signed up successfully! 🚀",
    data,
  });
}));

authRouter.post("/login", validation(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.login(req.body, `${req.protocol}://${req.hostname}`);
  return successResponse({
    res,
    message: "Login successfully 👍",
    data,
  });
}));

authRouter.patch("/confirm-email-otp", validation(confirmEmail), asyncHandler(async (req: Request, res: Response) => {
  const account = await authService.confirmEmail(req.body);
  return successResponse({
    res,
    message: "Confirm email successfully ✌️",
    data: account,
  });
}));

authRouter.patch("/resend-code-confirm-email", validation(reSendConfifrmEmailDto), asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.resendConfirmEmail(req.body);
  return successResponse({
    res,
    message: data.message,
    data,
  });
}));

authRouter.post('/signup/gmail', asyncHandler(async (req: Request, res: Response) => {
  const { user, statusCode, message } = await authService.signupWithGmail(req.body, `${req.protocol}://${req.hostname}`);
  return successResponse({ res, message, statusCode, data: { ...user } });
}));

authRouter.post('/login/gmail', asyncHandler(async (req: Request, res: Response) => {
  const { user, statusCode = 200 } = await authService.loginWithGmail(req.body, `${req.protocol}://${req.hostname}`);
  return successResponse({ res, message: "Login successful.", statusCode, data: { ...user } });
}));

authRouter.post('/gmail', asyncHandler(async (req: Request, res: Response) => {
  const { credentials, isNew } = await authService.googleSiginupAndLogin(req.body, `${req.protocol}://${req.hostname}`);
  return successResponse({ res, message: "Login successful.", statusCode: isNew ? 201 : 200, data: { ...credentials } });
}));

export default authRouter;