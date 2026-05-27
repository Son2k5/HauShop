export const logger = {
  error(message: string, error?: unknown) {
    if (import.meta.env.DEV) {
      globalThis["console"].error(message, error);
    }
  },
};
