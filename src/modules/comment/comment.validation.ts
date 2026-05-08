import { validationGeneralFaild } from "../../common/validation/validation.faild.js";
import z from "zod";
import { fileFaildValifation } from "../../common/utils/multer/validation.multer.js";



export const commentSchema = {
  params: z.strictObject({
    postId: validationGeneralFaild.id
  }),
  body: z.strictObject({
    content: validationGeneralFaild.content,
    files: z.array(validationGeneralFaild.file(fileFaildValifation.image)).optional(),
    tags: validationGeneralFaild.tags,
  }).superRefine((args, ctx) => {
    // 1. Ensure either content or files are provided
    if (!args.files?.length && !args.content) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Content is required when no files are uploaded"
      });
    }

    // 2. Validate Tags
    if (args.tags && args.tags.length > 0) {
      // Check for duplicates
      const uniqueTags = new Set(args.tags);
      if (uniqueTags.size !== args.tags.length) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "Duplicate tags are not allowed"
        });
      }
    }
  })
};


export const replayCommentSchema = {
  params: z.strictObject({
    postId: validationGeneralFaild.id,
    commentId: validationGeneralFaild.id
  }),
  body: commentSchema.body
};


