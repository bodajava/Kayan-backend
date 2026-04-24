import { type Response } from 'express';

interface ISuccessResponse<T> {
    res: Response;
    message?: string;
    statusCode?: number;
    data?: T;
}

export const successResponse = <T>({ res, message = "Done", statusCode = 200, data }: ISuccessResponse<T>) => {
    return res.status(statusCode).json({
        success: true,
        message,
        statusCode,
        data
    });
};
