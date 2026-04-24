export class ApplicationException extends Error {
    constructor(message: string, public statusCode: number, cause?: unknown) {
        super(message, { cause });
    }
}
