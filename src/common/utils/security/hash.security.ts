import { compare, hash } from 'bcrypt';

export const generateHash = async ({
  plainText,
  saltRounds = Number(process.env.SALT_ROUND) || 10,
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