export type RegionKey = 'north' | 'south' | 'east' | 'west' | 'central';

export interface RegionPSI {
  region: RegionKey;
  name: string;
  psi: number;
  pm25: number;
  status: 'good' | 'moderate' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  statusLabel: string;
  color: string;
}

export interface PSIApiResponse {
  code: number;
  data: {
    regionMetadata: Array<{
      name: string;
      labelLocation: {
        latitude: number;
        longitude: number;
      };
    }>;
    items: Array<{
      date: string;
      updatedTimestamp: string;
      timestamp: string;
      readings: {
        psi_twenty_four_hourly: Record<string, number>;
        pm25_twenty_four_hourly?: Record<string, number>;
        pm25_sub_index?: Record<string, number>;
        pm10_twenty_four_hourly?: Record<string, number>;
        o3_eight_hour_max?: Record<string, number>;
        no2_one_hour_max?: Record<string, number>;
        so2_twenty_four_hourly?: Record<string, number>;
      };
    }>;
  };
}

export interface ParkLocation {
  id: string;
  name: string;
  region: RegionKey;
  latitude: number;
  longitude: number;
  description: string;
  trackLengthKm: number;
  surface: string;
  amenities: string[];
  lighting: string;
  suitableFor: string[];
}

export interface MallLocation {
  id: string;
  name: string;
  region: RegionKey;
  latitude: number;
  longitude: number;
  description: string;
  indoorWalkingLoopKm: number;
  levels: number;
  mrtStation: string;
  amenities: string[];
  indoorHighlights: string[];
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  jogDurationMinutes: number;
  caloriesBurned: number;
  routeType: 'walk' | 'cycle' | 'drive' | 'pt';
  coordinates: [number, number][]; // [lat, lng]
  instructions: RouteStep[];
  isSimulated?: boolean;
  routeNote?: string;
}

export interface ApiHealthReport {
  status: 'operational' | 'degraded' | 'offline';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  services: {
    psi_api: {
      status: 'operational' | 'degraded' | 'offline';
      latencyMs: number;
      endpoint: string;
      lastDataTimestamp?: string;
      error?: string;
    };
    onemap_tiles: {
      status: 'operational' | 'degraded' | 'offline';
      latencyMs: number;
      endpoint: string;
      error?: string;
    };
    onemap_search: {
      status: 'operational' | 'degraded' | 'offline';
      latencyMs: number;
      endpoint: string;
      error?: string;
    };
    onemap_routing: {
      status: 'operational' | 'requires_token' | 'offline';
      latencyMs: number;
      endpoint: string;
      tokenConfigured: boolean;
      routingMode: string;
      error?: string;
    };
  };
}

export type WeatherEffectType = 'auto' | 'sunny' | 'hazy' | 'rain' | 'overcast' | 'night';
