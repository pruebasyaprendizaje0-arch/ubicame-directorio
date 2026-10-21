'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: string;
  zoom?: number;
  readOnly?: boolean;
}

const DynamicLocationPicker = dynamic(() => import('@/components/LocationPickerMapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400">
      <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
      <span className="text-xs font-semibold">Cargando mapa satelital de precisión...</span>
    </div>
  ),
});

export const LocationPickerMap: React.FC<LocationPickerMapProps> = (props) => {
  return <DynamicLocationPicker {...props} />;
};

export default LocationPickerMap;
