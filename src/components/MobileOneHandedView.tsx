'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lugar } from '@/types/lugar';
import { PlaceCard } from '@/components/PlaceCard';
import { formatDistance } from '@/lib/geo';
import { getPlaceActionConfig } from '@/lib/placeActions';
import { getCategoryStyle } from '@/lib/categoryStyles';
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
} from 'lucide-react';

export interface MobileOneHandedViewProps {
  places: Lugar[];
  selectedPlace: Lugar | null;
  onSelectPlace: (place: Lugar) => void;
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
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  totalClients: number;
}

export const MobileOneHandedView: React.FC<MobileOneHandedViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
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
  clearAllFilters,
  hasActiveFilters,
  totalClients,
}) => {
  // Mobile Display Mode: 'map' (interactive map + thumb carousel) or 'list' (full vertical feed)
  const [mobileMode, setMobileMode] = useState<'map' | 'list'>('map');

  // Bottom Thumb Drawers
  const [activeDrawer, setActiveDrawer] = useState<'search' | 'filters' | null>(null);

  // Active Card Index in Carousel
  const [activeIndex, setActiveIndex] = useState(0);

  // Carousel ref and touch tracking
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isTouchingRef = useRef(false);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync activeIndex with selectedPlace ONLY when changed from map pin click (not from carousel swipe)
  useEffect(() => {
    if (!selectedPlace) return;
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
      <div className="absolute top-2.5 left-2.5 right-2.5 z-30 pointer-events-none flex flex-col gap-1.5">
        {/* Banner de filtro territorial activo si existe */}
        {hasTerritorialFilter && (
          <div className="pointer-events-auto p-1.5 px-3 rounded-xl bg-cyan-950/90 border border-cyan-500/40 backdrop-blur-md shadow-lg text-[11px] text-cyan-300 flex items-center justify-between gap-2 animate-fade-in">
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

        {/* Fila de píldoras rápidas con scroll horizontal suave para el pulgar */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setSelectedComuna('')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all shadow-md backdrop-blur-md border cursor-pointer active:scale-95 ${
              selectedComuna === ''
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

          {availableComunas.slice(0, 15).map((comuna) => (
            <button
              key={comuna}
              onClick={() => setSelectedComuna(selectedComuna === comuna ? '' : comuna)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shadow-md backdrop-blur-md border cursor-pointer active:scale-95 ${
                selectedComuna === comuna
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black ring-2 ring-cyan-500/20'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              {comuna}
            </button>
          ))}
        </div>
      </div>

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
                  onSelectPlace(p);
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
      {mobileMode === 'map' && places.length > 0 && (
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
            className="pointer-events-auto flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none overscroll-x-contain touch-pan-x"
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
                  onClick={() => onSelectPlace(place)}
                  style={{
                    scrollSnapAlign: 'center',
                  }}
                  className={`shrink-0 w-[80vw] max-w-[325px] p-3 rounded-2xl transition-all duration-200 border select-none cursor-pointer ${
                    isSelected
                      ? 'bg-[#0a0f1d]/98 border-cyan-400 shadow-[0_12px_30px_rgba(6,182,212,0.3)] scale-[1.01]'
                      : isP1
                      ? 'bg-gradient-to-b from-slate-900/95 via-amber-950/20 to-slate-900/95 border-amber-500/40 shadow-lg'
                      : 'bg-[#090d19]/95 border-slate-700/80 shadow-lg'
                  }`}
                >
                  {/* Encabezado: Icono de categoría + Datos del negocio */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
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
                          className="w-5 h-5 invert object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/icons/lugar.svg';
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                            style={{
                              color: category.borderColor,
                              backgroundColor: `${category.borderColor}18`,
                              border: `1px solid ${category.borderColor}40`,
                            }}
                          >
                            {category.name}
                          </span>
                          {isP1 && (
                            <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1 py-0.5 rounded flex items-center gap-0.5">
                              ★ Destacado
                            </span>
                          )}
                          {isVerified && !isP1 && (
                            <span className="text-[9px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-1 py-0.5 rounded flex items-center gap-0.5">
                              <ShieldCheck size={9} />
                              Verificado
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-sm text-white leading-snug mt-1 truncate">
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
                    </div>
                  </div>

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
                          onSelectPlace(place);
                        }}
                        className="py-2 px-2 rounded-xl text-[11px] font-bold bg-slate-800 text-cyan-300 border border-slate-700 flex items-center justify-center gap-1 active:scale-95 transition-all"
                      >
                        <ChevronRight size={13} />
                        <span>Detalles</span>
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
              );
            })}
          </div>
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

          {/* 5. Botón ubicame.cc (Clientes verificados) */}
          <button
            onClick={() => setOnlyUbicameCc(!onlyUbicameCc)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 ${
              onlyUbicameCc
                ? 'text-amber-400 bg-amber-950/60 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={18} className={onlyUbicameCc ? 'text-amber-400' : ''} />
            <span className="text-[10px] font-bold mt-0.5">Menús</span>
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
    </>
  );
};

export default MobileOneHandedView;
