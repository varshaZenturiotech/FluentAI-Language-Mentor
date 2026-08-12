import crypto from 'crypto';

export const generateRandomToken = (bytes: number = 64): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateVerificationToken = (): { rawToken: string; hashedToken: string } => {
  const rawToken = generateRandomToken(64);
  const hashedToken = hashToken(rawToken);
  return { rawToken, hashedToken };
};

export const generatePasswordResetToken = (): { rawToken: string; hashedToken: string } => {
  const rawToken = generateRandomToken(64);
  const hashedToken = hashToken(rawToken);
  return { rawToken, hashedToken };
};
