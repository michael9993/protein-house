/**
 * Simple logger implementation for newsletter app
 * Uses console methods for logging
 */
interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const createLogger = (name: string): Logger => {
  const prefix = `[${name}]`;
  
  return {
    debug: (...args: unknown[]) => {
      if (process.env.NODE_ENV !== "production") {
        console.debug(prefix, ...args);
      }
    },
    info: (...args: unknown[]) => {
      console.info(prefix, ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn(prefix, ...args);
    },
    error: (...args: unknown[]) => {
      console.error(prefix, ...args);
    },
  };
};

export { createLogger };
