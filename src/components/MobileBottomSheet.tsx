'use client';

import React, { useState, useRef, useEffect, TouchEvent } from 'react';
import { Lugar } from '@/types/lugar';
import { PlaceCard } from '@/components/PlaceCard';
import { ZoneList } from '@/components/ZoneList';
import { formatDistance } from '@/lib/geo';
import { getPlaceActionConfig } from '@/lib/placeActions';
import {
  Search,
  X,
  Compass,
  Navigation,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MapPin,
  ExternalLink,
  MessageCircle,
  Plus,
  Loader2,
  Check,
  Building,
  Landmark,
  Home,
  Layers,
  UtensilsCrossed,
  ShoppingBag,
  Wrench,
  Calendar,
  BedDouble,
  ChevronRight,
} from 'lucide-react';

export type SheetSnap = 'peek' | 'half' | 'full';

interface MobileBottomSheetProps {
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

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
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
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const [showFilters, setShowFilters] = useState(false);

  // Touch tracking for drag gestures with one thumb
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // When a place is selected from the map, bring sheet to 'peek' to showcase preview card
  useEffect(() => {
    if (selectedPlace) {
      setSnap('peek');
    }
  }, [selectedPlace]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current) return;
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = touchCurrentY.current - touchStartY.current;

    // Threshold for drag gesture
    if (deltaY < -40) {
      // Swiped UP -> expand
      if (snap === 'peek') setSnap('half');
      else if (snap === 'half') setSnap('full');
    } else if (deltaY > 40) {
      // Swiped DOWN -> minimize
      if (snap === 'full') setSnap('half');
      else if (snap === 'half') setSnap('peek');
    }
  };

  // Toggle cycle on tapping handle
  const handleHandleTap = () => {
    if (snap === 'peek') setSnap('half');
    else if (snap === 'half') setSnap('full');
    else setSnap('peek');
  };

  const snapClasses = {
    peek: 'h-[140px]',
    half: 'h-[52vh]',
    full: 'h-[92vh]',
  };

  const actionConfig = selectedPlace ? getPlaceActionConfig(selectedPlace) : null;
  const whatsappUrl = selectedPlace?.whatsapp
    ? `https://wa.me/${selectedPlace.whatsapp.replace(/\+/g, '')}`
    : undefined;

  const hasTerritorialFilter = Boolean(
    selectedProvincia || selectedCanton || selectedParroquia || selectedComuna
  );

  const clearTerritorialFilters = () => {
    setSelectedProvincia('');
    setSelectedCanton('');
    setSelectedParroquia('');
    setSelectedComuna('');
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 bg-[#070b16]/95 backdrop-blur-xl border-t border-slate-800 shadow-[0_-10px_35px_rgba(0,0,0,0.7)] rounded-t-3xl flex flex-col transition-all duration-300 ease-out select-none ${snapClasses[snap]}`}
    >
      {/* 1. Thumb Drag Handle Area (Tocar o arrastrar con una sola mano) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleHandleTap}
        className="w-full pt-2.5 pb-2 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center shrink-0 border-b border-slate-800/40"
      >
        <div className="w-12 h-1.5 rounded-full bg-slate-600/80 active:bg-cyan-400 transition-colors" />
        <div className="flex items-center justify-between w-full px-4 pt-1.5 text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-slate-200">
              {places.length} {places.length === 1 ? 'Lugar' : 'Lugares'}
            </span>
            {totalClients > 0 && (
              <span className="text-amber-400 font-semibold">• {totalClients} en ubicame.cc</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10.5px] text-cyan-400 font-semibold">
            {snap === 'peek' && <span>Desliza arriba ↑</span>}
            {snap === 'half' && <span>Pantalla completa ↑</span>}
            {snap === 'full' && (
              <span className="text-slate-400 flex items-center gap-0.5">
                <span>Minimizar</span>
                <ChevronDown size={12} />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. CONTENIDO SEGÚN MODO: PREVIEW DE LUGAR SELECCIONADO (Si hay lugar activo y está en 'peek') */}
      {selectedPlace && snap === 'peek' ? (
        <div className="p-3 px-4 flex flex-col justify-between flex-1 overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 p-1.5 flex items-center justify-center shrink-0">
                <img
                  src={
                    selectedPlace.icono.startsWith('/') || selectedPlace.icono.startsWith('http')
                      ? selectedPlace.icono
                      : `/icons/${selectedPlace.icono}`
                  }
                  alt={selectedPlace.nombre}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {selectedPlace.nombre}
                  </h4>
                  {selectedPlace.prioridad === 1 && (
                    <span className="shrink-0 p-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                      <Sparkles size={10} />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  <span>{selectedPlace.zona || selectedPlace.ciudad || 'Ecuador'}</span>
                  {selectedPlace.distancia_km !== undefined && (
                    <span className="text-emerald-400 font-semibold">
                      • {formatDistance(selectedPlace.distancia_km)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearSelectedPlace();
              }}
              className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0"
              title="Cerrar selección"
            >
              <X size={14} />
            </button>
          </div>

          {/* Botones de acción ergonómicos al alcance del pulgar */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="py-1.5 px-2 rounded-xl bg-emerald-600/90 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform"
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </a>
            )}

            {selectedPlace.url_perfil ? (
              <a
                href={selectedPlace.url_perfil}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[11px] font-black flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform truncate"
              >
                <ExternalLink size={12} />
                <span className="truncate">{actionConfig?.label || 'Ver Menú'}</span>
              </a>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewOnMap(selectedPlace);
                }}
                className="py-1.5 px-2 rounded-xl bg-slate-800 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                <MapPin size={12} />
                <span>Centrar</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectPlace(selectedPlace);
              }}
              className="py-1.5 px-2 rounded-xl bg-cyan-500 text-slate-950 text-[11px] font-black flex items-center justify-center gap-1 shadow-md shadow-cyan-500/20 active:scale-95 transition-transform"
            >
              <span>Ver Ficha</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      ) : (
        /* 3. MODO NORMAL (Búsqueda + Filtros rápidos + Lista) */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barra de búsqueda fija al pulgar */}
          <div className="p-2.5 px-3 border-b border-slate-800/80 flex items-center gap-2 shrink-0 bg-slate-900/60">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type="text"
                placeholder="Buscar negocio, comuna o cantón..."
                value={searchQuery}
                onFocus={() => {
                  if (snap === 'peek') setSnap('half');
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Botón GPS Cerca de mí */}
            <button
              onClick={onToggleCercaDeMi}
              disabled={isLocating}
              className={`p-2 sm:px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                cercaDeMi
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 text-cyan-400 border-cyan-500/40 hover:bg-slate-800'
              }`}
              title="Cerca de mí GPS"
            >
              {isLocating ? (
                <Loader2 size={15} className="animate-spin text-cyan-300" />
              ) : cercaDeMi ? (
                <Navigation size={14} className="rotate-45" />
              ) : (
                <Compass size={15} />
              )}
              <span className="text-[11px]">{cercaDeMi ? 'Activo' : 'Cerca'}</span>
            </button>

            {/* Botón desplegar filtros territoriales */}
            <button
              onClick={() => {
                const nextState = !showFilters;
                setShowFilters(nextState);
                if (nextState && snap === 'peek') setSnap('half');
              }}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors shrink-0 relative ${
                showFilters || hasTerritorialFilter
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="Filtro Territorial de Ecuador (4 Niveles)"
            >
              <SlidersHorizontal size={15} />
              {hasTerritorialFilter && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1.5 right-1.5 ring-2 ring-slate-950 animate-pulse" />
              )}
            </button>
          </div>

          {/* Chip de territorio activo si hay algún filtro geográfico seleccionado */}
          {hasTerritorialFilter && (
            <div className="px-3 py-1.5 bg-cyan-950/40 border-b border-cyan-800/40 flex items-center justify-between text-[11px] text-cyan-300 shrink-0 animate-fade-in">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <MapPin size={12} className="text-cyan-400 shrink-0" />
                <span className="text-slate-400 text-[10.5px]">Zona:</span>
                <span className="font-bold text-white truncate">
                  {[selectedComuna, selectedParroquia, selectedCanton, selectedProvincia].filter(Boolean).join(' › ')}
                </span>
              </div>
              <button
                onClick={clearTerritorialFilters}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold shrink-0 flex items-center gap-0.5 hover:underline cursor-pointer"
                title="Quitar filtro territorial"
              >
                <span>Restablecer</span>
                <X size={11} />
              </button>
            </div>
          )}

          {/* Quick pills bar (Scroll horizontal cómodo con el pulgar) */}
          <div className="flex items-center gap-1.5 p-2 px-3 overflow-x-auto scrollbar-none border-b border-slate-800/40 bg-[#050811]/60 shrink-0">
            <button
              onClick={() => setSelectedComuna('')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors border ${
                selectedComuna === ''
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Todos
            </button>

            <button
              onClick={() => setOnlyUbicameCc(!onlyUbicameCc)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors border flex items-center gap-1 ${
                onlyUbicameCc
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              <Sparkles size={11} />
              <span>ubicame.cc</span>
            </button>

            {availableComunas.slice(0, 10).map((comuna) => (
              <button
                key={comuna}
                onClick={() => setSelectedComuna(selectedComuna === comuna ? '' : comuna)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors border ${
                  selectedComuna === comuna
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {comuna}
              </button>
            ))}
          </div>

          {/* Filtros territoriales desplegables (4 Niveles en Cascada) */}
          {showFilters && (
            <div className="p-3 bg-slate-950/95 border-b border-slate-800 space-y-2.5 shrink-0 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-[10.5px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers size={12} />
                  <span>Filtro Territorial de Ecuador (4 Niveles)</span>
                </span>
                {hasTerritorialFilter && (
                  <button
                    onClick={clearTerritorialFilters}
                    className="text-[10.5px] text-rose-400 font-bold hover:underline cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* 1. Provincia */}
                <div>
                  <label className="text-[10px] text-slate-300 font-bold mb-0.5 flex items-center gap-1">
                    <Landmark size={10} className="text-indigo-400 shrink-0" />
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
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 pr-6 text-[11px] text-white focus:outline-none focus:border-cyan-500 appearance-none truncate"
                    >
                      <option value="">Todas ({provincias.length})</option>
                      {provincias.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
                  </div>
                </div>

                {/* 2. Cantón */}
                <div>
                  <label className="text-[10px] text-slate-300 font-bold mb-0.5 flex items-center gap-1">
                    <Building size={10} className="text-cyan-400 shrink-0" />
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
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 pr-6 text-[11px] text-white focus:outline-none focus:border-cyan-500 appearance-none truncate"
                    >
                      <option value="">Todos los Cantones</option>
                      {availableCantones.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
                  </div>
                </div>

                {/* 3. Parroquia */}
                <div>
                  <label className="text-[10px] text-slate-300 font-bold mb-0.5 flex items-center gap-1">
                    <MapPin size={10} className="text-purple-400 shrink-0" />
                    <span>3. Parroquia</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedParroquia}
                      onChange={(e) => {
                        setSelectedParroquia(e.target.value);
                        setSelectedComuna('');
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 pr-6 text-[11px] text-white focus:outline-none focus:border-cyan-500 appearance-none truncate"
                    >
                      <option value="">Todas las Parroquias</option>
                      {availableParroquias.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
                  </div>
                </div>

                {/* 4. Comuna / Localidad */}
                <div>
                  <label className="text-[10px] text-slate-300 font-bold mb-0.5 flex items-center gap-1">
                    <Home size={10} className="text-emerald-400 shrink-0" />
                    <span>4. Comuna / Zona</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedComuna}
                      onChange={(e) => setSelectedComuna(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 pr-6 text-[11px] text-white focus:outline-none focus:border-cyan-500 appearance-none truncate"
                    >
                      <option value="">Todas las Comunas</option>
                      {availableComunas.map((comuna) => (
                        <option key={comuna} value={comuna}>{comuna}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de lugares desplazable con el pulgar */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-8 scrollbar-thin scrollbar-thumb-slate-800">
            {places.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="font-semibold text-white">No hay lugares coincidentes</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Prueba cambiando los filtros o la búsqueda.</p>
              </div>
            ) : (
              places.map((place) => (
                <div key={place.id_slug} className="active:scale-[0.99] transition-transform">
                  <PlaceCard
                    place={place}
                    onSelect={onSelectPlace}
                    onViewOnMap={(p) => {
                      onViewOnMap(p);
                      setSnap('peek');
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
