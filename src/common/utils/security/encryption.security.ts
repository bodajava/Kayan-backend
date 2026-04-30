import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default_secret_key', 'salt', 32);

export const generateEncrypt = ({ value }: { value: string }): string => {
  if (!value) return value;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

export const generateDecrypt = ({ encryptedValue }: { encryptedValue: string }): string => {
  if (!encryptedValue || !encryptedValue.includes(':')) return encryptedValue;
  const parts = encryptedValue.split(':');
  const ivHex = parts[0] as string;
  const encryptedText = parts[1] as string;
  const ivBuffer = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
  let decrypted: string = decipher.update(encryptedText as string, 'hex', 'utf8') as unknown as string;
  decrypted += decipher.final('utf8');
  return decrypted;
};
