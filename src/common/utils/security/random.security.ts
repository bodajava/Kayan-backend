import crypto from 'crypto';

/**
 * Generates a random numeric code (e.g., OTP for email confirmation)
 * @param length Default length is 4 digits.
 */
export const generateRandomCode = ({ length = 4 }: { length?: number } = {}): string => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max + 1).toString();
};

/**
 * Generates a random alphanumeric string (e.g., API keys, state tokens)
 * @param length Default length is 10 characters.
 */
export const generateRandomString = ({ length = 10 }: { length?: number } = {}): string => {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};
