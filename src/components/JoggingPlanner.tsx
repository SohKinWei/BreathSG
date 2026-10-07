import React, { useState, useEffect } from 'react';
import {
  ParkLocation,
  MallLocation,
  RegionKey,
  RegionPSI,
  RouteResult
} from '../types';
import {
  Search,
  MapPin,
  Locate,
  Footprints,
  ShoppingBag,
  Trees,
  AlertOctagon,
  CheckCircle2,
  Sliders,
  ChevronRight,
  Flame,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { calculateDistanceKm, determineRegionFromCoords } from '../data/singaporeLocations';

interface JoggingPlannerProps {
  userLocation: { lat: number; lng: number; name?: string };
  onSelectUserLocation: (lat: number, lng: number, name?: string) => void;
  parks: ParkLocation[];
  malls: MallLocation[];
  selectedDestination: ParkLocation | MallLocation | null;
  onSelectDestination: (dest: ParkLocation | MallLocation) => void;
  psiByRegion: Record<string, RegionPSI>;
  psiThreshold: number;
  onUpdateThreshold: (threshold: number) => void;
  selectedRegion: RegionKey;
  onSelectRegion: (region: RegionKey) => void;
  routeResult: RouteResult | null;
  onFetchRoute: (start: [number, number], end: [number, number], type?: 'walk' | 'cycle' | 'drive' | 'pt') => void;
  isLoadingRoute: boolean;
}

export const JoggingPlanner: React.FC<JoggingPlannerProps> = ({
  userLocation,
  onSelectUserLocation,
  parks,
  malls,
  selectedDestination,
  onSelectDestination,
  psiByRegion,
  psiThreshold,
  onUpdateThreshold,
  selectedRegion,
  onSelectRegion,
  routeResult,
  onFetchRoute,
  isLoadingRoute
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'parks' | 'malls'>('parks');
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Current region PSI
  const currentRegionPSI = psiByRegion[selectedRegion]?.psi ?? 45;
  const isRegionUnsafe = currentRegionPSI > psiThreshold;

  // If region is unsafe, auto-switch tab to malls if user hasn't actively switched
  useEffect(() => {
    if (isRegionUnsafe) {
      setActiveTab('malls');
    }
  }, [isRegionUnsafe]);

  // Instant Client-side Location Search across Singapore Parks & Malls
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }

    const allLocations = [
      ...parks.map((p) => ({
        name: p.name,
        address: `${p.region.toUpperCase()} Region Park · ${p.surface}`,
        latitude: p.latitude,
        longitude: p.longitude,
        region: p.region
      })),
      ...malls.map((m) => ({
        name: m.name,
        address: `${m.region.toUpperCase()} Region Mall · MRT: ${m.mrtStation}`,
        latitude: m.latitude,
        longitude: m.longitude,
        region: m.region
      }))
    ];

    const matches = allLocations
      .filter((loc) => loc.name.toLowerCase().includes(q) || loc.address.toLowerCase().includes(q))
      .slice(0, 8);

    setSearchResults(matches);
  }, [searchQuery, parks, malls]);

  // Handle HTML5 Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocation not supported by this browser.');
      return;
    }
    setIsLocating(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const region = determineRegionFromCoords(latitude, longitude);
        const regName = region.charAt(0).toUpperCase() + region.slice(1);
        const addressName = `My GPS Location (${regName})`;

        onSelectUserLocation(latitude, longitude, addressName);
        onSelectRegion(region);
        setLocationNotice(`Located: Singapore ${regName} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setTimeout(() => setLocationNotice(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        setLocationNotice(`Location access: ${err.message}. Showing Singapore Central.`);
        setTimeout(() => setLocationNotice(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Sort parks by distance from current userLocation
  const sortedParks = React.useMemo(() => {
    return [...parks]
      .filter((p) => p.region === selectedRegion || !selectedRegion)
      .map((p) => ({
        ...p,
        distanceFromUser: calculateDistanceKm(userLocation.lat, userLocation.lng, p.latitude, p.longitude),
        regionPsi: psiByRegion[p.region]?.psi ?? 40
      }))
      .sort((a, b) => a.distanceFromUser - b.distanceFromUser);
  }, [parks, selectedRegion, userLocation, psiByRegion]);

  // Sort malls by distance from current userLocation
  const sortedMalls = React.useMemo(() => {
    return [...malls]
      .filter((m) => m.region === selectedRegion || !selectedRegion)
      .map((m) => ({
        ...m,
        distanceFromUser: calculateDistanceKm(userLocation.lat, userLocation.lng, m.latitude, m.longitude)
      }))
      .sort((a, b) => a.distanceFromUser - b.distanceFromUser);
  }, [malls, selectedRegion, userLocation]);

  const handleSelectParkOrMall = (dest: ParkLocation | MallLocation) => {
    onSelectDestination(dest);
    onFetchRoute([userLocation.lat, userLocation.lng], [dest.latitude, dest.longitude], 'walk');
  };

  return (
    <div className="w-full space-y-5">
      {/* 1. Location Input & Question Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-xs text-cyan-400 font-semibold tracking-wider uppercase mb-1">
              Step 1: Your Jogging Origin
            </div>
            <h3 className="text-lg font-bold text-white">Where are you starting from?</h3>
          </div>

          <button
            onClick={handleGetLocation}
            disabled={isLocating}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 rounded-xl text-xs font-semibold shadow-sm transition-all min-h-[44px] active:scale-95 disabled:opacity-50"
          >
            <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Finding GPS...' : 'Locate My Current Spot'}</span>
          </button>
        </div>

        {/* Search Input with OneMap Autocomplete */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Singapore parks, malls, or areas (e.g. Bishan, Orchard, Bedok)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all min-h-[44px]"
            />
            {isSearching && (
              <div className="absolute right-3.5 text-xs text-slate-400 font-mono">...</div>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const reg = determineRegionFromCoords(item.latitude, item.longitude);
                    onSelectUserLocation(item.latitude, item.longitude, item.name);
                    onSelectRegion(reg);
                    setSearchQuery(item.name);
                    setSearchResults([]);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-start gap-2.5 border-b border-slate-800/80 last:border-b-0 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                    <div className="text-xs text-slate-400 truncate">{item.address}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {locationNotice && (
          <div className="mt-2 text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{locationNotice}</span>
          </div>
        )}

        {/* Current Active Origin Display */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2 pt-2.5 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500 font-medium">Selected Origin:</span>
            <span className="font-semibold text-white">{userLocation.name || 'Singapore Coordinates'}</span>
            <span className="text-slate-500 font-mono tabular-nums">
              ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
            </span>
          </div>
          <div className="text-slate-400">
            Region: <span className="text-cyan-400 font-semibold capitalize">{selectedRegion}</span>
          </div>
        </div>
      </div>

      {/* 2. Safe PSI Threshold Adjuster */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
              Step 2: Safe Air Threshold
            </div>
            <h3 className="text-lg font-bold text-white">Your Personal PSI Cutoff</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Safe Limit:</span>
            <span className="font-mono font-bold text-lg text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2.5 py-0.5 rounded-lg tabular-nums">
              PSI {psiThreshold}
            </span>
          </div>
        </div>

        {/* Quick Threshold Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {[
            { value: 50, label: 'Strict (Good Only)', desc: 'Best for Asthma & Children' },
            { value: 75, label: 'Moderate Safe', desc: 'Mild Sensitivity Guard' },
            { value: 100, label: 'NEA Standard (100)', desc: 'Recommended General Cutoff' },
            { value: 130, label: 'High Exertion', desc: 'Conditioned Athletes' }
          ].map((preset) => (
            <button
              key={preset.value}
              onClick={() => onUpdateThreshold(preset.value)}
              className={`p-2.5 rounded-xl border text-left transition-all min-h-[58px] ${
                psiThreshold === preset.value
                  ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 ring-1 ring-amber-500/30'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold font-mono">PSI {preset.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{preset.label}</div>
            </button>
          ))}
        </div>

        {/* Slider Input */}
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="30"
            max="180"
            step="5"
            value={psiThreshold}
            onChange={(e) => onUpdateThreshold(Number(e.target.value))}
            className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Real-Time Recommendation Advisory */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 shadow-lg transition-all ${
          isRegionUnsafe
            ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
        }`}
      >
        <div className="flex items-start gap-3.5">
          {isRegionUnsafe ? (
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400">
              <AlertOctagon className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <h4 className="text-base font-bold text-white">
                {isRegionUnsafe ? 'Outdoor Air Quality Advisory: Above Threshold' : 'Safe for Outdoor Jogging!'}
              </h4>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded font-mono tabular-nums ${
                  isRegionUnsafe ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {selectedRegion.toUpperCase()} PSI: {currentRegionPSI} vs Safe {psiThreshold}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isRegionUnsafe ? (
                <>
                  Air pollution in the <strong className="text-white capitalize">{selectedRegion}</strong> region has exceeded your safe limit of <strong className="text-amber-300 font-mono">{psiThreshold} PSI</strong>. Strenuous outdoor running may cause throat irritation or respiratory distress.
                  <span className="block mt-1 font-semibold text-rose-300">
                    Recommendation: Stay indoors! We have automatically located the nearest air-conditioned shopping malls below for your workout or brisk walking.
                  </span>
                </>
              ) : (
                <>
                  Air quality in <strong className="text-white capitalize">{selectedRegion}</strong> is currently at <strong className="text-emerald-300 font-mono">{currentRegionPSI} PSI</strong>, well below your safe threshold of <strong className="text-emerald-300 font-mono">{psiThreshold}</strong>.
                  <span className="block mt-1 text-slate-300">
                    Perfect conditions for outdoor running! Choose from the top recommended parks below.
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Segmented Control: Outdoor Parks vs Indoor Malls */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          onClick={() => setActiveTab('parks')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'parks'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trees className="w-4 h-4" />
          <span>Outdoor Parks ({sortedParks.length})</span>
          {!isRegionUnsafe && <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />}
        </button>

        <button
          onClick={() => setActiveTab('malls')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'malls'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Indoor Malls & Sanctuaries ({sortedMalls.length})</span>
          {isRegionUnsafe && (
            <span className="text-[10px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">
              Recommended
            </span>
          )}
        </button>
      </div>

      {/* 5. Destination Suggestions List */}
      <div className="space-y-3">
        {activeTab === 'parks' ? (
          <>
            {isRegionUnsafe && (
              <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Note: While you can still view parks, the PSI ({currentRegionPSI}) is currently above your safe cutoff ({psiThreshold}).
                </span>
              </div>
            )}

            {sortedParks.map((park) => {
              const isSelected = selectedDestination?.id === park.id;
              const isSafe = park.regionPsi <= psiThreshold;

              return (
                <div
                  key={park.id}
                  className={`bg-slate-900/90 border rounded-2xl p-4 transition-all ${
                    isSelected
                      ? 'border-cyan-500 shadow-xl ring-1 ring-cyan-500/30 bg-slate-800/90'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-emerald-400 capitalize">
                          {park.region} Region
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400 font-mono tabular-nums">
                          {park.distanceFromUser.toFixed(1)} km from origin
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span
                          className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                            isSafe ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          PSI {park.regionPsi}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white mb-1">{park.name}</h4>
                      <p className="text-xs text-slate-300 mb-2.5">{park.description}</p>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300 font-medium">
                          Track: {park.trackLengthKm} km
                        </span>
                        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
                          {park.surface}
                        </span>
                        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
                          {park.lighting}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectParkOrMall(park)}
                      disabled={isLoadingRoute && isSelected}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] whitespace-nowrap ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      <span>{isSelected ? 'Route Selected' : 'Select Destination'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>
                Indoor Sanctuaries feature filtered air conditioning, wide walking corridors, and sheltered MRT connections to stay active safely away from haze.
              </span>
            </div>

            {sortedMalls.map((mall) => {
              const isSelected = selectedDestination?.id === mall.id;

              return (
                <div
                  key={mall.id}
                  className={`bg-slate-900/90 border rounded-2xl p-4 transition-all ${
                    isSelected
                      ? 'border-indigo-500 shadow-xl ring-1 ring-indigo-500/30 bg-slate-800/90'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-indigo-400 capitalize">
                          {mall.region} Mall
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400 font-mono tabular-nums">
                          {mall.distanceFromUser.toFixed(1)} km away
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-xs font-semibold text-cyan-300">
                          Air-Conditioned
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white mb-1">{mall.name}</h4>
                      <p className="text-xs text-slate-300 mb-2.5">{mall.description}</p>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300 font-medium">
                          Walking Loop: {mall.indoorWalkingLoopKm} km
                        </span>
                        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
                          {mall.levels} Levels
                        </span>
                        <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
                          MRT: {mall.mrtStation}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectParkOrMall(mall)}
                      disabled={isLoadingRoute && isSelected}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] whitespace-nowrap ${
                        isSelected
                          ? 'bg-indigo-500 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      <span>{isSelected ? 'Route Selected' : 'Route to Mall'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* 6. Active Navigation / Route Details Panel */}
      {selectedDestination && routeResult && (
        <div className="bg-slate-900 border border-cyan-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h4 className="text-base font-bold text-white">
                Navigation Route to {selectedDestination.name}
              </h4>
            </div>

            {/* Route Mode Selector: walk | cycle | drive | pt */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['walk', 'cycle', 'drive', 'pt'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onFetchRoute([userLocation.lat, userLocation.lng], [selectedDestination.latitude, selectedDestination.longitude], mode)}
                  disabled={isLoadingRoute}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors min-h-[32px] ${
                    routeResult.routeType === mode
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'pt' ? 'Transit' : mode}
                </button>
              ))}
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedDestination.latitude},${selectedDestination.longitude}&travelmode=${routeResult.routeType === 'cycle' ? 'bicycling' : routeResult.routeType === 'drive' ? 'driving' : routeResult.routeType === 'pt' ? 'transit' : 'walking'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>GPS App</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Route Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Footprints className="w-3.5 h-3.5 text-cyan-400" />
                <span>Distance</span>
              </div>
              <div className="text-lg font-bold font-mono text-white tabular-nums">
                {routeResult.distanceKm} km
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Walk Time</span>
              </div>
              <div className="text-lg font-bold font-mono text-white tabular-nums">
                {routeResult.durationMinutes} mins
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Jog Time</span>
              </div>
              <div className="text-lg font-bold font-mono text-white tabular-nums">
                {routeResult.jogDurationMinutes} mins
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Est. Burn</span>
              </div>
              <div className="text-lg font-bold font-mono text-white tabular-nums">
                ~{routeResult.caloriesBurned} kcal
              </div>
            </div>
          </div>

          {/* Turn-by-Turn Steps */}
          {routeResult.instructions && routeResult.instructions.length > 0 && (
            <div className="space-y-2 border-t border-slate-800/80 pt-3">
              <div className="text-xs font-semibold text-slate-400">Pedestrian Navigation Guidance:</div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {routeResult.instructions.map((step, idx) => (
                  <div key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/50 p-2 rounded-lg">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step.instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
