import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ParkLocation, MallLocation, RegionPSI, RouteResult } from '../types';
import { Layers, Locate, Navigation2, ShieldCheck, AlertTriangle, Compass } from 'lucide-react';

interface OneMapViewerProps {
  userLocation: { lat: number; lng: number; name?: string };
  onSelectUserLocation: (lat: number, lng: number, name?: string) => void;
  parks: ParkLocation[];
  malls: MallLocation[];
  selectedDestination: ParkLocation | MallLocation | null;
  onSelectDestination: (dest: ParkLocation | MallLocation) => void;
  psiByRegion: Record<string, RegionPSI>;
  psiThreshold: number;
  routeResult: RouteResult | null;
}

export const OneMapViewer: React.FC<OneMapViewerProps> = ({
  userLocation,
  onSelectUserLocation,
  parks,
  malls,
  selectedDestination,
  onSelectDestination,
  psiByRegion,
  psiThreshold,
  routeResult
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const psiZonesLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapStyle, setMapStyle] = useState<'Default' | 'Night' | 'Grey'>('Default');
  const [showParks, setShowParks] = useState(true);
  const [showMalls, setShowMalls] = useState(true);
  const [showPsiZones, setShowPsiZones] = useState(true);
  const [activeTileLayer, setActiveTileLayer] = useState<L.TileLayer | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Fix standard Leaflet icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true
    });

    // Custom zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer: OneMap Default
    const tileLayer = L.tileLayer('https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om.png" style="height:14px;display:inline-block;vertical-align:middle;margin-right:4px;" alt="OneMap"/> &copy; Singapore Land Authority'
    }).addTo(map);

    setActiveTileLayer(tileLayer);

    const markersGroup = L.layerGroup().addTo(map);
    const psiZonesGroup = L.layerGroup().addTo(map);

    markersLayerRef.current = markersGroup;
    psiZonesLayerRef.current = psiZonesGroup;
    mapInstanceRef.current = map;

    // Click map to reposition user's start point and reverse geocode location
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const customToken = localStorage.getItem('onemap_custom_token') || '';
      const headers: Record<string, string> = {};
      if (customToken) headers['x-onemap-token'] = customToken;

      try {
        const res = await fetch(`/api/revgeocode?lat=${lat}&lng=${lng}`, { headers });
        const data = await res.json();
        const address = data.formattedAddress || 'Pinned Point on Map';
        onSelectUserLocation(lat, lng, address);
      } catch {
        onSelectUserLocation(lat, lng, 'Pinned Point on Map');
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Tile Layer when style changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeTileLayer) {
      map.removeLayer(activeTileLayer);
    }

    const tileUrl = `https://www.onemap.gov.sg/maps/tiles/${mapStyle}/{z}/{x}/{y}.png`;
    const newLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; Singapore Land Authority | OneMap'
    }).addTo(map);

    setActiveTileLayer(newLayer);
  }, [mapStyle]);

  // Render PSI Regional Circles
  useEffect(() => {
    const psiGroup = psiZonesLayerRef.current;
    if (!psiGroup) return;

    psiGroup.clearLayers();
    if (!showPsiZones) return;

    const regionPositions: Record<string, [number, number]> = {
      north: [1.41803, 103.82],
      south: [1.29587, 103.82],
      east: [1.35735, 103.94],
      west: [1.35735, 103.70],
      central: [1.35735, 103.82]
    };

    Object.entries(regionPositions).forEach(([regionKey, coords]) => {
      const data = psiByRegion[regionKey];
      const psiVal = data ? data.psi : 45;
      const isUnsafe = psiVal > psiThreshold;

      const circleColor = isUnsafe ? '#f43f5e' : psiVal > 50 ? '#f59e0b' : '#10b981';

      const circle = L.circle(coords, {
        radius: 4000,
        color: circleColor,
        weight: 1.5,
        fillColor: circleColor,
        fillOpacity: 0.08,
        dashArray: '4, 4'
      });

      const labelIcon = L.divIcon({
        className: 'custom-psi-badge',
        html: `
          <div style="background: rgba(15,23,42,0.85); border: 1px solid ${circleColor}; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap; backdrop-filter: blur(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            <span style="color: ${circleColor}; font-weight: 700;">${regionKey.toUpperCase()}</span> PSI ${psiVal}
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });

      const labelMarker = L.marker(coords, { icon: labelIcon, interactive: false });

      psiGroup.addLayer(circle);
      psiGroup.addLayer(labelMarker);
    });
  }, [psiByRegion, psiThreshold, showPsiZones]);

  // Update Markers and Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. User Start Marker
    const userIcon = L.divIcon({
      className: 'user-pin-icon',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; items-center; justify-content: center;">
          <div style="position: absolute; inset: 0; background: #06b6d4; border-radius: 50%; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 4px; background: #0891b2; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); color: white;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000
    }).bindPopup(`
      <div style="padding: 4px; font-family: sans-serif;">
        <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 2px;">Your Starting Point</div>
        <div style="font-weight: 600; font-size: 13px; color: #0f172a;">${userLocation.name || 'Selected Location'}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}</div>
      </div>
    `);
    markersGroup.addLayer(userMarker);

    // 2. Parks Markers
    if (showParks) {
      parks.forEach((park) => {
        const regionPsi = psiByRegion[park.region]?.psi ?? 40;
        const isSafe = regionPsi <= psiThreshold;
        const isSelected = selectedDestination?.id === park.id;

        const pinColor = isSafe ? '#10b981' : '#f43f5e';
        const borderColor = isSelected ? '#38bdf8' : '#ffffff';

        const parkIcon = L.divIcon({
          className: 'park-pin',
          html: `
            <div style="width: ${isSelected ? 36 : 28}px; height: ${isSelected ? 36 : 28}px; border-radius: 50%; background: ${pinColor}; border: ${isSelected ? '3px' : '2px'} solid ${borderColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); cursor: pointer; transition: transform 0.2s;">
              <svg width="${isSelected ? 18 : 14}" height="${isSelected ? 18 : 14}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22v-7"/><path d="M7 15l5-5 5 5"/><path d="M8 10l4-4 4 4"/><circle cx="12" cy="4" r="1.5"/></svg>
            </div>
          `,
          iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
          iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14]
        });

        const parkMarker = L.marker([park.latitude, park.longitude], { icon: parkIcon });
        parkMarker.on('click', () => onSelectDestination(park));

        parkMarker.bindPopup(`
          <div style="min-width: 180px; font-family: sans-serif; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase;">${park.region} Park</span>
              <span style="font-size: 10px; font-weight: 700; background: ${isSafe ? '#dcfce7' : '#fee2e2'}; color: ${isSafe ? '#166534' : '#991b1b'}; padding: 2px 6px; border-radius: 4px;">
                PSI ${regionPsi} ${isSafe ? '✓ Safe' : '⚠ High'}
              </span>
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${park.name}</div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">${park.trackLengthKm} km track · ${park.surface}</div>
            <button id="btn-select-${park.id}" style="width: 100%; background: #0f172a; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
              Plan Jogging Route Here
            </button>
          </div>
        `);

        parkMarker.on('popupopen', () => {
          const btn = document.getElementById(`btn-select-${park.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectDestination(park);
              parkMarker.closePopup();
            };
          }
        });

        markersGroup.addLayer(parkMarker);
      });
    }

    // 3. Malls Markers
    if (showMalls) {
      malls.forEach((mall) => {
        const isSelected = selectedDestination?.id === mall.id;
        const borderColor = isSelected ? '#38bdf8' : '#ffffff';

        const mallIcon = L.divIcon({
          className: 'mall-pin',
          html: `
            <div style="width: ${isSelected ? 36 : 28}px; height: ${isSelected ? 36 : 28}px; border-radius: 8px; background: #6366f1; border: ${isSelected ? '3px' : '2px'} solid ${borderColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); cursor: pointer; transform: rotate(45deg);">
              <svg style="transform: rotate(-45deg);" width="${isSelected ? 18 : 14}" height="${isSelected ? 18 : 14}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
          `,
          iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
          iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14]
        });

        const mallMarker = L.marker([mall.latitude, mall.longitude], { icon: mallIcon });
        mallMarker.on('click', () => onSelectDestination(mall));

        mallMarker.bindPopup(`
          <div style="min-width: 180px; font-family: sans-serif; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase;">Indoor Sanctuary</span>
              <span style="font-size: 10px; font-weight: 700; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px;">
                Air-Conditioned
              </span>
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${mall.name}</div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">${mall.indoorWalkingLoopKm} km walking loop · MRT: ${mall.mrtStation}</div>
            <button id="btn-select-${mall.id}" style="width: 100%; background: #4f46e5; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
              Plan Route to Mall
            </button>
          </div>
        `);

        mallMarker.on('popupopen', () => {
          const btn = document.getElementById(`btn-select-${mall.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectDestination(mall);
              mallMarker.closePopup();
            };
          }
        });

        markersGroup.addLayer(mallMarker);
      });
    }

    // 4. Draw Route Polyline
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeResult && routeResult.coordinates && routeResult.coordinates.length > 0) {
      const polyline = L.polyline(routeResult.coordinates, {
        color: '#38bdf8',
        weight: 5,
        opacity: 0.9,
        dashArray: '6, 8',
        lineCap: 'round'
      }).addTo(map);

      routeLayerRef.current = polyline;

      // Fit map bounds to show full route nicely with padding
      const routeBounds = polyline.getBounds();
      if (routeBounds.isValid()) {
        map.fitBounds(routeBounds, { padding: [60, 60], maxZoom: 15 });
      }
    }
  }, [userLocation, parks, malls, selectedDestination, psiByRegion, psiThreshold, showParks, showMalls, routeResult]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13, { animate: true });
  };

  const handleFitSingapore = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([1.3521, 103.8198], 12, { animate: true });
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-0" />

      {/* Floating Map Controls - Top Bar Contract & Ergonomics */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-[400]">
        {/* Style Selector */}
        <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg">
          <button
            onClick={() => setMapStyle('Default')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              mapStyle === 'Default' ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            OneMap Light
          </button>
          <button
            onClick={() => setMapStyle('Night')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              mapStyle === 'Night' ? 'bg-cyan-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Night Map
          </button>
        </div>

        {/* Layer Filters */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg">
          <button
            onClick={() => setShowParks(!showParks)}
            className={`px-2 py-1 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap ${
              showParks ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Parks"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Parks
          </button>
          <button
            onClick={() => setShowMalls(!showMalls)}
            className={`px-2 py-1 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap ${
              showMalls ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Indoor Malls"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            Malls
          </button>
          <button
            onClick={() => setShowPsiZones(!showPsiZones)}
            className={`px-2 py-1 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap ${
              showPsiZones ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle PSI Overlay"
          >
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            PSI
          </button>
        </div>
      </div>

      {/* Floating Action Buttons - Bottom Left */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 pointer-events-auto z-[400]">
        <button
          onClick={handleRecenter}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 backdrop-blur-md text-white border border-slate-700 rounded-xl text-xs font-semibold shadow-lg hover:bg-slate-800 active:scale-95 transition-all min-h-[44px]"
          title="Center on user start point"
        >
          <Locate className="w-4 h-4 text-cyan-400" />
          <span>My Start Point</span>
        </button>
        <button
          onClick={handleFitSingapore}
          className="p-2.5 bg-slate-900/90 backdrop-blur-md text-white border border-slate-700 rounded-xl text-xs font-semibold shadow-lg hover:bg-slate-800 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="View whole Singapore map"
        >
          <Compass className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* Floating Hint Overlay */}
      <div className="absolute bottom-4 right-14 bg-slate-950/80 backdrop-blur-sm border border-slate-800/80 text-[11px] text-slate-300 px-3 py-1.5 rounded-lg pointer-events-none hidden sm:block z-[400]">
        Tap anywhere on the OneMap to move your starting point
      </div>
    </div>
  );
};
