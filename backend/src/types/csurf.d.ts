import type { CookieOptions, Request, RequestHandler } from 'express';

declare module 'csurf' {
  interface CsurfCookieOptions extends CookieOptions {
    key?: string;
  }

  interface CsurfOptions {
    value?: (req: Request) => string;
    cookie?: boolean | CsurfCookieOptions;
    ignoreMethods?: string[];
  }

  function csrf(options?: CsurfOptions): RequestHandler;

  export = csrf;
}
