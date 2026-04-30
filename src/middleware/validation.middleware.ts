import { type Request, type Response, type NextFunction } from "express";
import { BadRequestException } from "../common/exception/domain.exception.js";
import { type ZodType } from "zod";

type ValidationKey = "body" | "query" | "params" | "headers" | "cookies";

type ValidationSchema = Partial<Record<ValidationKey, ZodType>>;

interface ValidationError {
    key: ValidationKey;
    issues: Array<{
        message: string;
        path: Array<string | number | undefined | symbol>;
    }>;
}

/**
 * Validation middleware to parse and validate request parts using Zod schemas.
 * @param schema - Object whose keys match request parts (body, query, etc.)
 */
export const validation = (schema: ValidationSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validationErrors: ValidationError[] = [];

        for (const key of Object.keys(schema) as ValidationKey[]) {
            const currentSchema = schema[key];
            if (!currentSchema) continue;

            const validationResult = currentSchema.safeParse(req[key]);

            if (!validationResult.success) {
                validationErrors.push({
                    key,
                    issues: validationResult.error.issues.map((issue) => ({
                        message: issue.message,
                        path: issue.path,
                    })),
                });
            }

            if(req.file){
                console.log(req.file);

                req.body.file = req.file
            }

            if(req.files){
                console.log(req.files);
                
            }
        }

        if (validationErrors.length > 0) {
            throw new BadRequestException("Validation failed", validationErrors);
        }

        return next();
    };
};
