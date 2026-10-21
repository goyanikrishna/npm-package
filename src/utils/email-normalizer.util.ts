// Email normalization utility

export const normalizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};
