/**
 * API Health Monitoring Module: health.js
 * Monitors Singapore Government & OneMap APIs with real-time latency and status probes.
 * Can be run directly via: node health.js
 * Or imported into Express / HTTP servers.
 */

const ENDPOINTS = [
  {
    id: 'psi_api',
    name: 'Singapore data.gov.sg PSI Real-time API',
    url: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
    method: 'GET',
    requiresToken: false
  },
  {
    id: 'onemap_tiles',
    name: 'OneMap Basemap Tile Layer (SLA)',
    url: 'https://www.onemap.gov.sg/maps/tiles/Default/11/1614/1018.png',
    method: 'GET',
    requiresToken: false
  },
  {
    id: 'onemap_search',
    name: 'OneMap Elastic Search / Geocoding',
    url: 'https://www.onemap.gov.sg/api/common/elastic/search?searchVal=raffles%20place&returnGeom=Y&getAddrDetails=Y&pageNum=1',
    method: 'GET',
    requiresToken: true
  },
  {
    id: 'onemap_revgeocode',
    name: 'OneMap Reverse Geocoding API',
    url: 'https://www.onemap.gov.sg/api/public/revgeocode?location=1.3,103.8&buffer=40&addressType=All',
    method: 'GET',
    requiresToken: true
  },
  {
    id: 'onemap_routing',
    name: 'OneMap Public Routing Service',
    url: 'https://www.onemap.gov.sg/api/public/routingsvc/route?start=1.320981,103.844150&end=1.326762,103.8559&routeType=walk',
    method: 'GET',
    requiresToken: true
  }
];

/**
 * Pings a single external endpoint and calculates latency in milliseconds.
 */
export async function checkEndpoint(endpoint, token = null) {
  const start = Date.now();
  const headers = {};

  if (endpoint.requiresToken && token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers,
      signal: controller.signal
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    let status = 'operational';
    if (!response.ok) {
      if (response.status === 401) {
        status = 'token_required';
      } else {
        status = 'degraded';
      }
    }

    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      httpStatus: response.status,
      status,
      latencyMs,
      ok: response.ok,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      httpStatus: 0,
      status: 'offline',
      latencyMs: Date.now() - start,
      ok: false,
      error: err.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Runs a full diagnostic probe across all monitored APIs.
 */
export async function runHealthCheck(token = null) {
  const effectiveToken = token || process.env.ONEMAP_API_TOKEN || null;
  const startTime = Date.now();

  const results = await Promise.all(
    ENDPOINTS.map((endpoint) => checkEndpoint(endpoint, effectiveToken))
  );

  const services = {};
  let totalLatency = 0;
  let healthyCount = 0;

  for (const r of results) {
    services[r.id] = r;
    totalLatency += r.latencyMs;
    if (r.ok || r.status === 'token_required') healthyCount++;
  }

  const overallStatus =
    services.psi_api?.ok && services.onemap_tiles?.ok
      ? 'operational'
      : healthyCount >= 3
      ? 'degraded'
      : 'offline';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
    avgLatencyMs: Math.round(totalLatency / results.length),
    monitoredServicesCount: results.length,
    tokenConfigured: Boolean(effectiveToken),
    services
  };
}

// CLI Standalone Execution
if (process.argv[1]?.endsWith('health.js')) {
  console.log('\n========================================================');
  console.log('       BreatheSG - API Health Diagnostic Monitor');
  console.log('========================================================\n');
  console.log('Pinging Singapore Government & OneMap APIs...\n');

  runHealthCheck().then((report) => {
    console.log(`Overall Health Status: [ ${report.status.toUpperCase()} ]`);
    console.log(`Timestamp:             ${report.timestamp}`);
    console.log(`Average Latency:       ${report.avgLatencyMs}ms`);
    console.log(`Token Configured:      ${report.tokenConfigured ? 'YES' : 'NO'}\n`);
    console.log('--------------------------------------------------------');

    for (const [id, s] of Object.entries(report.services)) {
      const tag = s.ok
        ? '✓ OPERATIONAL'
        : s.status === 'token_required'
        ? '⚠ TOKEN REQUIRED'
        : '✖ ERROR';

      console.log(`[${tag}] ${s.name}`);
      console.log(`  Latency: ${s.latencyMs}ms | HTTP: ${s.httpStatus}`);
      console.log(`  URL:     ${s.url}`);
      if (s.error) console.log(`  Error:   ${s.error}`);
      console.log('');
    }

    console.log('========================================================\n');
    process.exit(report.status === 'offline' ? 1 : 0);
  });
}
