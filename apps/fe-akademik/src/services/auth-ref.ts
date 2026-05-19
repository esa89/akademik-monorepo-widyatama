/**
 * Mutable reference bridge between React auth context and non-React code (axios).
 * The value is populated by AuthSync component on mount.
 */
export const authRef = {
  getAccessToken: (): string | null => null,
  logout: async (): Promise<void> => {},
};
