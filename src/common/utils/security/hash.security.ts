import { compare, hash } from 'bcrypt';
import { configService } from '../../services/config.service.js';

export const generateHash = async ({
  plainText,
  saltRounds = configService.get('SALT_ROUND'),
}: {
  plainText: string;
  saltRounds?: number;
}): Promise<string> => {
  return await hash(plainText, saltRounds);
};

export const compareHash = async ({
  plainText,
  cipherText,
}: {
  plainText: string;
  cipherText: string;
}): Promise<boolean> => {
  return await compare(plainText, cipherText);
};