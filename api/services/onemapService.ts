/**
 * Singapore Land Authority (SLA) OneMap Service Client
 * Handles token generation, caching, geocoding, reverse geocoding, and routing.
 */

let cachedToken: string | null = null;
let tokenExpiryTimestamp: number = 0;

export function decodePolyline(str: string, precision = 5): [number, number][] {
  if (!str) return [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([Number((lat / factor).toFixed(6)), Number((lng / factor).toFixed(6))]);
  }

  return coordinates;
}

export async function requestOneMapToken(email: string, password: string): Promise<{ access_token: string; expiry_timestamp: string }> {
  const response = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error || data.message || `OneMap token authentication failed with HTTP ${response.status}`);
  }

  return {
    access_token: data.access_token,
    expiry_timestamp: data.expiry_timestamp
  };
}

export async function getActiveOneMapToken(overrideToken?: string): Promise<string | null> {
  // 1. Explicit caller override (from request header or query)
  if (overrideToken && overrideToken.trim()) {
    return overrideToken.trim();
  }

  // 2. Cached token if still valid (buffer 5 minutes)
  const now = Date.now();
  if (cachedToken && tokenExpiryTimestamp > now + 5 * 60 * 1000) {
    return cachedToken;
  }

  // 3. Static environment variable token
  if (process.env.ONEMAP_API_TOKEN && process.env.ONEMAP_API_TOKEN.trim()) {
    return process.env.ONEMAP_API_TOKEN.trim();
  }

  // 4. Automated credentials-based token generation
  const email = process.env.ONEMAP_EMAIL?.trim();
  const password = process.env.ONEMAP_PASSWORD?.trim();

  if (email && password) {
    try {
      const result = await requestOneMapToken(email, password);
      cachedToken = result.access_token;
      // Expiry timestamp typically unix timestamp in seconds or milliseconds
      const expiry = Number(result.expiry_timestamp);
      tokenExpiryTimestamp = expiry > 1e11 ? expiry : expiry * 1000;
      return cachedToken;
    } catch (err: any) {
      console.warn('[OneMap] Automatic token renewal error:', err.message);
    }
  }

  return null;
}

export function setCustomCachedToken(token: string, expirySeconds = 86400) {
  cachedToken = token;
  tokenExpiryTimestamp = Date.now() + expirySeconds * 1000;
}

export async function onemapSearch(searchVal: string, pageNum = 1, token?: string) {
  const activeToken = await getActiveOneMapToken(token);
  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(searchVal)}&returnGeom=Y&getAddrDetails=Y&pageNum=${pageNum}`;

  const headers: Record<string, string> = {};
  if (activeToken) {
    headers['Authorization'] = activeToken.startsWith('Bearer ') ? activeToken : `Bearer ${activeToken}`;
  }

  const response = await fetch(url, { headers });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data, hasToken: Boolean(activeToken) };
}

export async function onemapReverseGeocode(lat: number, lng: number, buffer = 40, addressType = 'All', token?: string) {
  const activeToken = await getActiveOneMapToken(token);
  const url = `https://www.onemap.gov.sg/api/public/revgeocode?location=${lat},${lng}&buffer=${buffer}&addressType=${addressType}`;

  const headers: Record<string, string> = {};
  if (activeToken) {
    headers['Authorization'] = activeToken.startsWith('Bearer ') ? activeToken : `Bearer ${activeToken}`;
  }

  const response = await fetch(url, { headers });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data, hasToken: Boolean(activeToken) };
}

export async function onemapRoute(start: [number, number], end: [number, number], routeType: 'walk' | 'drive' | 'cycle' | 'pt', token?: string) {
  const activeToken = await getActiveOneMapToken(token);
  const url = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${start[0]},${start[1]}&end=${end[0]},${end[1]}&routeType=${routeType}`;

  const headers: Record<string, string> = {};
  if (activeToken) {
    headers['Authorization'] = activeToken.startsWith('Bearer ') ? activeToken : `Bearer ${activeToken}`;
  }

  const response = await fetch(url, { headers });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data, hasToken: Boolean(activeToken) };
}
