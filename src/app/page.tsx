'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lugar } from '@/types/lugar';
import { ZoneList } from '@/components/ZoneList';
import { DynamicMap } from '@/components/DynamicMap';
import { PlaceDetailModal } from '@/components/PlaceDetailModal';
import { OwnerRelocateModal } from '@/components/OwnerRelocateModal';
import { MobileOneHandedView } from '@/components/MobileOneHandedView';
import {
  PROVINCIAS_ECUADOR,
  getCantonesPorProvincia,
  getParroquiasPorCanton,
  getComunasPorFiltros,
  findNearestTownOrComuna,
  getCoordinatesForTown,
  formatDistance,
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
  Plus,
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

  // Responsive device check: Mobile (< 1024px) vs Desktop PC
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // View mode for Desktop PC: 'split' (side-by-side), 'list' (full list), or 'map' (full map)
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedPlace, setSelectedPlace] = useState<Lugar | null>(null);
  const [modalPlace, setModalPlace] = useState<Lugar | null>(null);
  const [relocatePlace, setRelocatePlace] = useState<Lugar | null>(null);

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

  // Hybrid Locality & Map Centering State
  const [activeLocality, setActiveLocality] = useState<string>('');
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [nearestTown, setNearestTown] = useState<{ pueblo: string; distanciaKm: number } | null>(null);
  const [gpsNotification, setGpsNotification] = useState<string | null>(null);

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

  // Localidades reales con conteo de negocios
  const realLocalities = useMemo(() => {
    const counts: Record<string, number> = {};
    places.forEach((p) => {
      const loc = p.zona || p.ciudad || 'Otra';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [places]);

  // Manejo de cambio de localidad con centrado suave en mapa y persistencia
  const handleSelectLocality = useCallback((localityName: string) => {
    if (!localityName) {
      setSelectedComuna('');
      setActiveLocality('');
      try {
        localStorage.removeItem('ubicame_active_locality');
      } catch (e) {}
      setTargetLocation({ lat: -1.8264, lng: -80.7521, zoom: 12.5 });
      return;
    }

    setSelectedComuna(localityName);
    setActiveLocality(localityName);
    try {
      localStorage.setItem('ubicame_active_locality', localityName);
    } catch (e) {}

    const townCoords = getCoordinatesForTown(localityName);
    if (townCoords) {
      setTargetLocation({ lat: townCoords.lat, lng: townCoords.lng, zoom: 15 });
    } else {
      const inZone = places.filter(p => (p.zona || p.comuna || p.ciudad) === localityName);
      if (inZone.length > 0) {
        const avgLat = inZone.reduce((s, p) => s + p.latitud, 0) / inZone.length;
        const avgLng = inZone.reduce((s, p) => s + p.longitud, 0) / inZone.length;
        setTargetLocation({ lat: avgLat, lng: avgLng, zoom: 15 });
      }
    }
  }, [places]);

  // Inicialización de localidad guardada y comprobación silenciosa de permisos GPS
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ubicame_active_locality');
      if (saved) {
        setSelectedComuna(saved);
        setActiveLocality(saved);
        const coords = getCoordinatesForTown(saved);
        if (coords) {
          setTargetLocation({ lat: coords.lat, lng: coords.lng, zoom: 15 });
        }
      } else {
        setTargetLocation({ lat: -1.8264, lng: -80.7521, zoom: 14 });
      }
    } catch (e) {}

    if (typeof window !== 'undefined' && navigator.permissions && navigator.geolocation) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
        if (status.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserLocation(coords);
              const nearest = findNearestTownOrComuna(coords.lat, coords.lng);
              setNearestTown(nearest);
              const saved = localStorage.getItem('ubicame_active_locality');
              if (!saved && nearest.distanciaKm <= 15) {
                setActiveLocality(nearest.pueblo);
                setSelectedComuna(nearest.pueblo);
                setTargetLocation({ lat: coords.lat, lng: coords.lng, zoom: 15.5 });
                setCercaDeMi(true);
              }
            },
            () => {},
            { enableHighAccuracy: true, timeout: 6000, maximumAge: 120000 }
          );
        }
      }).catch(() => {});
    }
  }, []);

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

      const res = await fetch(`/api/places?${params.toString()}`, { cache: 'no-store' });
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

  // Toggle "Cerca de mí" GPS tracking con auto-detección de pueblo
  const handleToggleCercaDeMi = () => {
    if (cercaDeMi) {
      setCercaDeMi(false);
      setUserLocation(null);
      setGpsNotification(null);
      if (selectedComuna) {
        const coords = getCoordinatesForTown(selectedComuna);
        if (coords) setTargetLocation({ lat: coords.lat, lng: coords.lng, zoom: 15 });
      } else {
        setTargetLocation({ lat: -1.8264, lng: -80.7521, zoom: 12.5 });
      }
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

        const nearest = findNearestTownOrComuna(coords.lat, coords.lng);
        setNearestTown(nearest);

        if (nearest.distanciaKm <= 20) {
          setActiveLocality(nearest.pueblo);
          setSelectedComuna(nearest.pueblo);
          setTargetLocation({ lat: coords.lat, lng: coords.lng, zoom: 15.5 });
          setGpsNotification(`📍 Estás en ${nearest.pueblo} (${formatDistance(nearest.distanciaKm)})`);
        } else {
          setTargetLocation({ lat: coords.lat, lng: coords.lng, zoom: 12.5 });
          setGpsNotification(`📍 Tu GPS detecta ${nearest.pueblo} (a ${nearest.distanciaKm} km). Mostrando lugares cercanos.`);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Error obteniendo geolocalización:', err);
        if (err.code === 1) {
          setGeoError('Permiso de GPS denegado. Puedes elegir tu pueblo en la lista arriba.');
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
    setSelectedPlace({ ...place });
    if (!isMobile) {
      if (viewMode === 'list') {
        setViewMode('split');
      }
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
    setActiveLocality('');
    setOnlyUbicameCc(false);
    setCercaDeMi(false);
    setUserLocation(null);
    setSearchQuery('');
    setGpsNotification(null);
    try {
      localStorage.removeItem('ubicame_active_locality');
    } catch (e) {}
    setTargetLocation({ lat: -1.8264, lng: -80.7521, zoom: 12.5 });
  };

  return (
    <div className="h-[100dvh] lg:min-h-screen lg:h-auto bg-[#050811] text-slate-100 flex flex-col selection:bg-cyan-500/30 overflow-hidden lg:overflow-visible">
      {/* Detail Modal (Adaptado como Bottom Sheet en móvil) */}
      {modalPlace && (
        <PlaceDetailModal
          place={modalPlace}
          onClose={() => setModalPlace(null)}
          onViewOnMap={handleViewOnMap}
          onRelocate={(p) => setRelocatePlace(p)}
          onPlaceUpdated={(updated) => {
            setPlaces((prev) =>
              prev.map((p) => (p.id_slug === updated.id_slug ? updated : p))
            );
            if (selectedPlace?.id_slug === updated.id_slug) {
              setSelectedPlace(updated);
            }
            if (modalPlace?.id_slug === updated.id_slug) {
              setModalPlace(updated);
            }
          }}
        />
      )}

      {/* Owner Relocate Modal (Opción 2 - Precisión Satelital) */}
      {relocatePlace && (
        <OwnerRelocateModal
          place={relocatePlace}
          isOpen={Boolean(relocatePlace)}
          onClose={() => setRelocatePlace(null)}
          onSaved={(updated) => {
            setPlaces((prev) =>
              prev.map((p) => (p.id_slug === updated.id_slug ? updated : p))
            );
            if (selectedPlace?.id_slug === updated.id_slug) {
              setSelectedPlace(updated);
            }
            if (modalPlace?.id_slug === updated.id_slug) {
              setModalPlace(updated);
            }
          }}
        />
      )}

      {/* Responsive Header: Compacto en Móvil, Completo en Desktop */}
      <header className="sticky top-0 z-40 bg-[#050811]/95 backdrop-blur-md border-b border-slate-800/80 shrink-0">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <MapPin size={17} className="text-white" />
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

          {/* Desktop View Switcher (Solo visible en PC) */}
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href="/agregar"
              className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all shrink-0"
              title="Registrar mi negocio en 15 segundos"
            >
              <Plus size={13} className="stroke-[3]" />
              <span className="hidden sm:inline">Agregar Negocio</span>
              <span className="sm:hidden font-bold">+ Negocio</span>
            </a>

            <a
              href="/admin/lugares"
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors shrink-0"
              title="Panel Super Administrador"
            >
              <Shield size={12} />
              <span className="hidden sm:inline">Admin</span>
            </a>

            <a
              href="https://ubicame.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors shadow-sm shrink-0"
              title="Ir a ubicame.cc para ver cartas digitales y menús"
            >
              <span>ubicame.cc</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      {/* ========================================================
          EXPERIENCIA MÓVIL (OPCIÓN 1: GOOGLE MAPS / AIRBNB)
          Manejo con una sola mano: Mapa inmersivo + Carrusel swipe horizontal + Dock al pulgar
          ======================================================== */}
      {isMobile ? (
        <div className="relative flex-1 w-full min-h-0 overflow-hidden">
          {/* 1. Mapa interactivo completo de fondo */}
          <div className="absolute inset-0 z-0">
            <DynamicMap
              lugares={places}
              selectedPlace={selectedPlace}
              onSelectPlace={(place) => {
                setSelectedPlace({ ...place });
              }}
              onClearSelection={() => setSelectedPlace(null)}
              userLocation={userLocation}
              targetLocation={targetLocation}
            />
          </div>

          {/* 2. Experiencia Móvil al alcance del pulgar (Carrusel horizontal + Dock inferior) */}
          <MobileOneHandedView
            places={places}
            selectedPlace={selectedPlace}
            onSelectPlace={(place) => {
              setSelectedPlace({ ...place });
            }}
            onOpenDetail={handleSelectPlace}
            onViewOnMap={handleViewOnMap}
            onClearSelectedPlace={() => setSelectedPlace(null)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            cercaDeMi={cercaDeMi}
            isLocating={isLocating}
            onToggleCercaDeMi={handleToggleCercaDeMi}
            userLocation={userLocation}
            selectedProvincia={selectedProvincia}
            setSelectedProvincia={setSelectedProvincia}
            selectedCanton={selectedCanton}
            setSelectedCanton={setSelectedCanton}
            selectedParroquia={selectedParroquia}
            setSelectedParroquia={setSelectedParroquia}
            selectedComuna={selectedComuna}
            setSelectedComuna={setSelectedComuna}
            availableCantones={availableCantones}
            availableParroquias={availableParroquias}
            availableComunas={availableComunas}
            provincias={PROVINCIAS_ECUADOR}
            onlyUbicameCc={onlyUbicameCc}
            setOnlyUbicameCc={setOnlyUbicameCc}
            clearAllFilters={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
            totalClients={totalClients}
            activeLocality={activeLocality}
            onSelectLocality={handleSelectLocality}
            nearestTown={nearestTown}
            realLocalities={realLocalities}
            gpsNotification={gpsNotification}
            onClearGpsNotification={() => setGpsNotification(null)}
          />
        </div>
      ) : (
        /* ========================================================
            EXPERIENCIA DESKTOP (PC): PANTALLA ANCHA Y VISTA DIVIDIDA
            ======================================================== */
        <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4 pb-12 space-y-4">
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

            {/* Selector de Localidad Rápido Desktop */}
            <div className="relative flex-shrink-0">
              <select
                value={selectedComuna}
                onChange={(e) => handleSelectLocality(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 rounded-xl py-2.5 px-3 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-inner transition-colors"
                title="Centrar mapa en localidad"
              >
                <option value="">🗺️ Toda la Costa ({places.length})</option>
                {realLocalities.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    📍 {loc.name} ({loc.count})
                  </option>
                ))}
              </select>
            </div>

            {/* "Cerca de mí" GPS Locator Button */}
            <button
              onClick={handleToggleCercaDeMi}
              disabled={isLocating}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex-shrink-0 ${
                cercaDeMi
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20 border border-emerald-400'
                  : 'bg-slate-900 text-cyan-400 border border-cyan-500/40 hover:bg-slate-800'
              }`}
              title="Ordenar negocios por proximidad exacta a tu GPS"
            >
              {isLocating ? (
                <>
                  <Loader2 size={15} className="animate-spin text-cyan-300" />
                  <span>Localizando...</span>
                </>
              ) : cercaDeMi ? (
                <>
                  <Navigation size={14} className="rotate-45 text-white" />
                  <span>Cerca de mí</span>
                  <Check size={13} className="text-white" />
                </>
              ) : (
                <>
                  <Compass size={15} />
                  <span>Cerca de mí</span>
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

          {/* Active Territorial Filter Banner (Desktop) */}
          {(selectedProvincia || selectedCanton || selectedParroquia || selectedComuna) && (
            <div className="p-2 px-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2 truncate">
                <MapPin size={13} className="text-cyan-400 shrink-0" />
                <span className="text-slate-400 text-[11px]">Zona territorial activa:</span>
                <span className="font-bold text-white truncate">
                  {[selectedComuna, selectedParroquia, selectedCanton, selectedProvincia].filter(Boolean).join(' › ')}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedProvincia('');
                  setSelectedCanton('');
                  setSelectedParroquia('');
                  setSelectedComuna('');
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer shrink-0"
              >
                Restablecer territorio
              </button>
            </div>
          )}

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

          {/* 4-LEVEL TERRITORIAL SELECTORS: 4 columns on PC */}
          {showGeoFilterBar && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-slate-900/90 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
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

              <div className="grid grid-cols-4 gap-3">
                {/* 1. Provincia */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pr-7 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate"
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
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pr-7 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate"
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
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pr-7 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate"
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
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <Home size={11} className="text-emerald-400 flex-shrink-0" />
                    <span>4. Comuna / Zona</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedComuna}
                      onChange={(e) => setSelectedComuna(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pr-7 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate"
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

          {/* Quick Selection Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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

          {/* Metrics */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div>
              Mostrando <strong className="text-white font-bold">{places.length}</strong> lugares
              {totalClients > 0 && (
                <span className="text-amber-400 ml-1 font-semibold">
                  • {totalClients} en ubicame.cc
                </span>
              )}
              {(selectedComuna || selectedParroquia || selectedCanton || selectedProvincia) && (
                <span className="text-cyan-400 ml-1 font-medium">
                  • {[selectedProvincia, selectedCanton, selectedParroquia, selectedComuna].filter(Boolean).join(' › ')}
                </span>
              )}
            </div>

            <div className="text-slate-500 text-[11px]">
              {viewMode === 'split' ? 'Vista PC Dividida' : viewMode === 'list' ? 'Vista Lista' : 'Vista Mapa'}
            </div>
          </div>

          {/* Desktop Content Views */}
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-9 h-9 text-cyan-400 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-medium">Cargando directorio de negocios de Ecuador...</p>
            </div>
          ) : viewMode === 'split' ? (
            /* Desktop Split View: List on Left + Sticky Map on Right */
            <div className="flex items-start gap-5">
              <div className="w-[52%]">
                <ZoneList
                  lugares={places}
                  onSelectPlace={handleSelectPlace}
                  onViewOnMap={handleViewOnMap}
                  isSplitView={true}
                />
              </div>

              <div className="w-[48%] sticky top-20 h-[calc(100vh-110px)] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/50">
                <DynamicMap
                  lugares={places}
                  selectedPlace={selectedPlace}
                  onSelectPlace={handleSelectPlace}
                  onClearSelection={() => setSelectedPlace(null)}
                  userLocation={userLocation}
                  targetLocation={targetLocation}
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
                onClearSelection={() => setSelectedPlace(null)}
                userLocation={userLocation}
                targetLocation={targetLocation}
              />
            </div>
          )}
        </main>
      )}
    </div>
  );
}
