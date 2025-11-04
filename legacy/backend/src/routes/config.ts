import { Router } from 'express';

import { config } from '../env';

export const configRouter = Router();

configRouter.get('/', (req, res) => {
  const forwardedProto = req.get('x-forwarded-proto');
  const forwardedHost = req.get('x-forwarded-host');
  const host = forwardedHost ?? req.get('host');
  const protocol = forwardedProto ?? req.protocol;

  const derivedBaseUrl = host ? `${protocol}://${host}` : null;
  const apiBaseUrl = (config.publicApiBaseUrl ?? derivedBaseUrl) ?? null;

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.json({
    apiBaseUrl,
    csrfHeader: config.csrf.headerName,
    features: {
      ai: config.features.ai,
      searchProxy: config.features.searchProxy,
      allowShellScripts: config.features.allowShellScripts,
    },
  });
});
