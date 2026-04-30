import { Types } from "mongoose";
import { validationGeneralFaild } from "../../common/validation/validation.faild.js";
import z from "zod";
import { fileFaildValifation } from "../../common/utils/multer/validation.multer.js";

export const postSchema = {
  body: z.strictObject({
    content: validationGeneralFaild.content,
    files: z.array(validationGeneralFaild.file(fileFaildValifation.image)).optional(),
    tags: validationGeneralFaild.tags,
    avalibality: validationGeneralFaild.avalibality
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

      // Check if each tag is a valid MongoDB ObjectId
      args.tags.forEach((tag, index) => {
        if (!Types.ObjectId.isValid(tag)) {
          ctx.addIssue({
            code: "custom",
            path: ["tags", index],
            message: `Invalid user ID format: ${tag}`
          });
        }
      });
    }
  })
};
