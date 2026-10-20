'use client';

import React, { useState } from 'react';
import { Lugar } from '@/types/lugar';
import { PlaceCard } from '@/components/PlaceCard';
import { ChevronDown, ChevronUp, MapPin, Sparkles } from 'lucide-react';

interface ZoneListProps {
  lugares: Lugar[];
  onSelectPlace?: (place: Lugar) => void;
  onViewOnMap?: (place: Lugar) => void;
  isSplitView?: boolean;
}

export const ZoneList: React.FC<ZoneListProps> = ({
  lugares,
  onSelectPlace,
  onViewOnMap,
  isSplitView = false,
}) => {
  // Group lugares by zona
  const groupedByZone = lugares.reduce<Record<string, Lugar[]>>((acc, lugar) => {
    const zoneName = lugar.zona || 'Otras Zonas';
    if (!acc[zoneName]) acc[zoneName] = [];
    acc[zoneName].push(lugar);
    return acc;
  }, {});

  const zoneNames = Object.keys(groupedByZone).sort((a, b) => a.localeCompare(b, 'es'));

  // Track accordion state: all open by default
  const [openZones, setOpenZones] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    zoneNames.forEach(z => { initial[z] = true; });
    return initial;
  });

  const toggleZone = (zoneName: string) => {
    setOpenZones(prev => ({
      ...prev,
      [zoneName]: !prev[zoneName],
    }));
  };

  if (lugares.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <MapPin className="w-10 h-10 text-slate-500 mx-auto mb-2" />
        <h4 className="text-base font-semibold text-white">No hay lugares para mostrar</h4>
        <p className="text-xs text-slate-400 mt-1">Intenta con otro término de búsqueda o cambia de zona.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {zoneNames.map((zoneName) => {
        const zonePlaces = groupedByZone[zoneName];
        const isOpen = openZones[zoneName] !== false;
        const ubicameClientsCount = zonePlaces.filter(p => p.prioridad === 1 || p.origen === 'ubicame_cc').length;

        return (
          <section
            key={zoneName}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-sm"
          >
            {/* Accordion Header: ZONA: {nombre} ({total} lugares) */}
            <button
              onClick={() => toggleZone(zoneName)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-slate-900/80 hover:bg-slate-800/60 transition-colors text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <h3 className="text-sm sm:text-base font-extrabold tracking-wide text-white">
                  ZONA: <span className="text-cyan-400">{zoneName.toUpperCase()}</span>{' '}
                  <span className="text-slate-400 font-semibold text-xs sm:text-sm">
                    ({zonePlaces.length} {zonePlaces.length === 1 ? 'lugar' : 'lugares'})
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {ubicameClientsCount > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Sparkles size={11} />
                    <span>{ubicameClientsCount} destacado{ubicameClientsCount > 1 ? 's' : ''}</span>
                  </span>
                )}
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
            </button>

            {/* Accordion Body */}
            {isOpen && (
              <div
                className={`p-3.5 sm:p-4 pt-2 grid gap-3 ${
                  isSplitView
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {zonePlaces.map((place) => (
                  <PlaceCard
                    key={place.id_slug}
                    place={place}
                    onSelect={onSelectPlace}
                    onViewOnMap={onViewOnMap}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default ZoneList;
