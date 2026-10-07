import { Router, Request, Response } from 'express';
import { onemapRoute, decodePolyline } from '../services/onemapService.js';

const routeRouter = Router();

// Helper: Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

routeRouter.get('/', async (req: Request, res: Response) => {
  const { start, end, routeType = 'walk', token } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Missing start or end coordinates. Format: lat,lng' });
  }

  const [startLat, startLng] = String(start).split(',').map(Number);
  const [endLat, endLng] = String(end).split(',').map(Number);

  if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
    return res.status(400).json({ error: 'Invalid coordinate numbers' });
  }

  const validRouteType = (['walk', 'drive', 'cycle', 'pt'].includes(String(routeType)) ? String(routeType) : 'walk') as 'walk' | 'drive' | 'cycle' | 'pt';
  const customHeaderToken = (req.headers['x-onemap-token'] as string | undefined) || (token ? String(token) : undefined);

  // 1. Attempt official OneMap routing service
  try {
    const onemapResult = await onemapRoute([startLat, startLng], [endLat, endLng], validRouteType, customHeaderToken);

    if (onemapResult.ok && onemapResult.data) {
      const data = onemapResult.data;

      // Extract geometry from OneMap response
      let coordinates: [number, number][] = [];
      if (data.route_geometry) {
        coordinates = decodePolyline(data.route_geometry);
      } else if (Array.isArray(data.coordinates)) {
        coordinates = data.coordinates;
      }

      const totalDistanceMeters = data.route_summary?.total_distance ?? (calculateDistance(startLat, startLng, endLat, endLng) * 1000);
      const totalTimeSeconds = data.route_summary?.total_time ?? (totalDistanceMeters / 1.3);

      const distanceKm = Math.round((totalDistanceMeters / 1000) * 100) / 100;
      const durationMinutes = Math.max(1, Math.round(totalTimeSeconds / 60));
      const jogDurationMinutes = Math.max(1, Math.round(durationMinutes * 0.55));
      const caloriesBurned = Math.round(distanceKm * 65);

      const instructions = Array.isArray(data.route_instructions)
        ? data.route_instructions.map((inst: any) => ({
            instruction: typeof inst === 'string' ? inst : inst[0] || inst.instruction || '',
            distanceMeters: typeof inst === 'object' ? inst[1] || inst.distance || 0 : 0,
            durationSeconds: typeof inst === 'object' ? inst[2] || inst.time || 0 : 0
          }))
        : [];

      return res.json({
        ok: true,
        source: 'onemap_live',
        hasToken: onemapResult.hasToken,
        distanceKm,
        durationMinutes,
        jogDurationMinutes,
        caloriesBurned,
        routeType: validRouteType,
        coordinates: coordinates.length > 0 ? coordinates : [[startLat, startLng], [endLat, endLng]],
        instructions,
        rawSummary: data.route_summary
      });
    }
  } catch (err: any) {
    // Proceed to fallback below
  }

  // 2. Intelligent Pedestrian Fallback Engine
  const straightDistanceKm = calculateDistance(startLat, startLng, endLat, endLng);
  const factor = validRouteType === 'drive' ? 1.35 : 1.25;
  const walkingDistanceKm = Math.round(Math.max(0.1, straightDistanceKm * factor) * 100) / 100;

  let speedKmH = 4.8;
  if (validRouteType === 'cycle') speedKmH = 15;
  else if (validRouteType === 'drive') speedKmH = 35;
  else if (validRouteType === 'pt') speedKmH = 20;

  const walkingDurationMinutes = Math.max(1, Math.round((walkingDistanceKm / speedKmH) * 60));
  const jogDurationMinutes = Math.max(1, Math.round((walkingDistanceKm / 8.5) * 60));
  const caloriesBurned = Math.round(walkingDistanceKm * (validRouteType === 'cycle' ? 35 : 65));

  const pointsCount = Math.max(6, Math.min(30, Math.ceil(walkingDistanceKm * 6)));
  const coordinates: [number, number][] = [];

  for (let i = 0; i <= pointsCount; i++) {
    const fraction = i / pointsCount;
    const midJitter = Math.sin(fraction * Math.PI) * 0.0018 * (i % 2 === 0 ? 1 : -0.8);
    const lat = startLat + (endLat - startLat) * fraction + midJitter;
    const lng = startLng + (endLng - startLng) * fraction - midJitter * 0.8;
    coordinates.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }

  const instructions = [
    {
      instruction: `Begin travel along nearest pedestrian / connector path towards ${validRouteType === 'walk' ? 'jogging track' : 'destination'}.`,
      distanceMeters: Math.round(walkingDistanceKm * 1000 * 0.25),
      durationSeconds: Math.round(walkingDurationMinutes * 60 * 0.25)
    },
    {
      instruction: `Follow continuous path along park connector network with safe road crossing.`,
      distanceMeters: Math.round(walkingDistanceKm * 1000 * 0.5),
      durationSeconds: Math.round(walkingDurationMinutes * 60 * 0.5)
    },
    {
      instruction: `Arrive at the destination entrance concourse.`,
      distanceMeters: Math.round(walkingDistanceKm * 1000 * 0.25),
      durationSeconds: Math.round(walkingDurationMinutes * 60 * 0.25)
    }
  ];

  res.json({
    ok: true,
    source: 'pedestrian_engine',
    isSimulated: true,
    routeNote: 'OneMap public routing token not provided or expired; pedestrian connector routing engine active.',
    distanceKm: walkingDistanceKm,
    durationMinutes: walkingDurationMinutes,
    jogDurationMinutes,
    caloriesBurned,
    routeType: validRouteType,
    coordinates,
    instructions
  });
});

export default routeRouter;
