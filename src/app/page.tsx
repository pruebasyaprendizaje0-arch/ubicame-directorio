'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lugar } from '@/types/lugar';
import { ZoneList } from '@/components/ZoneList';
import { DynamicMap } from '@/components/DynamicMap';
import { PlaceDetailModal } from '@/components/PlaceDetailModal';
import {
  PROVINCIAS_ECUADOR,
  getCantonesPorProvincia,
  getParroquiasPorCanton,
  getComunasPorFiltros,
} from '@/lib/geo';
import {
  MapPin,
  Search,
  X,
  Map as MapIcon,
  List as ListIcon,
  Columns as ColumnsIcon,
  Sparkles,
  ExternalLink,
  Navigation,
  Compass,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  Check,
  Building,
  Landmark,
  Home,
  Shield,
  Layers,
} from 'lucide-react';

export default function DirectoryPage() {
  const [places, setPlaces] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: 'split' (side-by-side on desktop), 'list' (full list), or 'map' (full map)
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedPlace, setSelectedPlace] = useState<Lugar | null>(null);
  const [modalPlace, setModalPlace] = useState<Lugar | null>(null);

  // Search & 4-Level Territorial Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvincia, setSelectedProvincia] = useState<string>('');
  const [selectedCanton, setSelectedCanton] = useState<string>('');
  const [selectedParroquia, setSelectedParroquia] = useState<string>('');
  const [selectedComuna, setSelectedComuna] = useState<string>('');
  const [onlyUbicameCc, setOnlyUbicameCc] = useState(false);
  const [showGeoFilterBar, setShowGeoFilterBar] = useState(true);

  // "Cerca de mí" Geolocation State
  const [cercaDeMi, setCercaDeMi] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Cascading territorial options
  const availableCantones = useMemo(() => {
    return getCantonesPorProvincia(selectedProvincia || undefined);
  }, [selectedProvincia]);

  const availableParroquias = useMemo(() => {
    return getParroquiasPorCanton(selectedProvincia || undefined, selectedCanton || undefined);
  }, [selectedProvincia, selectedCanton]);

  const availableComunas = useMemo(() => {
    return getComunasPorFiltros(
      selectedProvincia || undefined,
      selectedCanton || undefined,
      selectedParroquia || undefined
    );
  }, [selectedProvincia, selectedCanton, selectedParroquia]);

  // Fetch data
  const loadPlaces = useCallback(async () => {
    setLoading(true);
    setGeoError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedProvincia) params.set('provincia', selectedProvincia);
      if (selectedCanton) params.set('canton', selectedCanton);
      if (selectedParroquia) params.set('parroquia', selectedParroquia);
      if (selectedComuna) params.set('zona', selectedComuna);
      if (onlyUbicameCc) params.set('solo_ubicame_cc', 'true');

      if (cercaDeMi && userLocation) {
        params.set('cerca_de_mi', 'true');
        params.set('user_lat', userLocation.lat.toString());
        params.set('user_lng', userLocation.lng.toString());
      }

      const res = await fetch(`/api/places?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPlaces(json.data);
      }
    } catch (err) {
      console.error('Error fetching places:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedProvincia, selectedCanton, selectedParroquia, selectedComuna, onlyUbicameCc, cercaDeMi, userLocation]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  // Toggle "Cerca de mí" GPS tracking
  const handleToggleCercaDeMi = () => {
    if (cercaDeMi) {
      setCercaDeMi(false);
      setUserLocation(null);
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Tu dispositivo no soporta geolocalización GPS.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setCercaDeMi(true);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Error obteniendo geolocalización:', err);
        if (err.code === 1) {
          setGeoError('Permiso de GPS denegado. Habilita la ubicación en tu navegador.');
        } else {
          setGeoError('No se pudo obtener tu ubicación GPS actual.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Center on map and pan
  const handleViewOnMap = (place: Lugar) => {
    setSelectedPlace(place);
    // On mobile or small screens, switch to full map view so user sees it
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('map');
    }
  };

  const handleSelectPlace = (place: Lugar) => {
    setModalPlace(place);
  };

  const totalClients = useMemo(() => {
    return places.filter(p => p.prioridad === 1 || p.origen === 'ubicame_cc').length;
  }, [places]);

  const hasActiveFilters = Boolean(
    selectedProvincia || selectedCanton || selectedParroquia || selectedComuna || onlyUbicameCc || cercaDeMi || searchQuery
  );

  const clearAllFilters = () => {
    setSelectedProvincia('');
    setSelectedCanton('');
    setSelectedParroquia('');
    setSelectedComuna('');
    setOnlyUbicameCc(false);
    setCercaDeMi(false);
    setUserLocation(null);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Detail Modal */}
      {modalPlace && (
        <PlaceDetailModal
          place={modalPlace}
          onClose={() => setModalPlace(null)}
          onViewOnMap={handleViewOnMap}
        />
      )}

      {/* Responsive Header for Mobile & Desktop */}
      <header className="sticky top-0 z-40 bg-[#050811]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <MapPin size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-none">
                  ubicame<span className="text-cyan-400">.info</span>
                </h1>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  DIRECTORIO
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                Ecuador • 24 Provincias • Negocios & Puntos Clave
              </p>
            </div>
          </div>

          {/* Desktop View Switcher: Dividido | Lista | Mapa */}
          <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista dividida: Lista y Mapa lado a lado en PC"
            >
              <ColumnsIcon size={14} />
              <span>Dividido</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista en cuadrícula completa"
            >
              <ListIcon size={14} />
              <span>Solo Lista</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista mapa interactivo completo"
            >
              <MapIcon size={14} />
              <span>Solo Mapa</span>
            </button>
          </div>

          {/* Right Navigation / External Links */}
          <div className="flex items-center gap-2">
            <a
              href="/admin/lugares"
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors"
              title="Panel Super Administrador"
            >
              <Shield size={12} />
              <span className="hidden sm:inline">Admin</span>
            </a>

            <a
              href="https://ubicame.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors shadow-sm"
              title="Ir a ubicame.cc para ver cartas digitales y menús"
            >
              <span>ubicame.cc</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-4 pb-28 lg:pb-8 space-y-4">
        {/* Top Search & Location Actions Bar */}
        <div className="flex items-center gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input
              type="text"
              placeholder="Buscar negocio, comuna, cantón o provincia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-9 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* "Cerca de mí" GPS Locator Button */}
          <button
            onClick={handleToggleCercaDeMi}
            disabled={isLocating}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex-shrink-0 ${
              cercaDeMi
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20 border border-emerald-400'
                : 'bg-slate-900 text-cyan-400 border border-cyan-500/40 hover:bg-slate-800'
            }`}
            title="Ordenar negocios por proximidad exacta a tu GPS"
          >
            {isLocating ? (
              <>
                <Loader2 size={15} className="animate-spin text-cyan-300" />
                <span className="hidden sm:inline">Localizando...</span>
              </>
            ) : cercaDeMi ? (
              <>
                <Navigation size={14} className="rotate-45 text-white" />
                <span className="hidden sm:inline">Cerca de mí</span>
                <span className="sm:hidden">Cerca</span>
                <Check size={13} className="text-white" />
              </>
            ) : (
              <>
                <Compass size={15} />
                <span className="hidden sm:inline">Cerca de mí</span>
                <span className="sm:hidden">Cerca</span>
              </>
            )}
          </button>

          {/* Toggle Territorial Filter Bar */}
          <button
            onClick={() => setShowGeoFilterBar(!showGeoFilterBar)}
            className={`p-2.5 rounded-xl border text-xs font-medium transition-colors flex-shrink-0 cursor-pointer ${
              showGeoFilterBar
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Mostrar/Ocultar selectores por Provincia, Cantón, Parroquia y Comuna"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* GPS Notifications */}
        {geoError && (
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2 animate-fade-in">
            <span>{geoError}</span>
            <button onClick={() => setGeoError(null)} className="text-amber-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {cercaDeMi && userLocation && (
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                <strong>GPS Activo:</strong> Negocios y puntos clave ordenados por distancia desde tu posición actual.
              </span>
            </div>
            <button
              onClick={handleToggleCercaDeMi}
              className="text-xs text-slate-400 hover:text-white underline font-semibold cursor-pointer"
            >
              Desactivar
            </button>
          </div>
        )}

        {/* 4-LEVEL TERRITORIAL SELECTORS: Compact 2x2 grid on mobile, 4 columns on PC */}
        {showGeoFilterBar && (
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-slate-900/90 border border-slate-800 shadow-xl space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-[11px] sm:text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} />
                <span>División Territorial de Ecuador (4 Niveles)</span>
              </span>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
            </div>

            {/* Grid 2 cols on mobile, 4 cols on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* 1. Provincia */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Landmark size={11} className="text-indigo-400 flex-shrink-0" />
                  <span>1. Provincia</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedProvincia}
                    onChange={(e) => {
                      setSelectedProvincia(e.target.value);
                      setSelectedCanton('');
                      setSelectedParroquia('');
                      setSelectedComuna('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 sm:py-2 px-2.5 sm:px-3 pr-7 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate"
                  >
                    <option value="">Todas ({PROVINCIAS_ECUADOR.length})</option>
                    {PROVINCIAS_ECUADOR.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={13} />
                </div>
              </div>

              {/* 2. Cantón */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Building size={11} className="text-cyan-400 flex-shrink-0" />
                  <span>2. Cantón</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCanton}
                    onChange={(e) => {
                      setSelectedCanton(e.target.value);
                      setSelectedParroquia('');
                      setSelectedComuna('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 sm:py-2 px-2.5 sm:px-3 pr-7 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate"
                  >
                    <option value="">Todos los Cantones</option>
                    {availableCantones.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={13} />
                </div>
              </div>

              {/* 3. Parroquia */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin size={11} className="text-purple-400 flex-shrink-0" />
                  <span>3. Parroquia</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedParroquia}
                    onChange={(e) => {
                      setSelectedParroquia(e.target.value);
                      setSelectedComuna('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 sm:py-2 px-2.5 sm:px-3 pr-7 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate"
                  >
                    <option value="">Todas las Parroquias</option>
                    {availableParroquias.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={13} />
                </div>
              </div>

              {/* 4. Comuna o Localidad */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Home size={11} className="text-emerald-400 flex-shrink-0" />
                  <span>4. Comuna / Zona</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedComuna}
                    onChange={(e) => setSelectedComuna(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 sm:py-2 px-2.5 sm:px-3 pr-7 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate"
                  >
                    <option value="">Todas las Comunas</option>
                    {availableComunas.map((comuna) => (
                      <option key={comuna} value={comuna}>{comuna}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={13} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Selection Pills Bar (Touch Swipe on Mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedComuna('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
              selectedComuna === ''
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            Todas las localidades
          </button>

          {/* Toggle ubicame.cc clients */}
          <button
            onClick={() => setOnlyUbicameCc(!onlyUbicameCc)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 cursor-pointer ${
              onlyUbicameCc
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <Sparkles size={12} />
            <span>Destacados ubicame.cc</span>
          </button>

          {availableComunas.slice(0, 12).map((comuna) => (
            <button
              key={comuna}
              onClick={() => setSelectedComuna(selectedComuna === comuna ? '' : comuna)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                selectedComuna === comuna
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {comuna}
            </button>
          ))}
        </div>

        {/* Result Metrics and Active Filter Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div>
            Mostrando <strong className="text-white font-bold">{places.length}</strong> lugares
            {totalClients > 0 && (
              <span className="text-amber-400 ml-1 font-semibold">
                • {totalClients} en ubicame.cc
              </span>
            )}
            {(selectedComuna || selectedParroquia || selectedCanton || selectedProvincia) && (
              <span className="text-cyan-400 ml-1 font-medium hidden sm:inline">
                • {[selectedProvincia, selectedCanton, selectedParroquia, selectedComuna].filter(Boolean).join(' › ')}
              </span>
            )}
          </div>

          <div className="text-slate-500 text-[11px]">
            <span className="hidden lg:inline">
              {viewMode === 'split' ? 'Vista PC Dividida' : viewMode === 'list' ? 'Vista Lista' : 'Vista Mapa'}
            </span>
            <span className="lg:hidden">
              {viewMode === 'map' ? 'Vista Mapa' : 'Vista Lista'}
            </span>
          </div>
        </div>

        {/* Content Area: Adaptive for Mobile and Desktop PC */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-9 h-9 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-medium">Cargando directorio de negocios de Ecuador...</p>
          </div>
        ) : viewMode === 'split' ? (
          /* Desktop Split View: List on Left + Sticky Map on Right */
          <div className="flex flex-col lg:flex-row items-start gap-5">
            {/* Left Column: Scrollable List of Places */}
            <div className="w-full lg:w-[54%] xl:w-[52%]">
              <ZoneList
                lugares={places}
                onSelectPlace={handleSelectPlace}
                onViewOnMap={handleViewOnMap}
                isSplitView={true}
              />
            </div>

            {/* Right Column: Sticky Interactive Leaflet Map (PC only) */}
            <div className="hidden lg:block lg:w-[46%] xl:w-[48%] sticky top-20 h-[calc(100vh-110px)] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/50">
              <DynamicMap
                lugares={places}
                selectedPlace={selectedPlace}
                onSelectPlace={handleSelectPlace}
                userLocation={userLocation}
              />
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* Full Width List View */
          <div className="w-full">
            <ZoneList
              lugares={places}
              onSelectPlace={handleSelectPlace}
              onViewOnMap={handleViewOnMap}
              isSplitView={false}
            />
          </div>
        ) : (
          /* Full Width Map View */
          <div className="w-full h-[76vh] min-h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <DynamicMap
              lugares={places}
              selectedPlace={selectedPlace}
              onSelectPlace={handleSelectPlace}
              userLocation={userLocation}
            />
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile / Small Screens */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => {
            // On mobile, toggle between list and map
            setViewMode(viewMode === 'map' ? 'list' : 'map');
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30 border border-cyan-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
        >
          {viewMode === 'map' ? (
            <>
              <ListIcon size={16} />
              <span>Ver en lista</span>
            </>
          ) : (
            <>
              <MapIcon size={16} />
              <span>Ver en mapa</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
