import { Router, Request, Response } from 'express';
import { getActiveOneMapToken } from '../services/onemapService.js';

const healthRouter = Router();
const startTime = Date.now();

interface ServiceHealthResult {
  ok: boolean;
  status: number;
  latencyMs: number;
  error?: string;
  responsePreview?: any;
}

async function checkExternalService(url: string, options: RequestInit = {}): Promise<ServiceHealthResult> {
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    const resp = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - t0;
    return { ok: resp.ok, status: resp.status, latencyMs };
  } catch (err: any) {
    return { ok: false, status: 0, latencyMs: Date.now() - t0, error: err.message };
  }
}

// GET /api/health - Comprehensive API Health Diagnostics
healthRouter.get('/', async (req: Request, res: Response) => {
  const customHeaderToken = req.headers['x-onemap-token'] as string | undefined;
  const activeToken = await getActiveOneMapToken(customHeaderToken);
  const authHeaders: Record<string, string> = activeToken
    ? { Authorization: activeToken.startsWith('Bearer ') ? activeToken : `Bearer ${activeToken}` }
    : {};

  const [
    psiHealth,
    onemapTilesHealth,
    onemapSearchHealth,
    onemapRevgeocodeHealth,
    onemapRouteHealth
  ] = await Promise.all([
    // 1. PSI
    checkExternalService('https://api-open.data.gov.sg/v2/real-time/api/psi'),
    // 2. Tiles
    checkExternalService('https://www.onemap.gov.sg/maps/tiles/Default/11/1614/1018.png'),
    // 3. Search / Geocode
    checkExternalService(
      'https://www.onemap.gov.sg/api/common/elastic/search?searchVal=raffles%20place&returnGeom=Y&getAddrDetails=Y&pageNum=1',
      { headers: authHeaders }
    ),
    // 4. Reverse Geocode
    checkExternalService(
      'https://www.onemap.gov.sg/api/public/revgeocode?location=1.3,103.8&buffer=40&addressType=All',
      { headers: authHeaders }
    ),
    // 5. Routing
    checkExternalService(
      'https://www.onemap.gov.sg/api/public/routingsvc/route?start=1.320981,103.844150&end=1.326762,103.8559&routeType=walk',
      { headers: authHeaders }
    )
  ]);

  const tokenConfigured = Boolean(activeToken);

  const psiStatus = psiHealth.ok ? 'operational' : 'degraded';
  const tilesStatus = onemapTilesHealth.ok ? 'operational' : 'degraded';

  const formatTokenStatus = (h: ServiceHealthResult) => {
    if (h.ok) return 'operational';
    if (h.status === 401) return 'token_required';
    return 'degraded';
  };

  const searchStatus = formatTokenStatus(onemapSearchHealth);
  const revgeocodeStatus = formatTokenStatus(onemapRevgeocodeHealth);
  const routeStatus = formatTokenStatus(onemapRouteHealth);

  const overall = (psiStatus === 'operational' && tilesStatus === 'operational') ? 'operational' : 'degraded';

  const memoryUsage = process.memoryUsage();

  res.json({
    status: overall,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
    tokenStatus: {
      isTokenConfigured: tokenConfigured,
      tokenPreview: activeToken ? `${activeToken.substring(0, 8)}...${activeToken.substring(activeToken.length - 6)}` : null,
      authEndpoint: 'https://www.onemap.gov.sg/api/auth/post/getToken'
    },
    system: {
      nodeVersion: process.version,
      heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      rssMB: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100
    },
    services: {
      psi_api: {
        name: 'Singapore data.gov.sg PSI Real-time API',
        status: psiStatus,
        latencyMs: psiHealth.latencyMs,
        endpoint: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
        httpStatus: psiHealth.status,
        error: psiHealth.error
      },
      onemap_tiles: {
        name: 'Singapore SLA OneMap Tile Service',
        status: tilesStatus,
        latencyMs: onemapTilesHealth.latencyMs,
        endpoint: 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png',
        httpStatus: onemapTilesHealth.status,
        error: onemapTilesHealth.error
      },
      onemap_search: {
        name: 'OneMap Elastic Search / Geocoding API',
        status: searchStatus,
        latencyMs: onemapSearchHealth.latencyMs,
        endpoint: 'https://www.onemap.gov.sg/api/common/elastic/search?searchVal=raffles%20place&returnGeom=Y&getAddrDetails=Y&pageNum=1',
        httpStatus: onemapSearchHealth.status,
        requiresToken: true,
        error: onemapSearchHealth.error
      },
      onemap_revgeocode: {
        name: 'OneMap Reverse Geocoding API',
        status: revgeocodeStatus,
        latencyMs: onemapRevgeocodeHealth.latencyMs,
        endpoint: 'https://www.onemap.gov.sg/api/public/revgeocode?location=1.3,103.8&buffer=40&addressType=All',
        httpStatus: onemapRevgeocodeHealth.status,
        requiresToken: true,
        error: onemapRevgeocodeHealth.error
      },
      onemap_routing: {
        name: 'OneMap Public Routing Service (walk/cycle/drive/pt)',
        status: routeStatus,
        latencyMs: onemapRouteHealth.latencyMs,
        endpoint: 'https://www.onemap.gov.sg/api/public/routingsvc/route?start=...&end=...&routeType=walk',
        httpStatus: onemapRouteHealth.status,
        requiresToken: true,
        routingMode: tokenConfigured ? 'live_onemap_authenticated' : 'fallback_haversine_supported',
        error: onemapRouteHealth.error || (onemapRouteHealth.status === 401 ? 'OneMap public routing requires developer token' : undefined)
      }
    }
  });
});

// GET /api/health/ping - Fast lightweight liveness probe
healthRouter.get('/ping', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000)
  });
});

export default healthRouter;
