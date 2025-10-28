import type { Session } from '../auth/session';

declare module 'express-serve-static-core' {
  interface Request {
    userSession?: Session | null;
    csrfToken?: () => string;
  }
}

export {};

