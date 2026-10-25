'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Lugar } from '@/types/lugar';
import { Loader2 } from 'lucide-react';

interface DynamicMapProps {
  lugares: Lugar[];
  selectedPlace?: Lugar | null;
  onSelectPlace?: (place: Lugar) => void;
  onClearSelection?: () => void;
  userLocation?: { lat: number; lng: number } | null;
  targetLocation?: { lat: number; lng: number; zoom?: number } | null;
}

// Carga dinámica de Leaflet sin SSR para evitar errores de referencia 'window'
const LeafletMap = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] rounded-2xl bg-slate-900/80 border border-slate-700/60 flex flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      <span className="text-sm font-medium">Cargando mapa interactivo de Ecuador...</span>
    </div>
  ),
});

export const DynamicMap: React.FC<DynamicMapProps> = (props) => {
  return <LeafletMap {...props} />;
};

export default DynamicMap;
