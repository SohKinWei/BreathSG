import { Router, Request, Response } from 'express';

const healthRouter = Router();
const startTime = Date.now();

interface ServiceHealthResult {
  ok: boolean;
  status: number;
  latencyMs: number;
  error?: string;
}

async function checkExternalService(url: string, options: RequestInit = {}): Promise<ServiceHealthResult> {
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - t0;
    return { ok: resp.ok, status: resp.status, latencyMs };
  } catch (err: any) {
    return { ok: false, status: 0, latencyMs: Date.now() - t0, error: err.message };
  }
}

// GET /api/health - Comprehensive API Health Diagnostics
healthRouter.get('/', async (_req: Request, res: Response) => {
  const [psiHealth, onemapTilesHealth, onemapSearchHealth, onemapRouteHealth] = await Promise.all([
    checkExternalService('https://api-open.data.gov.sg/v2/real-time/api/psi'),
    checkExternalService('https://www.onemap.gov.sg/maps/tiles/Default/11/1614/1018.png'),
    checkExternalService('https://www.onemap.gov.sg/api/common/elastic/search?searchVal=orchard&returnGeom=Y&getAddrDetails=Y'),
    checkExternalService(
      'https://www.onemap.gov.sg/api/public/routingsvc/route?start=1.320981,103.844150&end=1.326762,103.8559&routeType=walk',
      process.env.ONEMAP_API_TOKEN ? { headers: { Authorization: `Bearer ${process.env.ONEMAP_API_TOKEN}` } } : {}
    )
  ]);

  const tokenConfigured = Boolean(process.env.ONEMAP_API_TOKEN);

  const psiStatus = psiHealth.ok ? 'operational' : 'degraded';
  const tilesStatus = onemapTilesHealth.ok ? 'operational' : 'degraded';
  const searchStatus = onemapSearchHealth.ok ? 'operational' : 'degraded';
  const routeStatus = onemapRouteHealth.ok
    ? 'operational'
    : onemapRouteHealth.status === 401
    ? 'requires_token'
    : 'degraded';

  const overall = (psiStatus === 'operational' && tilesStatus === 'operational') ? 'operational' : 'degraded';

  const memoryUsage = process.memoryUsage();

  res.json({
    status: overall,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
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
        name: 'OneMap Elastic Geocoding & Address Search',
        status: searchStatus,
        latencyMs: onemapSearchHealth.latencyMs,
        endpoint: 'https://www.onemap.gov.sg/api/common/elastic/search',
        httpStatus: onemapSearchHealth.status,
        error: onemapSearchHealth.error
      },
      onemap_routing: {
        name: 'OneMap Public Routing Service',
        status: routeStatus,
        latencyMs: onemapRouteHealth.latencyMs,
        endpoint: 'https://www.onemap.gov.sg/api/public/routingsvc/route',
        httpStatus: onemapRouteHealth.status,
        tokenConfigured,
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
