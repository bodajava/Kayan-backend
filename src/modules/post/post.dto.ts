import z from "zod";
import { postSchema, reactPostSchema, updatePost } from "./post.validation.js";

export type cretePostBodyDTO = z.infer<typeof postSchema.body>
export type reactPostQueryDTO = z.infer<typeof reactPostSchema.query>
export type reactPostParamsDTO = z.infer<typeof reactPostSchema.params>

export type UpdatePostQueryDTO = z.infer<typeof updatePost.body>
export type UpdatePostParamsDTO = z.infer<typeof updatePost.params>
