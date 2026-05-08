import z from "zod";
import { commentSchema, replayCommentSchema } from "./comment.validation.js";

export type createCommentDTO = z.infer<typeof commentSchema>
export type createCommentBodyDTO = z.infer<typeof commentSchema.body>
export type createCommentParamsDTO = z.infer<typeof commentSchema.params>

export type createReplatCommentDTO = z.infer<typeof replayCommentSchema.params>