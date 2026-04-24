import z from "zod";
import { confirmEmail, loginSchema, signupSchema, reSendConfifrmEmailDto } from "./auth.validation.js";

export type LoginDto = z.infer<typeof loginSchema.body>;
export type SignupDto = z.infer<typeof signupSchema.body>;
export type confirmEmailDto = z.infer<typeof confirmEmail.body>;
export type ResendConfirmEmailDto = z.infer<typeof reSendConfifrmEmailDto.body>;

// Aliases for compatibility during transition
export type loginDTO = LoginDto;
export type SignupDTO = SignupDto;
export type confirmEmailDTO = confirmEmailDto;
export type SignupnDto = SignupDto; // Preserving user's typo alias just in case it's used elsewhere