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
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - t0;
    return { ok: resp.ok, status: resp.status, latencyMs };
  } catch (err: any) {
    return { ok: false, status: 0, latencyMs: Date.now() - t0, error: err.message };
  }
}

// GET /api/health - PSI API & Server Health Monitor
healthRouter.get('/', async (_req: Request, res: Response) => {
  const psiHealth = await checkExternalService('https://api-open.data.gov.sg/v2/real-time/api/psi');

  const psiStatus = psiHealth.ok ? 'operational' : 'degraded';
  const overall = psiStatus;

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
