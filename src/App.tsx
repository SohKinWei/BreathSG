/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  RegionKey,
  RegionPSI,
  ParkLocation,
  MallLocation,
  RouteResult,
  WeatherEffectType
} from './types';
import {
  SINGAPORE_PARKS,
  SINGAPORE_MALLS,
  determineRegionFromCoords,
  calculateDistanceKm
} from './data/singaporeLocations';
import { WeatherEffectsCanvas } from './components/WeatherEffectsCanvas';
import { OneMapViewer } from './components/OneMapViewer';
import { PsiStatusCards } from './components/PsiStatusCards';
import { JoggingPlanner } from './components/JoggingPlanner';
import { ApiHealthModal } from './components/ApiHealthModal';
import {
  Compass,
  Footprints,
  ShieldCheck,
  ShoppingBag,
  CloudSun,
  Activity,
  Trees,
  Wind,
  Sun,
  CloudRain,
  Cloud,
  Moon,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Pre-generated high-fidelity local assets
import parkTrailImg from './assets/images/singapore_park_trail_1791357724145.jpg';
import indoorMallImg from './assets/images/singapore_indoor_mall_1791357738681.jpg';
import skylineImg from './assets/images/singapore_skyline_weather_1791357753891.jpg';

export default function App() {
  // Navigation View (for mobile tabs or desktop panels)
  const [activeView, setActiveView] = useState<'planner' | 'map' | 'psi' | 'malls'>('planner');

  // User Starting Origin (Default: Central Singapore / Bishan)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name?: string }>({
    lat: 1.3521,
    lng: 103.8198,
    name: 'Singapore Central (Bishan)'
  });

  // Selected Region for filtering / focus
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('central');

  // Personal PSI safe cutoff threshold (Default 100 as per NEA general advisory)
  const [psiThreshold, setPsiThreshold] = useState<number>(100);

  // Selected Destination (Park or Mall)
  const [selectedDestination, setSelectedDestination] = useState<ParkLocation | MallLocation | null>(
    SINGAPORE_PARKS[0]
  );

  // Active Navigation Route
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Real-time PSI data state
  const [psiByRegion, setPsiByRegion] = useState<Record<string, RegionPSI>>({
    central: { region: 'central', name: 'Central', psi: 46, pm25: 16, status: 'good', statusLabel: 'Good', color: '#10b981' },
    east: { region: 'east', name: 'East', psi: 48, pm25: 18, status: 'good', statusLabel: 'Good', color: '#10b981' },
    west: { region: 'west', name: 'West', psi: 44, pm25: 15, status: 'good', statusLabel: 'Good', color: '#10b981' },
    north: { region: 'north', name: 'North', psi: 42, pm25: 14, status: 'good', statusLabel: 'Good', color: '#10b981' },
    south: { region: 'south', name: 'South', psi: 49, pm25: 17, status: 'good', statusLabel: 'Good', color: '#10b981' }
  });
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshingPSI, setIsRefreshingPSI] = useState(false);

  // Atmospheric Weather Effect
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffectType>('auto');

  // API Health Diagnostic Modal
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  // Fetch Live PSI from our Express API endpoint
  const fetchLivePSI = useCallback(async () => {
    setIsRefreshingPSI(true);
    try {
      const res = await fetch('/api/psi');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.data && json.data.items && json.data.items.length > 0) {
        const latestItem = json.data.items[0];
        const psiReadings = latestItem.readings?.psi_twenty_four_hourly || {};
        const pm25Readings = latestItem.readings?.pm25_twenty_four_hourly || {};

        const updated: Record<string, RegionPSI> = {};
        const regions: RegionKey[] = ['central', 'east', 'west', 'north', 'south'];

        regions.forEach((reg) => {
          const psi = psiReadings[reg] ?? 45;
          const pm25 = pm25Readings[reg] ?? 16;
          let status: RegionPSI['status'] = 'good';
          let statusLabel = 'Good';
          let color = '#10b981';

          if (psi > 200) {
            status = 'very_unhealthy';
            statusLabel = 'Very Unhealthy';
            color = '#f43f5e';
          } else if (psi > 100) {
            status = 'unhealthy';
            statusLabel = 'Unhealthy';
            color = '#f97316';
          } else if (psi > 50) {
            status = 'moderate';
            statusLabel = 'Moderate';
            color = '#f59e0b';
          }

          updated[reg] = {
            region: reg,
            name: reg.charAt(0).toUpperCase() + reg.slice(1),
            psi,
            pm25,
            status,
            statusLabel,
            color
          };
        });

        setPsiByRegion(updated);
        setLastUpdated(latestItem.updatedTimestamp || latestItem.timestamp || new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to load real-time PSI:', err);
    } finally {
      setIsRefreshingPSI(false);
    }
  }, []);

  useEffect(() => {
    fetchLivePSI();
    // Poll PSI periodically every 2 minutes
    const interval = setInterval(fetchLivePSI, 120000);
    return () => clearInterval(interval);
  }, [fetchLivePSI]);

  // Calculate route between start and destination (walk | cycle | drive | pt)
  const handleFetchRoute = (
    start: [number, number],
    end: [number, number],
    type: 'walk' | 'cycle' | 'drive' | 'pt' = 'walk'
  ) => {
    setIsLoadingRoute(true);
    const straightDist = calculateDistanceKm(start[0], start[1], end[0], end[1]);
    const factor = type === 'drive' ? 1.35 : 1.25;
    const distanceKm = Math.round(Math.max(0.1, straightDist * factor) * 100) / 100;

    let speedKmH = 4.8;
    if (type === 'cycle') speedKmH = 15;
    else if (type === 'drive') speedKmH = 35;
    else if (type === 'pt') speedKmH = 20;

    const durationMinutes = Math.max(1, Math.round((distanceKm / speedKmH) * 60));
    const jogDurationMinutes = Math.max(1, Math.round((distanceKm / 8.5) * 60));
    const caloriesBurned = Math.round(distanceKm * (type === 'cycle' ? 35 : 65));

    const pointsCount = Math.max(6, Math.min(25, Math.ceil(distanceKm * 6)));
    const coordinates: [number, number][] = [];

    for (let i = 0; i <= pointsCount; i++) {
      const fraction = i / pointsCount;
      const midJitter = Math.sin(fraction * Math.PI) * 0.0016 * (i % 2 === 0 ? 1 : -0.8);
      const lat = start[0] + (end[0] - start[0]) * fraction + midJitter;
      const lng = start[1] + (end[1] - start[1]) * fraction - midJitter * 0.8;
      coordinates.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
    }

    const instructions = [
      {
        instruction: `Depart origin and follow park connector network toward destination.`,
        distanceMeters: Math.round(distanceKm * 1000 * 0.3),
        durationSeconds: Math.round(durationMinutes * 60 * 0.3)
      },
      {
        instruction: `Proceed along tree-lined sheltered pathway.`,
        distanceMeters: Math.round(distanceKm * 1000 * 0.4),
        durationSeconds: Math.round(durationMinutes * 60 * 0.4)
      },
      {
        instruction: `Arrive at destination entrance.`,
        distanceMeters: Math.round(distanceKm * 1000 * 0.3),
        durationSeconds: Math.round(durationMinutes * 60 * 0.3)
      }
    ];

    setRouteResult({
      distanceKm,
      durationMinutes,
      jogDurationMinutes,
      caloriesBurned,
      routeType: type,
      coordinates,
      instructions
    });
    setIsLoadingRoute(false);
  };

  // Initial Route calculation when app loads
  useEffect(() => {
    if (userLocation && selectedDestination) {
      handleFetchRoute(
        [userLocation.lat, userLocation.lng],
        [selectedDestination.latitude, selectedDestination.longitude],
        'walk'
      );
    }
  }, []);

  const handleSelectUserLocation = (lat: number, lng: number, name?: string) => {
    const reg = determineRegionFromCoords(lat, lng);
    setUserLocation({ lat, lng, name });
    setSelectedRegion(reg);
    if (selectedDestination) {
      handleFetchRoute([lat, lng], [selectedDestination.latitude, selectedDestination.longitude], 'walk');
    }
  };

  const handleSelectDestination = (dest: ParkLocation | MallLocation) => {
    setSelectedDestination(dest);
    handleFetchRoute([userLocation.lat, userLocation.lng], [dest.latitude, dest.longitude], 'walk');
  };

  // Active region PSI
  const activeRegionPSI = psiByRegion[selectedRegion]?.psi ?? 45;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Atmospheric Real-Time Weather Effects Canvas */}
      <WeatherEffectsCanvas effect={weatherEffect} psiLevel={activeRegionPSI} />

      {/* 2. Top Bar Contract: Exactly 3 Zones */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Wordmark */}
          <button
            onClick={() => setActiveView('planner')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-cyan-900/30">
              <Footprints className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white font-['Cabinet_Grotesk'] leading-none">
                BreatheSG
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Singapore PSI & Safe Jogging
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <button
              onClick={() => setActiveView('planner')}
              className={`hover:text-white transition-colors pb-0.5 ${
                activeView === 'planner' ? 'text-cyan-400 border-b-2 border-cyan-400' : ''
              }`}
            >
              Jogging Planner
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`hover:text-white transition-colors pb-0.5 ${
                activeView === 'map' ? 'text-cyan-400 border-b-2 border-cyan-400' : ''
              }`}
            >
              Singapore Map
            </button>
            <button
              onClick={() => setActiveView('psi')}
              className={`hover:text-white transition-colors pb-0.5 ${
                activeView === 'psi' ? 'text-cyan-400 border-b-2 border-cyan-400' : ''
              }`}
            >
              Real-Time PSI
            </button>
            <button
              onClick={() => setActiveView('malls')}
              className={`hover:text-white transition-colors pb-0.5 ${
                activeView === 'malls' ? 'text-cyan-400 border-b-2 border-cyan-400' : ''
              }`}
            >
              Indoor Sanctuaries
            </button>
          </nav>

          {/* Zone 3: Actions (Weather Effect Selector + API Health Trigger) */}
          <div className="flex items-center gap-2">
            {/* Weather Effect Selector Pill */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setWeatherEffect('auto')}
                className={`p-1.5 rounded-lg text-xs transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  weatherEffect === 'auto' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Auto Weather (Derived from PSI)"
              >
                <CloudSun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeatherEffect('sunny')}
                className={`p-1.5 rounded-lg text-xs transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  weatherEffect === 'sunny' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Sunny Sunshine Effect"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeatherEffect('hazy')}
                className={`p-1.5 rounded-lg text-xs transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  weatherEffect === 'hazy' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Haze Particle Effect"
              >
                <Wind className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeatherEffect('rain')}
                className={`p-1.5 rounded-lg text-xs transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  weatherEffect === 'rain' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Tropical Rain Effect"
              >
                <CloudRain className="w-4 h-4" />
              </button>
            </div>

            {/* /api/health Button */}
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-all min-h-[38px] active:scale-95"
              title="PSI API Health Monitor (/api/health)"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">API Health</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-8 space-y-6 relative z-20">
        {/* PSI Real-Time Region Overview Card (Always accessible) */}
        <PsiStatusCards
          psiByRegion={psiByRegion}
          activeRegion={selectedRegion}
          onSelectRegion={(reg) => setSelectedRegion(reg)}
          psiThreshold={psiThreshold}
          lastUpdated={lastUpdated}
          onRefresh={fetchLivePSI}
          isRefreshing={isRefreshingPSI}
        />

        {/* View Switcher Content */}
        {activeView === 'planner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Jogging Planner Questions & Suggestions */}
            <div className="lg:col-span-7 space-y-6">
              <JoggingPlanner
                userLocation={userLocation}
                onSelectUserLocation={handleSelectUserLocation}
                parks={SINGAPORE_PARKS}
                malls={SINGAPORE_MALLS}
                selectedDestination={selectedDestination}
                onSelectDestination={handleSelectDestination}
                psiByRegion={psiByRegion}
                psiThreshold={psiThreshold}
                onUpdateThreshold={(t) => setPsiThreshold(t)}
                selectedRegion={selectedRegion}
                onSelectRegion={(r) => setSelectedRegion(r)}
                routeResult={routeResult}
                onFetchRoute={(s, e, type) => handleFetchRoute(s, e, type)}
                isLoadingRoute={isLoadingRoute}
              />
            </div>

            {/* Right Column: OneMap Live Interactive Map */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  OneMap Singapore Canvas
                </span>
                <span>Click map to relocate origin</span>
              </div>

              <div className="h-[480px] lg:h-[540px]">
                <OneMapViewer
                  userLocation={userLocation}
                  onSelectUserLocation={handleSelectUserLocation}
                  parks={SINGAPORE_PARKS}
                  malls={SINGAPORE_MALLS}
                  selectedDestination={selectedDestination}
                  onSelectDestination={handleSelectDestination}
                  psiByRegion={psiByRegion}
                  psiThreshold={psiThreshold}
                  routeResult={routeResult}
                />
              </div>

              {/* Visual Domain Cards: Park Trail vs Indoor Sanctuary */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 relative group">
                  <img
                    src={parkTrailImg}
                    alt="Singapore Outdoor Park Trail"
                    referrerPolicy="no-referrer"
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-2.5">
                    <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">Outdoor Track</div>
                    <div className="text-xs text-white font-medium truncate">Lush Singapore Greenery</div>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 relative group">
                  <img
                    src={indoorMallImg}
                    alt="Singapore Air Conditioned Mall Sanctuary"
                    referrerPolicy="no-referrer"
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-2.5">
                    <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wide">Indoor Mall</div>
                    <div className="text-xs text-white font-medium truncate">Filtered AC Corridors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Full-Screen OneMap Explorer View */}
        {activeView === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div>
                <h3 className="text-lg font-bold text-white">Full-Scale Singapore OneMap</h3>
                <p className="text-xs text-slate-400">
                  Authoritative Singapore Land Authority basemap with active park connectors and safe zones.
                </p>
              </div>
            </div>

            <div className="h-[680px]">
              <OneMapViewer
                userLocation={userLocation}
                onSelectUserLocation={handleSelectUserLocation}
                parks={SINGAPORE_PARKS}
                malls={SINGAPORE_MALLS}
                selectedDestination={selectedDestination}
                onSelectDestination={handleSelectDestination}
                psiByRegion={psiByRegion}
                psiThreshold={psiThreshold}
                routeResult={routeResult}
              />
            </div>
          </div>
        )}

        {/* Dedicated PSI Analytics View */}
        {activeView === 'psi' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-xl font-bold text-white">Singapore PSI Standards & Health Advisories</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                The Pollutant Standards Index (PSI) is computed based on 6 air pollutants: PM2.5, PM10, Sulphur Dioxide (SO2), Nitrogen Dioxide (NO2), Ozone (O3), and Carbon Monoxide (CO).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30">
                  <div className="text-emerald-400 font-bold text-sm">0 – 50: Good</div>
                  <p className="text-xs text-slate-300 mt-1">Normal outdoor activities can proceed without restriction.</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30">
                  <div className="text-amber-400 font-bold text-sm">51 – 100: Moderate</div>
                  <p className="text-xs text-slate-300 mt-1">Safe for the general population. Sensitive individuals can jog normally.</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-orange-500/30">
                  <div className="text-orange-400 font-bold text-sm">101 – 200: Unhealthy</div>
                  <p className="text-xs text-slate-300 mt-1">Reduce prolonged strenuous outdoor exercise. Switch to indoor malls.</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/30">
                  <div className="text-rose-400 font-bold text-sm">201+: Very Unhealthy</div>
                  <p className="text-xs text-slate-300 mt-1">Avoid all outdoor exertion. Remain in air-conditioned indoor spaces.</p>
                </div>
              </div>
            </div>

            {/* City Backdrop Asset */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 relative shadow-xl">
              <img
                src={skylineImg}
                alt="Singapore Skyline Weather View"
                referrerPolicy="no-referrer"
                className="w-full h-56 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-6 flex flex-col justify-end">
                <h4 className="text-lg font-bold text-white">Clean Air City Initiatives</h4>
                <p className="text-xs text-slate-300">
                  Real-time synchronization with data.gov.sg and Singapore Land Authority OneMap ensures safe jogging across Singapore.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Indoor Sanctuaries / Malls Directory View */}
        {activeView === 'malls' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-white">Singapore Indoor Walking Sanctuaries</h3>
                <p className="text-xs text-slate-400">
                  Top air-conditioned shopping malls with wide indoor walking loops to stay healthy during haze or downpours.
                </p>
              </div>
              <button
                onClick={() => setActiveView('planner')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all min-h-[44px]"
              >
                Plan Route to Nearest Mall
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SINGAPORE_MALLS.map((mall) => {
                const isSelected = selectedDestination?.id === mall.id;
                return (
                  <div
                    key={mall.id}
                    className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
                      isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/40' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase">{mall.region} Region</span>
                      <span className="text-xs text-slate-400 font-mono">Loop: {mall.indoorWalkingLoopKm} km</span>
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">{mall.name}</h4>
                    <p className="text-xs text-slate-300 mb-3">{mall.description}</p>

                    <div className="space-y-1 text-xs text-slate-400 mb-4">
                      <div><strong className="text-slate-300">MRT Access:</strong> {mall.mrtStation}</div>
                      <div><strong className="text-slate-300">Levels:</strong> {mall.levels} Floors</div>
                      <div><strong className="text-slate-300">Highlights:</strong> {mall.indoorHighlights.join(' · ')}</div>
                    </div>

                    <button
                      onClick={() => {
                        handleSelectDestination(mall);
                        setActiveView('planner');
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors min-h-[44px]"
                    >
                      Route from Origin to {mall.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* 3. Mobile Fixed Bottom Navigation Bar (Pattern 1: Fixed Bottom Tab Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 grid grid-cols-4 items-center h-16 pb-safe">
        <button
          onClick={() => setActiveView('planner')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            activeView === 'planner' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Footprints className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Planner</span>
        </button>

        <button
          onClick={() => setActiveView('map')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            activeView === 'map' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">OneMap</span>
        </button>

        <button
          onClick={() => setActiveView('psi')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            activeView === 'psi' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wind className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">PSI Index</span>
        </button>

        <button
          onClick={() => setActiveView('malls')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            activeView === 'malls' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Sanctuaries</span>
        </button>
      </nav>

      {/* 4. API Health Diagnostics Modal */}
      <ApiHealthModal isOpen={isHealthModalOpen} onClose={() => setIsHealthModalOpen(false)} />
    </div>
  );
}
