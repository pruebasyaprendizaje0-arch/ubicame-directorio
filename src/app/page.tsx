'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lugar, PlaceFilters } from '@/types/lugar';
import { ZoneList } from '@/components/ZoneList';
import { DynamicMap } from '@/components/DynamicMap';
import {
  MapPin,
  Search,
  X,
  Map as MapIcon,
  List as ListIcon,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function DirectoryPage() {
  const [places, setPlaces] = useState<Lugar[]>([]);
  const [zonas, setZonas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: 'list' or 'map'
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedPlace, setSelectedPlace] = useState<Lugar | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZona, setSelectedZona] = useState<string | undefined>(undefined);
  const [onlyUbicameCc, setOnlyUbicameCc] = useState(false);

  // Fetch data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedZona) params.set('zona', selectedZona);
        if (onlyUbicameCc) params.set('solo_ubicame_cc', 'true');

        const res = await fetch(`/api/places?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setPlaces(json.data);
          if (json.zonas) {
            setZonas(json.zonas);
          }
        }
      } catch (err) {
        console.error('Error fetching places:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchQuery, selectedZona, onlyUbicameCc]);

  // Handle locating a place from card to map
  const handleViewOnMap = (place: Lugar) => {
    setSelectedPlace(place);
    setViewMode('map');
  };

  const totalClients = useMemo(() => {
    return places.filter(p => p.prioridad === 1 || p.origen === 'ubicame_cc').length;
  }, [places]);

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Mobile-optimized Header */}
      <header className="sticky top-0 z-40 bg-[#050811]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <MapPin size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tight text-white leading-none">
                  ubicame<span className="text-cyan-400">.info</span>
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  DIRECTORIO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Olón • Montañita • Manglaralto
              </p>
            </div>
          </div>

          <a
            href="https://ubicame.cc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors shadow-sm"
            title="Ir a ubicame.cc para menús y cartas digitales"
          >
            <span>ubicame.cc</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 pb-28">
        {/* Search & Filters Header */}
        <div className="space-y-3 mb-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input
              type="text"
              placeholder="Buscar restaurante, hotel, taxi, playa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Zone Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedZona(undefined)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                selectedZona === undefined
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              Todas las zonas
            </button>
            {zonas.map((zona) => (
              <button
                key={zona}
                onClick={() => setSelectedZona(selectedZona === zona ? undefined : zona)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                  selectedZona === zona
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {zona}
              </button>
            ))}

            {/* Toggle ubicame.cc clients */}
            <button
              onClick={() => setOnlyUbicameCc(!onlyUbicameCc)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                onlyUbicameCc
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <Sparkles size={12} />
              <span>Con Menú ubicame.cc</span>
            </button>
          </div>

          {/* Result Count and View Summary */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Mostrando <strong className="text-white font-bold">{places.length}</strong> lugares
              {totalClients > 0 && (
                <span className="text-amber-400 ml-1">
                  ({totalClients} con menú en vivo)
                </span>
              )}
            </span>
            <span className="text-slate-500">
              {viewMode === 'list' ? 'Vista en acordeón' : 'Vista mapa interactivo'}
            </span>
          </div>
        </div>

        {/* Content Area: List vs Map */}
        {viewMode === 'list' ? (
          <ZoneList
            lugares={places}
            onSelectPlace={(place) => handleViewOnMap(place)}
            onViewOnMap={handleViewOnMap}
          />
        ) : (
          <div className="h-[72vh] min-h-[500px]">
            <DynamicMap
              lugares={places}
              selectedPlace={selectedPlace}
              onSelectPlace={(place) => setSelectedPlace(place)}
            />
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) to Toggle between List and Map */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => {
            setViewMode(viewMode === 'list' ? 'map' : 'list');
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/25 border border-cyan-400/40 hover:scale-105 active:scale-95 transition-transform"
        >
          {viewMode === 'list' ? (
            <>
              <MapIcon size={18} />
              <span>Ver en mapa</span>
            </>
          ) : (
            <>
              <ListIcon size={18} />
              <span>Ver lista</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
