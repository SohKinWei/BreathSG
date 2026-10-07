import { Router, Request, Response } from 'express';

const psiRouter = Router();

// In-memory cache for PSI
let cachedPSIData: any = null;
let lastPSIFetchTime = 0;
const PSI_CACHE_TTL = 60 * 1000; // 60 seconds

psiRouter.get('/', async (_req: Request, res: Response) => {
  const now = Date.now();
  if (cachedPSIData && now - lastPSIFetchTime < PSI_CACHE_TTL) {
    return res.json({ ok: true, source: 'cache', data: cachedPSIData });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch('https://api-open.data.gov.sg/v2/real-time/api/psi', {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Data.gov.sg PSI responded with status ${response.status}`);
    }

    const payload = await response.json();
    cachedPSIData = payload;
    lastPSIFetchTime = now;

    res.json({ ok: true, source: 'live', data: payload });
  } catch (err: any) {
    if (cachedPSIData) {
      return res.json({ ok: true, source: 'stale_cache', data: cachedPSIData, warning: err.message });
    }
    res.status(502).json({
      ok: false,
      error: `Failed to fetch PSI data: ${err.message}`
    });
  }
});

export default psiRouter;
