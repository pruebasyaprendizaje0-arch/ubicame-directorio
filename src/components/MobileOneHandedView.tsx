'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Lugar } from '@/types/lugar';
import { PlaceCard } from '@/components/PlaceCard';
import { formatDistance } from '@/lib/geo';
import { getPlaceActionConfig } from '@/lib/placeActions';
import { getCategoryStyle, getCategoryCoverBanner } from '@/lib/categoryStyles';
import {
  Search,
  X,
  Compass,
  Navigation,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  ExternalLink,
  MessageCircle,
  Loader2,
  Building,
  Landmark,
  Home,
  Layers,
  Map as MapIcon,
  List as ListIcon,
  UtensilsCrossed,
  ShoppingBag,
  Wrench,
  Calendar,
  BedDouble,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Flame,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export interface MobileOneHandedViewProps {
  places: Lugar[];
  selectedPlace: Lugar | null;
  onSelectPlace: (place: Lugar) => void;
  onOpenDetail?: (place: Lugar) => void;
  onViewOnMap: (place: Lugar) => void;
  onClearSelectedPlace: () => void;
  // Search & GPS
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cercaDeMi: boolean;
  isLocating: boolean;
  onToggleCercaDeMi: () => void;
  userLocation: { lat: number; lng: number } | null;
  // 4-level filters
  selectedProvincia: string;
  setSelectedProvincia: (p: string) => void;
  selectedCanton: string;
  setSelectedCanton: (c: string) => void;
  selectedParroquia: string;
  setSelectedParroquia: (p: string) => void;
  selectedComuna: string;
  setSelectedComuna: (c: string) => void;
  availableCantones: string[];
  availableParroquias: string[];
  availableComunas: string[];
  provincias: string[];
  onlyUbicameCc: boolean;
  setOnlyUbicameCc: (b: boolean) => void;
  soloPromos?: boolean;
  setSoloPromos?: (b: boolean) => void;
  totalPromos?: number;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  totalClients: number;
  // Hybrid Locality Props
  activeLocality?: string;
  onSelectLocality?: (loc: string) => void;
  nearestTown?: { pueblo: string; distanciaKm: number } | null;
  realLocalities?: Array<{ name: string; count: number }>;
  gpsNotification?: string | null;
  onClearGpsNotification?: () => void;
}

export const MobileOneHandedView: React.FC<MobileOneHandedViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onOpenDetail,
  onViewOnMap,
  onClearSelectedPlace,
  searchQuery,
  setSearchQuery,
  cercaDeMi,
  isLocating,
  onToggleCercaDeMi,
  userLocation,
  selectedProvincia,
  setSelectedProvincia,
  selectedCanton,
  setSelectedCanton,
  selectedParroquia,
  setSelectedParroquia,
  selectedComuna,
  setSelectedComuna,
  availableCantones,
  availableParroquias,
  availableComunas,
  provincias,
  onlyUbicameCc,
  setOnlyUbicameCc,
  soloPromos = false,
  setSoloPromos,
  totalPromos = 0,
  clearAllFilters,
  hasActiveFilters,
  totalClients,
  activeLocality = '',
  onSelectLocality,
  nearestTown,
  realLocalities = [],
  gpsNotification,
  onClearGpsNotification,
}) => {
  // Mobile Display Mode: 'map' (interactive map + thumb carousel) or 'list' (full vertical feed)
  const [mobileMode, setMobileMode] = useState<'map' | 'list'>('map');

  // Bottom Thumb Drawers
  const [activeDrawer, setActiveDrawer] = useState<'search' | 'filters' | null>(null);

  // Modal selector de localidad híbrida (GPS o manual)
  const [showLocalityModal, setShowLocalityModal] = useState(false);

  // Active Card Index in Carousel
  const [activeIndex, setActiveIndex] = useState(0);

  // Estados para la Barra de Herramientas Vertical Flotante (Opción 1: Toggles directos On/Off)
  const [showRadar, setShowRadar] = useState(false); // Inicia colapsado para mantener el mapa despejado
  const [showCarousel, setShowCarousel] = useState(true); // Fichas inferiores On/Off
  const [showTopBar, setShowTopBar] = useState(true); // Píldoras territoriales superiores On/Off
  const [isZenMode, setIsZenMode] = useState(false); // Modo Mapa Completo / Zen On/Off

  // Si se activa el filtro rápido de promociones, desplegar automáticamente el radar
  useEffect(() => {
    if (soloPromos) {
      setShowRadar(true);
    }
  }, [soloPromos]);

  // Negocios con promociones o eventos activos
  const placesWithPromos = useMemo(() => {
    return places.filter((p) => p.tiene_promo && p.campana_destacada);
  }, [places]);

  // Carousel ref and touch tracking
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isTouchingRef = useRef(false);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync activeIndex with selectedPlace ONLY when changed from map pin click (not from carousel swipe)
  useEffect(() => {
    if (!selectedPlace) return;
    // Si el usuario selecciona un pin en el mapa, asegurar que el carrusel sea visible
    if (!showCarousel && !isZenMode) {
      setShowCarousel(true);
    }
    const foundIdx = places.findIndex((p) => p.id_slug === selectedPlace.id_slug);
    if (foundIdx >= 0) {
      setActiveIndex(foundIdx);
      // Only scroll into view if the user is NOT actively touching or flinging the carousel
      if (!isUserScrollingRef.current && !isTouchingRef.current && carouselRef.current) {
        const cardEl = cardRefs.current.get(selectedPlace.id_slug);
        if (cardEl) {
          cardEl.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
          });
        }
      }
    }
  }, [selectedPlace, places]);

  // Ultra-fluid Debounced Carousel Scroll: Allows free momentum flinging without stutter
  const handleScroll = useCallback(() => {
    isUserScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const container = carouselRef.current;
    if (!container || places.length === 0) return;

    // Fast calculation of closest card to update counter pill in real-time
    const centerPoint = container.scrollLeft + container.clientWidth / 2;
    let closestIdx = 0;
    let minDiff = Infinity;

    places.forEach((p, idx) => {
      const cardEl = cardRefs.current.get(p.id_slug);
      if (cardEl) {
        const cardCenter = cardEl.offsetLeft + cardEl.clientWidth / 2;
        const diff = Math.abs(cardCenter - centerPoint);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      }
    });

    setActiveIndex(closestIdx);

    // Only after the user stops scrolling completely (350ms silence)
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      const targetPlace = places[closestIdx];
      if (targetPlace && targetPlace.id_slug !== selectedPlace?.id_slug) {
        onSelectPlace(targetPlace);
      }
    }, 350);
  }, [places, selectedPlace, onSelectPlace]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Quick navigation helpers to previous or next card
  const handlePrevCard = () => {
    if (activeIndex > 0) {
      const nextIdx = activeIndex - 1;
      const target = places[nextIdx];
      if (target) {
        setActiveIndex(nextIdx);
        onSelectPlace(target);
        onViewOnMap(target);
        const cardEl = cardRefs.current.get(target.id_slug);
        if (cardEl) {
          cardEl.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
          });
        }
      }
    }
  };

  const handleNextCard = () => {
    if (activeIndex < places.length - 1) {
      const nextIdx = activeIndex + 1;
      const target = places[nextIdx];
      if (target) {
        setActiveIndex(nextIdx);
        onSelectPlace(target);
        onViewOnMap(target);
        const cardEl = cardRefs.current.get(target.id_slug);
        if (cardEl) {
          cardEl.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
          });
        }
      }
    }
  };

  const hasTerritorialFilter = Boolean(
    selectedProvincia || selectedCanton || selectedParroquia || selectedComuna
  );

  const clearTerritorialFilters = () => {
    setSelectedProvincia('');
    setSelectedCanton('');
    setSelectedParroquia('');
    setSelectedComuna('');
  };

  const renderActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'booking':
        return <BedDouble size={13} className="shrink-0" />;
      case 'appointments':
        return <Calendar size={13} className="shrink-0" />;
      case 'service':
        return <Wrench size={13} className="shrink-0" />;
      case 'catalog':
        return <ShoppingBag size={13} className="shrink-0" />;
      case 'menu':
      default:
        return <UtensilsCrossed size={13} className="shrink-0" />;
    }
  };

  return (
    <>
      {/* ========================================================
          1. TOP FLOATING BAR: Chips de Comuna & Resumen (No invasiva)
          ======================================================== */}
      {/* ========================================================
          1. TOP FLOATING BAR & RADAR DE PROMOS
          Despejado por defecto; interactivo con la barra vertical
          ======================================================== */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-30 pointer-events-none flex flex-col gap-1.5">
        {showTopBar && !isZenMode && (
          <div className="flex flex-col gap-1.5 animate-fade-in">
            {/* Banner de filtro territorial activo si existe */}
            {hasTerritorialFilter && (
              <div className="pointer-events-auto p-1.5 px-3 rounded-xl bg-cyan-950/90 border border-cyan-500/40 backdrop-blur-md shadow-lg text-[11px] text-cyan-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin size={12} className="text-cyan-400 shrink-0" />
                  <span className="font-bold text-white truncate text-[10.5px]">
                    {[selectedComuna, selectedParroquia, selectedCanton, selectedProvincia].filter(Boolean).join(' › ')}
                  </span>
                </div>
                <button
                  onClick={clearTerritorialFilters}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline shrink-0 cursor-pointer"
                >
                  Restablecer
                </button>
              </div>
            )}

            {/* Banner de notificación GPS activa si existe */}
            {gpsNotification && (
              <div className="pointer-events-auto p-1.5 px-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md shadow-lg text-[11px] text-emerald-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="font-bold text-white truncate text-[10.5px]">
                    {gpsNotification}
                  </span>
                </div>
                {onClearGpsNotification && (
                  <button
                    onClick={onClearGpsNotification}
                    className="text-slate-400 hover:text-white shrink-0 p-0.5 cursor-pointer"
                    title="Cerrar notificación"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Fila de píldoras rápidas con selector de localidad híbrida al pulgar */}
            <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {/* Botón Selector de Localidad Híbrido */}
              <button
                onClick={() => setShowLocalityModal(true)}
                className="px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap transition-all shadow-md backdrop-blur-md border flex items-center gap-1.5 cursor-pointer active:scale-95 bg-slate-900/95 text-cyan-300 border-cyan-500/60 hover:bg-slate-800 ring-1 ring-cyan-500/20"
              >
                {cercaDeMi && nearestTown && nearestTown.distanciaKm <= 20 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-emerald-300 font-extrabold truncate max-w-[130px]">
                      Cerca de {nearestTown.pueblo}
                    </span>
                  </>
                ) : selectedComuna ? (
                  <>
                    <MapPin size={12} className="text-cyan-400 shrink-0" />
                    <span className="truncate max-w-[130px]">{selectedComuna}</span>
                  </>
                ) : (
                  <>
                    <MapPin size={12} className="text-cyan-400 shrink-0" />
                    <span>Toda la Costa</span>
                  </>
                )}
                <ChevronDown size={12} className="text-cyan-400/80 stroke-[2.5] shrink-0" />
              </button>

              <button
                onClick={() => {
                  setSelectedComuna('');
                  onSelectLocality?.('');
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shadow-md backdrop-blur-md border cursor-pointer active:scale-95 ${
                  selectedComuna === '' && !cercaDeMi
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black ring-2 ring-cyan-500/20'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                Todos ({places.length})
              </button>

              <button
                onClick={() => setOnlyUbicameCc(!onlyUbicameCc)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shadow-md backdrop-blur-md border flex items-center gap-1 cursor-pointer active:scale-95 ${
                  onlyUbicameCc
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-900/90 text-amber-300 border-amber-500/40 hover:bg-slate-800'
                }`}
              >
                <Sparkles size={11} className={onlyUbicameCc ? 'text-slate-950' : 'text-amber-400'} />
                <span>ubicame.cc</span>
                {totalClients > 0 && <span className="opacity-80">({totalClients})</span>}
              </button>

              {/* Botón Filtro Rápido Promos & Eventos de Hoy */}
              <button
                onClick={() => {
                  const nextVal = !soloPromos;
                  setSoloPromos?.(nextVal);
                  if (nextVal) {
                    setShowRadar(true);
                  }
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shadow-md backdrop-blur-md border flex items-center gap-1 cursor-pointer active:scale-95 ${
                  soloPromos
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 border-orange-400 font-black ring-2 ring-orange-500/30'
                    : 'bg-slate-900/90 text-orange-400 border-orange-500/40 hover:bg-slate-800'
                }`}
              >
                <Flame size={12} className={soloPromos ? 'text-slate-950 fill-current' : 'text-orange-400 fill-orange-400'} />
                <span>Promos & Eventos</span>
                {(totalPromos > 0 || placesWithPromos.length > 0) && (
                  <span className={soloPromos ? 'text-slate-950 font-black' : 'text-orange-300'}>
                    ({soloPromos ? places.length : (totalPromos || placesWithPromos.length)})
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Radar de Eventos & Promociones de Hoy (Desplegable con botón 🔥 de la barra vertical o filtro rápido) */}
        {placesWithPromos.length > 0 && showRadar && !isZenMode && (
          <div className="pointer-events-auto pt-1 pb-0.5 px-0 animate-fade-in">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase text-orange-400 tracking-wide">
                <Flame size={12} className="text-orange-400 fill-orange-400 animate-pulse" />
                <span>Radar de Promos & Eventos</span>
                <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.2 rounded-full border border-orange-500/30">
                  En vivo
                </span>
              </div>
              <div className="flex items-center gap-2">
                {soloPromos && (
                  <button
                    onClick={() => setSoloPromos?.(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Ver todos
                  </button>
                )}
                <button
                  onClick={() => setShowRadar(false)}
                  className="p-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 cursor-pointer"
                  title="Cerrar radar"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none overscroll-x-contain touch-pan-x">
              {placesWithPromos.map((place: Lugar) => {
                const c = place.campana_destacada!;
                return (
                  <div
                    key={place.id_slug}
                    onClick={() => {
                      onSelectPlace(place);
                      onViewOnMap(place);
                      if (onOpenDetail) onOpenDetail(place);
                    }}
                    className="shrink-0 w-64 p-2 rounded-xl bg-gradient-to-r from-orange-950/80 via-slate-900/90 to-slate-950 border border-orange-500/40 shadow-lg hover:border-orange-400 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                  >
                    {c.imagen_url ? (
                      <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.imagen_url}
                          alt={c.titulo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/icons/lugar.svg';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-orange-950/80 border border-orange-500/30 flex items-center justify-center shrink-0 text-lg">
                        🔥
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase text-orange-400 truncate">
                        <span>{c.badge || 'Evento'}</span>
                        <span className="text-slate-400">· {place.nombre}</span>
                      </div>
                      <div className="text-xs font-bold text-white leading-tight truncate mt-0.5">
                        {c.titulo}
                      </div>
                      <div className="text-[10px] text-amber-300 font-semibold truncate mt-0.5">
                        {c.dias_semana || c.hora_inicio ? `⏰ ${c.dias_semana || ''} ${c.hora_inicio || ''}` : `📍 ${place.zona || place.ciudad}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          BARRA DE HERRAMIENTAS VERTICAL FLOTANTE (OPCIÓN 1)
          Control ergonómico al pulgar para encender/apagar capas del mapa
          ======================================================== */}
      {mobileMode === 'map' && (
        <aside
          aria-label="Herramientas del mapa"
          className="absolute right-2.5 top-[76px] z-30 flex flex-col gap-2 items-center pointer-events-auto"
        >
          {/* Botón 1: 🔥 Radar de Promociones (si hay promociones activas) */}
          {placesWithPromos.length > 0 && !isZenMode && (
            <button
              onClick={() => setShowRadar(!showRadar)}
              className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-[0_4px_18px_rgba(0,0,0,0.7)] backdrop-blur-xl border active:scale-90 cursor-pointer ${
                showRadar
                  ? 'bg-gradient-to-b from-orange-500 to-amber-500 text-slate-950 border-orange-300 ring-2 ring-orange-500/50 shadow-orange-500/30 font-black'
                  : 'bg-slate-950/85 hover:bg-slate-900 border-orange-500/40 text-orange-400'
              }`}
              title={showRadar ? 'Ocultar Radar de Promociones' : 'Mostrar Radar de Promociones'}
            >
              <Flame size={19} className={showRadar ? 'fill-slate-950' : 'fill-orange-400 animate-pulse'} />
              <span className="absolute -top-1.5 -right-1.5 px-1 min-w-[17px] h-[17px] rounded-full bg-rose-600 border border-white text-[9px] font-black text-white flex items-center justify-center shadow">
                {placesWithPromos.length}
              </span>
            </button>
          )}

          {/* Botón 2: 🃏 Carrusel de Fichas de Negocios (On/Off) */}
          {!isZenMode && (
            <button
              onClick={() => setShowCarousel(!showCarousel)}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-[0_4px_18px_rgba(0,0,0,0.7)] backdrop-blur-xl border active:scale-90 cursor-pointer ${
                showCarousel
                  ? 'bg-slate-900/90 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/30'
                  : 'bg-slate-950/85 hover:bg-slate-900 border-slate-700/80 text-slate-500'
              }`}
              title={showCarousel ? 'Ocultar carrusel de fichas' : 'Mostrar carrusel de fichas'}
            >
              <Layers size={18} className={showCarousel ? 'text-cyan-400' : 'text-slate-400'} />
            </button>
          )}

          {/* Botón 3: 🧭 Píldoras y Filtros Superiores (On/Off) */}
          {!isZenMode && (
            <button
              onClick={() => setShowTopBar(!showTopBar)}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-[0_4px_18px_rgba(0,0,0,0.7)] backdrop-blur-xl border active:scale-90 cursor-pointer ${
                showTopBar
                  ? 'bg-slate-900/90 border-indigo-400 text-indigo-300 ring-2 ring-indigo-500/30'
                  : 'bg-slate-950/85 hover:bg-slate-900 border-slate-700/80 text-slate-500'
              }`}
              title={showTopBar ? 'Ocultar filtros superiores' : 'Mostrar filtros superiores'}
            >
              <SlidersHorizontal size={17} className={showTopBar ? 'text-indigo-400' : 'text-slate-400'} />
            </button>
          )}

          {/* Botón 4: 🔲 Modo Zen / Pantalla Completa (Limpia toda la pantalla para explorar el mapa libremente) */}
          <button
            onClick={() => setIsZenMode(!isZenMode)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-[0_4px_18px_rgba(0,0,0,0.7)] backdrop-blur-xl border active:scale-90 cursor-pointer ${
              isZenMode
                ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-slate-950 border-cyan-200 ring-2 ring-cyan-400/50 shadow-cyan-500/30 font-black'
                : 'bg-slate-950/85 hover:bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
            }`}
            title={isZenMode ? 'Salir de pantalla completa' : 'Modo mapa pantalla completa'}
          >
            {isZenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </aside>
      )}

      {/* ========================================================
          2. VISTA DE LISTA COMPLETA VERTICAL (Si mobileMode === 'list')
          ======================================================== */}
      {mobileMode === 'list' && (
        <div className="absolute inset-0 z-20 bg-[#070b16] pt-14 pb-20 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-slate-300">
              Mostrando {places.length} lugares
            </span>
            <button
              onClick={() => setMobileMode('map')}
              className="text-xs font-black text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              <MapIcon size={13} />
              <span>Ver en Mapa</span>
            </button>
          </div>

          <div className="space-y-3 pb-8">
            {places.map((place) => (
              <PlaceCard
                key={place.id_slug}
                place={place}
                onSelect={(p) => {
                  if (onOpenDetail) onOpenDetail(p);
                  else onSelectPlace(p);
                }}
                onViewOnMap={(p) => {
                  onViewOnMap(p);
                  setMobileMode('map');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          3. CARRUSEL HORIZONTAL FLUIDO AL PULGAR (Modo Mapa)
          ======================================================== */}
      {mobileMode === 'map' && places.length > 0 && showCarousel && !isZenMode && (
        <div className="absolute bottom-[66px] left-0 right-0 z-30 pointer-events-none flex flex-col gap-1.5">
          {/* Barra indicadora de posición y avance rápido para el pulgar */}
          <div className="pointer-events-auto flex items-center justify-between px-4">
            <div className="flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/60 shadow-lg text-[10px] text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-bold text-white">
                {activeIndex + 1} de {places.length}
              </span>
              <span className="text-slate-400">• Desliza libremente ↔</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevCard}
                disabled={activeIndex === 0}
                className="w-7 h-7 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                title="Negocio anterior"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={handleNextCard}
                disabled={activeIndex >= places.length - 1}
                className="w-7 h-7 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                title="Siguiente negocio"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Contenedor relativo con Flechas Flotantes Laterales Táctiles al Pulgar (Opción 1) */}
          <div className="relative w-full">
            {/* Flecha Flotante Lateral Izquierda (Anterior) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevCard();
              }}
              disabled={activeIndex === 0}
              aria-label="Negocio anterior"
              className={`pointer-events-auto absolute left-1.5 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-[0_6px_24px_rgba(0,0,0,0.85)] backdrop-blur-xl border active:scale-90 cursor-pointer ${
                activeIndex === 0
                  ? 'opacity-20 pointer-events-none bg-slate-900/60 border-slate-800 text-slate-600'
                  : 'bg-slate-950/90 hover:bg-slate-900 border-cyan-400/60 text-cyan-300 ring-2 ring-cyan-500/25 active:ring-cyan-400'
              }`}
            >
              <ChevronLeft size={24} className="stroke-[2.5] -translate-x-0.5" />
            </button>

            {/* Flecha Flotante Lateral Derecha (Siguiente) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextCard();
              }}
              disabled={activeIndex >= places.length - 1}
              aria-label="Siguiente negocio"
              className={`pointer-events-auto absolute right-1.5 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-[0_6px_24px_rgba(0,0,0,0.85)] backdrop-blur-xl border active:scale-90 cursor-pointer ${
                activeIndex >= places.length - 1
                  ? 'opacity-20 pointer-events-none bg-slate-900/60 border-slate-800 text-slate-600'
                  : 'bg-slate-950/90 hover:bg-slate-900 border-cyan-400/60 text-cyan-300 ring-2 ring-cyan-500/25 active:ring-cyan-400'
              }`}
            >
              <ChevronRight size={24} className="stroke-[2.5] translate-x-0.5" />
            </button>

            {/* Carrusel Deslizable Horizontal con Inercia Fluida */}
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              onTouchStart={() => {
                isTouchingRef.current = true;
              }}
              onTouchEnd={() => {
                isTouchingRef.current = false;
              }}
              onMouseDown={() => {
                isTouchingRef.current = true;
              }}
              onMouseUp={() => {
                isTouchingRef.current = false;
              }}
              className="pointer-events-auto flex gap-3 overflow-x-auto px-12 pb-2 scrollbar-none overscroll-x-contain touch-pan-x"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x proximity',
              }}
            >
              {places.map((place, idx) => {
                const isSelected = selectedPlace?.id_slug === place.id_slug || activeIndex === idx;
                const isP1 = place.prioridad === 1 || place.origen === 'ubicame_cc';
                const isVerified = place.prioridad === 2;
                const category = getCategoryStyle(place);
                const coverBanner = getCategoryCoverBanner(place);
                const actionConfig = getPlaceActionConfig(place);

                const iconSrc =
                  place.icono.startsWith('/') || place.icono.startsWith('http')
                    ? place.icono
                    : `/icons/${place.icono}`;

                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitud},${place.longitud}`;
                const whatsappUrl = place.whatsapp
                  ? `https://wa.me/${place.whatsapp.replace(/\+/g, '')}`
                  : undefined;

                return (
                  <div
                    key={place.id_slug}
                    ref={(el) => {
                      if (el) cardRefs.current.set(place.id_slug, el);
                      else cardRefs.current.delete(place.id_slug);
                    }}
                    onClick={() => {
                      onSelectPlace(place);
                      onViewOnMap(place);
                    }}
                    style={{
                      scrollSnapAlign: 'center',
                    }}
                    className={`shrink-0 w-[80vw] max-w-[325px] rounded-2xl overflow-hidden transition-all duration-200 border select-none cursor-pointer ${
                      isSelected
                        ? 'bg-[#0a0f1d]/98 border-cyan-400 shadow-[0_12px_30px_rgba(6,182,212,0.3)] scale-[1.01]'
                        : isP1
                        ? 'bg-gradient-to-b from-slate-900/95 via-amber-950/20 to-slate-900/95 border-amber-500/40 shadow-lg'
                        : 'bg-[#090d19]/95 border-slate-700/80 shadow-lg'
                    }`}
                  >
                    {/* Mini Cover Banner en cabecera de tarjeta móvil (Idea 1) */}
                    <div className="relative w-full h-20 overflow-hidden bg-slate-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverBanner}
                        alt={`Portada de ${place.nombre}`}
                        className="w-full h-full object-cover object-center filter brightness-[0.88]"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#090d19] via-[#090d19]/40 to-black/20" />

                      {/* Insignias sobre la foto */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        {isP1 && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow flex items-center gap-0.5">
                            <Sparkles size={9} className="fill-slate-950" />
                            <span>ubicame.cc</span>
                          </span>
                        )}
                        {place.tiene_promo && (
                          <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow flex items-center gap-0.5 animate-pulse">
                            <Flame size={8} className="fill-white" />
                            <span>Promo</span>
                          </span>
                        )}
                        <span
                          className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-md shadow"
                          style={{
                            backgroundColor: `${category.borderColor}30`,
                            color: category.borderColor,
                            border: `1px solid ${category.borderColor}60`,
                          }}
                        >
                          {category.name}
                        </span>
                      </div>

                      {/* Botón Explícito para Abrir Ficha Completa Únicamente al Tocarlo */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenDetail) onOpenDetail(place);
                          else onSelectPlace(place);
                        }}
                        className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-slate-950/85 hover:bg-slate-900 border border-cyan-400/70 text-cyan-300 text-[10px] font-black backdrop-blur-md flex items-center gap-1 shadow-lg shadow-cyan-950/50 active:scale-90 transition-all cursor-pointer z-10"
                        title="Ver ficha completa"
                      >
                        <span>Ver Ficha</span>
                        <ChevronRight size={11} className="stroke-[3]" />
                      </button>

                      {/* Floating Avatar en esquina inferior izquierda */}
                      <div
                        className="absolute -bottom-2.5 left-3 w-10 h-10 rounded-xl flex items-center justify-center p-2 shadow-lg backdrop-blur-md"
                        style={{
                          backgroundColor: '#090e1a',
                          border: `2px solid ${category.borderColor}`,
                          boxShadow: `0 0 10px ${category.glowColor}`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={iconSrc}
                          alt={place.tipo}
                          className="w-full h-full invert object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/icons/lugar.svg';
                          }}
                        />
                      </div>
                    </div>

                    {/* Datos del Negocio */}
                    <div className="p-3 pt-2">
                      <div className="pl-12 min-w-0 mb-1.5">
                        <h4 className="font-black text-sm text-white leading-snug truncate">
                          {place.nombre}
                        </h4>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <MapPin size={11} className="text-cyan-400 shrink-0" />
                          <span className="truncate">{place.zona || place.ciudad}</span>
                          {place.distancia_km !== undefined && (
                            <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1 rounded ml-auto shrink-0">
                              {formatDistance(place.distancia_km)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Promo o Evento Activo en la Tarjeta */}
                      {place.tiene_promo && place.campana_destacada && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenDetail) onOpenDetail(place);
                            else onSelectPlace(place);
                          }}
                          className="mt-1 mb-1 px-2 py-1 rounded-lg bg-orange-950/60 border border-orange-500/40 text-orange-200 flex items-center justify-between gap-1 shadow-sm active:scale-98 transition-all"
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-[10px]">🔥</span>
                            <span className="text-[10.5px] font-bold text-white truncate">
                              {place.campana_destacada.titulo}
                            </span>
                          </div>
                          <span className="text-[9px] text-amber-300 font-bold shrink-0">
                            Ver promo ›
                          </span>
                        </div>
                      )}

                      {/* Fila de Botones de Acción al alcance inmediato del pulgar */}
                      <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                        {/* Acción según Rubro (Menú, Catálogo, Cotizar, etc.) */}
                        {place.url_perfil ? (
                          <a
                            href={place.url_perfil}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="py-2 px-2 rounded-xl text-[11px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 flex items-center justify-center gap-1 active:scale-95 transition-all truncate"
                          >
                            {renderActionIcon(actionConfig.actionType)}
                            <span className="truncate">{actionConfig.label}</span>
                            <ExternalLink size={10} className="stroke-[2.5] shrink-0" />
                          </a>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenDetail) onOpenDetail(place);
                              else onSelectPlace(place);
                            }}
                            className="py-2 px-2 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                          >
                            <ChevronRight size={13} />
                            <span>Ver Ficha</span>
                          </button>
                        )}

                        {/* WhatsApp Directo */}
                        {whatsappUrl ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="py-2 px-2 rounded-xl text-[11px] font-bold bg-emerald-600 text-white shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1 active:scale-95 transition-all"
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <div className="py-2 px-2 rounded-xl text-[10px] text-slate-500 bg-slate-900 border border-slate-800 flex items-center justify-center">
                            Sin WhatsApp
                          </div>
                        )}

                        {/* Navegación GPS (Google Maps) */}
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="py-2 px-2 rounded-xl text-[11px] font-bold bg-slate-900 text-cyan-300 border border-slate-700/90 hover:bg-slate-800 flex items-center justify-center gap-1 active:scale-95 transition-all"
                          title="Cómo llegar con Google Maps"
                        >
                          <Navigation size={12} className="rotate-45 text-cyan-400" />
                          <span>GPS</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Píldora compacta cuando el carrusel de fichas está oculto (libera más del 85% del mapa) */}
      {mobileMode === 'map' && places.length > 0 && !showCarousel && !isZenMode && (
        <div className="absolute bottom-[66px] left-0 right-0 z-30 pointer-events-none flex justify-center px-4 animate-fade-in">
          <button
            onClick={() => setShowCarousel(true)}
            className="pointer-events-auto flex items-center gap-2 py-2 px-4 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/60 shadow-[0_6px_20px_rgba(0,0,0,0.85)] backdrop-blur-md text-[11px] font-black text-cyan-300 active:scale-95 transition-all cursor-pointer ring-1 ring-cyan-500/20"
          >
            <Layers size={13} className="text-cyan-400" />
            <span>Ver {places.length} fichas de negocios</span>
            <ChevronUp size={13} className="text-cyan-400 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Píldora flotante para salir del Modo Zen */}
      {mobileMode === 'map' && isZenMode && (
        <div className="absolute bottom-[66px] left-0 right-0 z-30 pointer-events-none flex justify-center px-4 animate-fade-in">
          <button
            onClick={() => setIsZenMode(false)}
            className="pointer-events-auto flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/50 shadow-xl backdrop-blur-md text-[10px] font-bold text-cyan-300 active:scale-95 transition-all cursor-pointer"
          >
            <Minimize2 size={12} className="text-cyan-400" />
            <span>Salir de Modo Zen (Restaurar)</span>
          </button>
        </div>
      )}

      {/* ========================================================
          4. BOTTOM FIXED ERGONOMIC DOCK (Barra de Control al Pulgar)
          100% visible, fija con Safe Area Padding
          ======================================================== */}
      <nav className="absolute bottom-0 left-0 right-0 z-40 bg-[#070b16]/95 backdrop-blur-2xl border-t border-slate-800 py-1.5 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom,8px))] shadow-[0_-12px_28px_rgba(0,0,0,0.85)]">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto items-center">
          {/* 1. Botón Buscar */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'search' ? null : 'search')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 ${
              activeDrawer === 'search' || searchQuery
                ? 'text-cyan-400 bg-cyan-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search size={18} />
            <span className="text-[10px] font-bold mt-0.5">Buscar</span>
          </button>

          {/* 2. Botón GPS / Cerca de mí */}
          <button
            onClick={onToggleCercaDeMi}
            disabled={isLocating}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 ${
              cercaDeMi
                ? 'text-emerald-400 bg-emerald-950/60 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isLocating ? (
              <Loader2 size={18} className="animate-spin text-cyan-400" />
            ) : (
              <Compass size={18} />
            )}
            <span className="text-[10px] font-bold mt-0.5">
              {cercaDeMi ? 'Cerca ON' : 'Cerca'}
            </span>
          </button>

          {/* 3. Botón Central Alternar Modo: Mapa / Lista */}
          <button
            onClick={() => {
              setMobileMode(mobileMode === 'map' ? 'list' : 'map');
              setActiveDrawer(null);
            }}
            className="flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 text-cyan-300"
          >
            <div className="w-10 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/25 font-black">
              {mobileMode === 'map' ? <ListIcon size={16} /> : <MapIcon size={16} />}
            </div>
            <span className="text-[9.5px] font-black text-cyan-300 mt-0.5">
              {mobileMode === 'map' ? 'Lista' : 'Mapa'}
            </span>
          </button>

          {/* 4. Botón Filtro Territorio */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'filters' ? null : 'filters')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 relative ${
              activeDrawer === 'filters' || hasTerritorialFilter
                ? 'text-purple-400 bg-purple-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal size={18} />
            {hasTerritorialFilter && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1 right-3 ring-2 ring-slate-950 animate-pulse" />
            )}
            <span className="text-[10px] font-bold mt-0.5">Territorio</span>
          </button>

          {/* 5. Botón ubicame.cc (Clientes verificados/destacados) */}
          <button
            onClick={() => setOnlyUbicameCc(!onlyUbicameCc)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 ${
              onlyUbicameCc
                ? 'text-amber-400 bg-amber-950/60 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={18} className={onlyUbicameCc ? 'text-amber-400' : ''} />
            <span className="text-[10px] font-bold mt-0.5">Destacados</span>
          </button>
        </div>
      </nav>

      {/* ========================================================
          5. DRAWER MODAL DE BÚSQUEDA AL PULGAR (Thumb Search Drawer)
          ======================================================== */}
      {activeDrawer === 'search' && (
        <div className="absolute inset-x-0 bottom-[62px] z-50 bg-[#090e1c] border-t border-slate-800 p-4 rounded-t-3xl shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Search size={14} />
              <span>Búsqueda Rápida con una Mano</span>
            </span>
            <button
              onClick={() => setActiveDrawer(null)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              autoFocus
              placeholder="Escribe comida, hotel, taxi o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-500/50 rounded-2xl py-3 pl-10 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Accesos rápidos sugeridos */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[11px] text-slate-400 font-semibold">Sugerencias:</span>
            {['Restaurante', 'Hotel', 'Farmacia', 'Pizza', 'Cafetería'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  setActiveDrawer(null);
                }}
                className="px-2.5 py-1 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          <button
            onClick={() => setActiveDrawer(null)}
            className="w-full mt-3 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
          >
            Ver {places.length} Resultados
          </button>
        </div>
      )}

      {/* ========================================================
          6. DRAWER MODAL DE FILTRO TERRITORIAL 4 NIVELES AL PULGAR
          ======================================================== */}
      {activeDrawer === 'filters' && (
        <div className="absolute inset-x-0 bottom-[62px] z-50 bg-[#090e1c] border-t border-slate-800 p-4 rounded-t-3xl shadow-2xl animate-fade-in max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} />
              <span>División Territorial de Ecuador (4 Niveles)</span>
            </span>
            <button
              onClick={() => setActiveDrawer(null)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* 1. Provincia */}
            <div>
              <label className="text-[11px] text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Landmark size={12} className="text-indigo-400 shrink-0" />
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Todas las Provincias ({provincias.length})</option>
                  {provincias.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Cantón */}
            <div>
              <label className="text-[11px] text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Building size={12} className="text-cyan-400 shrink-0" />
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Todos los Cantones</option>
                  {availableCantones.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Parroquia */}
            <div>
              <label className="text-[11px] text-slate-300 font-bold mb-1 flex items-center gap-1">
                <MapPin size={12} className="text-purple-400 shrink-0" />
                <span>3. Parroquia</span>
              </label>
              <div className="relative">
                <select
                  value={selectedParroquia}
                  onChange={(e) => {
                    setSelectedParroquia(e.target.value);
                    setSelectedComuna('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Todas las Parroquias</option>
                  {availableParroquias.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Comuna / Localidad */}
            <div>
              <label className="text-[11px] text-slate-300 font-bold mb-1 flex items-center gap-1">
                <Home size={12} className="text-emerald-400 shrink-0" />
                <span>4. Comuna / Zona</span>
              </label>
              <div className="relative">
                <select
                  value={selectedComuna}
                  onChange={(e) => setSelectedComuna(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Todas las Comunas</option>
                  {availableComunas.map((comuna) => (
                    <option key={comuna} value={comuna}>{comuna}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
            {hasTerritorialFilter && (
              <button
                onClick={clearTerritorialFilters}
                className="py-2.5 px-3 rounded-xl bg-slate-800 text-rose-300 border border-rose-500/30 text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                Restablecer
              </button>
            )}
            <button
              onClick={() => setActiveDrawer(null)}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Aplicar ({places.length} Lugares)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          6. MODAL SELECTOR DE LOCALIDAD HÍBRIDO (GPS + MANUAL)
          ======================================================== */}
      {showLocalityModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-fade-in pointer-events-auto"
          onClick={() => setShowLocalityModal(false)}
        >
          <div
            className="bg-[#090e1c] border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl max-w-md w-full p-4 pb-6 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">¿Dónde te encuentras?</h3>
                  <p className="text-[10.5px] text-slate-400">El mapa se traslada automáticamente a tu pueblo</p>
                </div>
              </div>
              <button
                onClick={() => setShowLocalityModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Botón Principal: Detectar GPS en Vivo */}
            <button
              onClick={() => {
                if (!cercaDeMi) onToggleCercaDeMi();
                setShowLocalityModal(false);
              }}
              disabled={isLocating}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/50 hover:border-emerald-400 text-white font-bold text-xs flex items-center justify-between shadow-lg active:scale-98 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  {isLocating ? (
                    <Loader2 size={18} className="animate-spin text-emerald-400" />
                  ) : (
                    <Compass size={18} />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-[12px] font-black text-white flex items-center gap-1.5">
                    <span>Detectar por GPS en vivo</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase tracking-wider">
                      Auto
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-normal">
                    {cercaDeMi && nearestTown
                      ? `Detectado cerca de ${nearestTown.pueblo} (${formatDistance(nearestTown.distanciaKm)})`
                      : 'Centrar el mapa donde estoy ahora mismo'}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-emerald-400 shrink-0" />
            </button>

            {/* Separador */}
            <div className="flex items-center gap-2 py-0.5">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                O selecciona tu localidad
              </span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* Lista de Localidades Reales */}
            <div className="space-y-1.5">
              {/* Opción Toda la Costa */}
              <button
                onClick={() => {
                  setSelectedComuna('');
                  onSelectLocality?.('');
                  setShowLocalityModal(false);
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-98 ${
                  !selectedComuna && !cercaDeMi
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                    : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm">
                    🗺️
                  </div>
                  <div>
                    <span className="text-[12px] font-bold text-white">Toda la Costa (Ruta del Spondylus)</span>
                    <p className="text-[9.5px] text-slate-400">Ver negocios de todos los pueblos</p>
                  </div>
                </div>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  {places.length}
                </span>
              </button>

              {(realLocalities || []).map((loc) => {
                const isSelected = selectedComuna.toLowerCase() === loc.name.toLowerCase();
                const icon =
                  loc.name === 'Montañita' ? '🏄' :
                  loc.name === 'Olón' ? '🌴' :
                  loc.name === 'Manglaralto' ? '🐚' :
                  loc.name === 'Cadeate' ? '🪵' : '📍';
                const desc =
                  loc.name === 'Montañita' ? 'Surf, vida nocturna y restaurantes' :
                  loc.name === 'Olón' ? 'Playa extensa, cabañas y tranquilidad' :
                  loc.name === 'Manglaralto' ? 'Cabecera parroquial y gastronomía marina' :
                  loc.name === 'Cadeate' ? 'Tradición artesanal y madera' : 'Pueblo costero';

                return (
                  <button
                    key={loc.name}
                    onClick={() => {
                      onSelectLocality?.(loc.name);
                      setShowLocalityModal(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                        : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm">
                        {icon}
                      </div>
                      <div>
                        <span className={`text-[12.5px] font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {loc.name}
                        </span>
                        <p className="text-[9.5px] text-slate-400">{desc}</p>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                      {loc.count} {loc.count === 1 ? 'lugar' : 'lugares'}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-500 text-center pt-1">
              💾 Recordaremos tu localidad para tu próxima visita
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileOneHandedView;
