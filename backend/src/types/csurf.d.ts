declare module 'csurf' {
  import type { Request, RequestHandler } from 'express'
  import type { CookieOptions } from 'express-serve-static-core'

  interface CsrfCookieOptions extends CookieOptions {
    key?: string
  }

  interface CsurfOptions {
    value?: (req: Request) => string | string[] | undefined
    cookie?: boolean | CsrfCookieOptions
    ignoreMethods?: string[]
  }

  function csrf(options?: CsurfOptions): RequestHandler

  export = csrf
}
