import { Router, Request, Response } from 'express';
import { requestOneMapToken, getActiveOneMapToken, setCustomCachedToken } from '../services/onemapService.js';

const authRouter = Router();

// GET /api/auth/token - Check token configuration status
authRouter.get('/token', async (req: Request, res: Response) => {
  const customHeaderToken = req.headers['x-onemap-token'] as string | undefined;
  const token = await getActiveOneMapToken(customHeaderToken);

  let source = 'none';
  if (customHeaderToken) source = 'client_header';
  else if (process.env.ONEMAP_API_TOKEN) source = 'env_static_token';
  else if (process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD) source = 'env_credentials_auto';
  else if (token) source = 'active_cache';

  res.json({
    hasToken: Boolean(token),
    source,
    preview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 6)}` : null
  });
});

// POST /api/auth/token - Request token from OneMap using credentials
authRouter.post('/token', async (req: Request, res: Response) => {
  const { email, password, token } = req.body;

  // If client passes a pre-generated token to store in session
  if (token && typeof token === 'string' && token.trim()) {
    setCustomCachedToken(token.trim());
    return res.json({
      ok: true,
      message: 'Token configured successfully',
      source: 'manual_token'
    });
  }

  const effectiveEmail = (email || process.env.ONEMAP_EMAIL || '').trim();
  const effectivePassword = (password || process.env.ONEMAP_PASSWORD || '').trim();

  if (!effectiveEmail || !effectivePassword) {
    return res.status(400).json({
      ok: false,
      error: 'Email and password are required to request a token from https://www.onemap.gov.sg/api/auth/post/getToken'
    });
  }

  try {
    const result = await requestOneMapToken(effectiveEmail, effectivePassword);
    setCustomCachedToken(result.access_token);

    res.json({
      ok: true,
      message: 'Successfully authenticated with OneMap',
      access_token: result.access_token,
      expiry_timestamp: result.expiry_timestamp
    });
  } catch (err: any) {
    res.status(401).json({
      ok: false,
      error: err.message
    });
  }
});

export default authRouter;
