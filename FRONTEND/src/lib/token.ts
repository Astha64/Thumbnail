const TOKEN_KEY = 'thumbnail_token';

/**
 * Utility helper for managing the JWT token in browser localStorage.
 */
export const tokenStorage = {
  get: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
  exists: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
