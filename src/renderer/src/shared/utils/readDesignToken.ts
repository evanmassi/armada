export const readDesignToken = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
