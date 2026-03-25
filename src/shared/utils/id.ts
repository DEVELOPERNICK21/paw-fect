export const createLocalId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${timestamp}-${random}`;
};

