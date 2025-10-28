import { Router } from 'express';

import { config } from '../env';

export const runtimeConfigRouter = Router();

runtimeConfigRouter.get('/', (_req, res) => {
  const apiBaseUrl =
    config.publicApiBaseUrl ??
    (config.sessionCookie.domain ? `https://${config.sessionCookie.domain}` : null);

  res.json({
    apiBaseUrl,
    features: {
      ai: config.features.enableAi,
      search: config.features.enableSearchProxy,
      allowShellScripts: config.features.allowShellScripts,
    },
    csrf: {
      headerName: config.csrf.headerNameOriginal,
      cookieName: config.csrf.cookieName,
    },
  });
});
