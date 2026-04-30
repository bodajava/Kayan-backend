import z from "zod";
import { postSchema } from "./post.validation.js";

export type cretePostBodyDTO = z.infer<typeof postSchema.body>