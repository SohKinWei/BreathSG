/**
 * API Health Monitoring Module: health.js
 * Monitors the Singapore Government data.gov.sg real-time PSI checking API.
 * Run directly via: node health.js or npm run health
 */

const PSI_ENDPOINT = {
  id: 'psi_api',
  name: 'Singapore data.gov.sg PSI Real-time API',
  url: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
  method: 'GET'
};

/**
 * Pings the PSI endpoint and calculates latency in milliseconds.
 */
export async function checkPsiHealth() {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(PSI_ENDPOINT.url, {
      method: PSI_ENDPOINT.method,
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    return {
      id: PSI_ENDPOINT.id,
      name: PSI_ENDPOINT.name,
      url: PSI_ENDPOINT.url,
      httpStatus: response.status,
      status: response.ok ? 'operational' : 'degraded',
      latencyMs,
      ok: response.ok,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      id: PSI_ENDPOINT.id,
      name: PSI_ENDPOINT.name,
      url: PSI_ENDPOINT.url,
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
 * Runs diagnostic health check for the PSI checking API.
 */
export async function runHealthCheck() {
  const startTime = Date.now();
  const psiResult = await checkPsiHealth();

  return {
    status: psiResult.status,
    timestamp: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
    latencyMs: psiResult.latencyMs,
    services: {
      psi_api: psiResult
    }
  };
}

// CLI Standalone Execution
if (process.argv[1]?.endsWith('health.js')) {
  console.log('\n========================================================');
  console.log('       BreatheSG - PSI API Health Diagnostic Monitor');
  console.log('========================================================\n');
  console.log('Pinging Singapore Government data.gov.sg Real-Time PSI API...\n');

  runHealthCheck().then((report) => {
    const psi = report.services.psi_api;
    console.log(`Overall Health Status: [ ${report.status.toUpperCase()} ]`);
    console.log(`Timestamp:             ${report.timestamp}`);
    console.log(`Response Latency:      ${report.latencyMs}ms\n`);
    console.log('--------------------------------------------------------');

    const tag = psi.ok ? '✓ OPERATIONAL' : '✖ OFFLINE';
    console.log(`[${tag}] ${psi.name}`);
    console.log(`  Latency: ${psi.latencyMs}ms | HTTP Status: ${psi.httpStatus}`);
    console.log(`  URL:     ${psi.url}`);
    if (psi.error) console.log(`  Error:   ${psi.error}`);

    console.log('\n========================================================\n');
    process.exit(report.status === 'offline' ? 1 : 0);
  });
}
