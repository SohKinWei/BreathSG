import { Router, Request, Response } from 'express';
import { onemapReverseGeocode } from '../services/onemapService.js';

const revgeocodeRouter = Router();

revgeocodeRouter.get('/', async (req: Request, res: Response) => {
  const { location, lat, lng, buffer = '40', addressType = 'All' } = req.query;

  let latitude: number | null = null;
  let longitude: number | null = null;

  if (location && typeof location === 'string') {
    const [la, lo] = location.split(',').map(Number);
    if (!isNaN(la) && !isNaN(lo)) {
      latitude = la;
      longitude = lo;
    }
  } else if (lat && lng) {
    const la = Number(lat);
    const lo = Number(lng);
    if (!isNaN(la) && !isNaN(lo)) {
      latitude = la;
      longitude = lo;
    }
  }

  if (latitude === null || longitude === null) {
    return res.status(400).json({
      error: 'Invalid location coordinates. Provide location=lat,lng or lat=...&lng=...'
    });
  }

  const customToken = req.headers['x-onemap-token'] as string | undefined;

  try {
    const result = await onemapReverseGeocode(
      latitude,
      longitude,
      Number(buffer) || 40,
      String(addressType) || 'All',
      customToken
    );

    if (result.ok && result.data) {
      const geocodeInfo = result.data.GeocodeInfo?.[0] || result.data.results?.[0] || null;
      return res.json({
        ok: true,
        source: 'onemap_live',
        latitude,
        longitude,
        data: result.data,
        formattedAddress: geocodeInfo
          ? [geocodeInfo.BUILDINGNAME, geocodeInfo.ROAD, geocodeInfo.POSTALCODE].filter(Boolean).join(', ')
          : null
      });
    }

    // Fallback if token required or no result
    return res.json({
      ok: true,
      source: 'fallback',
      latitude,
      longitude,
      formattedAddress: `Singapore Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      note: result.data?.error || 'OneMap token required for reverse geocoding details'
    });
  } catch (err: any) {
    res.json({
      ok: true,
      source: 'fallback_error',
      latitude,
      longitude,
      formattedAddress: `Singapore Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      error: err.message
    });
  }
});

export default revgeocodeRouter;
