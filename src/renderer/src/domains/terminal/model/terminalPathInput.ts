export const quotePathForInput = (path: string): string => (path.includes(' ') ? `"${path}"` : path);
