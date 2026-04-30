import z from "zod";
import { loginSchema } from "../auth/auth.validation.js";

export type LoginDto = z.infer<typeof loginSchema.body>;

export type loginDTO = LoginDto;
