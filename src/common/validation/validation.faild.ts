import z from "zod";
import { GenderEnum, ProviderEnum, RoleEnum } from "../enums/user.enum.js";
import { AvalibilityEnum } from "../enums/post.enum.js";

/**
 * Common validation fields reused across the application.
 * Note: Named with 'faild' to match the user's requested import path.
 */
export const validationGeneralFaild = {
    userName: z.string()
        .min(2, "User name must be at least 2 characters")
        .max(50, "User name must not exceed 50 characters")
        .regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, "User name must contain only letters and spaces")
        .refine(val => val.trim().split(/\s+/).length >= 2, {
            message: "User name must include both first and last name separated by a space"
        }),
    email: z.string()
        .email("Invalid email format")
        .trim()
        .toLowerCase(),
    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    phone: z.string().regex(/^\+?[0-9]{7,15}$/, "Invalid phone number").optional(),
    profilePicture: z.string().url("Invalid image URL").optional(),
    profileCoverPictures: z.array(z.string().url("Invalid image URL")).optional(),
    gender: z.nativeEnum(GenderEnum).optional(),
    role: z.nativeEnum(RoleEnum).optional(),
    provider: z.nativeEnum(ProviderEnum).optional(),
    DOB: z.coerce.date().optional(),
    otp: z.number(),

    content: z.string().optional(),
    tags: z.array(z.string()).optional(),
    avalibality: z.coerce.number().default(AvalibilityEnum.PUBLIC),

    file: function (mimetype: string[]) {
        return z.strictObject({
            fieldname: z.string(),
            originalname: z.string(),
            encoding: z.string(),
            mimetype: z.enum(mimetype),
            destination: z.string(),
            filename: z.string(),
            path: z.string().optional(),
            buffer: z.any().optional(),
            size: z.number(),
        }).superRefine((args , ctx)=>{
            if(!args.path && !args.buffer){
                ctx.addIssue({
                    path:['buffer'],
                    code : "custom",
                    message: "buffer is reqiered "
                })
            }
        })
    }


};