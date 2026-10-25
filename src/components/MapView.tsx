'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Lugar } from '@/types/lugar';
import { formatDistance } from '@/lib/geo';
import { getPlaceActionConfig } from '@/lib/placeActions';
import { X, Layers, MessageCircle, ExternalLink, Navigation, MapPin } from 'lucide-react';

interface MapViewProps {
  lugares: Lugar[];
  selectedPlace?: Lugar | null;
  onSelectPlace?: (place: Lugar) => void;
  onClearSelection?: () => void;
  userLocation?: { lat: number; lng: number } | null;
  targetLocation?: { lat: number; lng: number; zoom?: number } | null;
}

// Helper to sanitize icon path
function getIconSrc(icono: string): string {
  if (icono.startsWith('/') || icono.startsWith('http')) {
    return icono;
  }
  return `/icons/${icono}`;
}

import { CategoryStyle, getCategoryStyle } from '@/lib/categoryStyles';
export { type CategoryStyle, getCategoryStyle };

// Custom Leaflet DivIcon with category colors + spotlight effect
function createCustomMarkerIcon(
  lugar: Lugar,
  isSelected: boolean,
  hasSelection: boolean
) {
  const iconSrc = getIconSrc(lugar.icono);
  const isP1 = lugar.prioridad === 1 || lugar.origen === 'ubicame_cc';
  const category = getCategoryStyle(lugar);

  const size = isSelected ? 48 : 38;
  const half = size / 2;
  const iconImgSize = isSelected ? 24 : 18;

  let pulseRingHtml = '';
  let containerStyle = '';

  if (isSelected) {
    // Spotlight Effect: Multi-layer Glowing Halo + Pulse Ring
    containerStyle = `
      width: ${size}px;
      height: ${size}px;
      background: #090d16;
      border: 3.5px solid #ffffff;
      outline: 3px solid ${category.borderColor};
      outline-offset: 1px;
      border-radius: 50%;
      box-shadow: 0 0 25px ${category.borderColor}, 0 0 10px rgba(255, 255, 255, 0.9), 0 10px 30px rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      z-index: 1000;
      animation: markerPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    pulseRingHtml = `
      <div class="spotlight-pulse-ring" style="
        position: absolute;
        inset: -12px;
        border-radius: 50%;
        border: 2.5px solid ${category.borderColor};
        pointer-events: none;
      "></div>
    `;
  } else {
    // Normal or Dimmed
    const dimmingStyle = hasSelection
      ? 'opacity: 0.38; filter: saturate(0.6) brightness(0.85); transform: scale(0.92);'
      : 'opacity: 1; transform: scale(1);';

    containerStyle = `
      width: ${size}px;
      height: ${size}px;
      background: #0f172a;
      border: 2.5px solid ${category.borderColor};
      border-radius: 50%;
      box-shadow: 0 3px 12px ${category.glowColor};
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      ${dimmingStyle}
    `;
  }

  const starBadge = isP1
    ? `<div style="
        position: absolute;
        top: -4px;
        right: -4px;
        width: 15px;
        height: 15px;
        background: #f59e0b;
        border: 1.5px solid #0f172a;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        color: #000;
        font-weight: 900;
        box-shadow: 0 1px 4px rgba(0,0,0,0.5);
      ">★</div>`
    : '';

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
      ${pulseRingHtml}
      <div style="${containerStyle}">
        <img src="${iconSrc}" style="width: ${iconImgSize}px; height: ${iconImgSize}px; filter: invert(1); object-fit: contain;" alt="${lugar.tipo}" onerror="this.src='/icons/lugar.svg'" />
        ${starBadge}
      </div>
    </div>
  `;

  return L.divIcon({
    className: `custom-leaflet-marker ${isSelected ? 'marker-selected' : ''}`,
    html,
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half - 6],
  });
}

// User GPS position pulsing marker
function createUserMarkerIcon() {
  const html = `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        background: rgba(14, 165, 233, 0.35);
        border-radius: 50%;
        animation: pulse 2s infinite ease-out;
      "></div>
      <div style="
        position: relative;
        width: 16px;
        height: 16px;
        background: #0284c7;
        border: 2.5px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(2, 132, 199, 0.8);
      "></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-user-marker',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Controller to smoothly fly to selected place with street zoom 18, target locality, or user GPS
function MapController({
  selectedPlace,
  userLocation,
  targetLocation,
}: {
  selectedPlace?: Lugar | null;
  userLocation?: { lat: number; lng: number } | null;
  targetLocation?: { lat: number; lng: number; zoom?: number } | null;
}) {
  const map = useMap();
  const prevSelectedIdRef = useRef<string | null>(null);
  const prevTargetRef = useRef<{ lat: number; lng: number; zoom?: number } | null>(null);
  const prevUserLocRef = useRef<{ lat: number; lng: number } | null>(null);

  // 1. Zoom a nivel de calle (zoom 18) únicamente cuando se selecciona un lugar
  useEffect(() => {
    if (selectedPlace) {
      if (selectedPlace.id_slug !== prevSelectedIdRef.current) {
        prevSelectedIdRef.current = selectedPlace.id_slug;
        map.flyTo([selectedPlace.latitud, selectedPlace.longitud], 18, {
          duration: 1.25,
          easeLinearity: 0.25,
        });
      }
    } else {
      // IMPORTANTE: Al deseleccionar (pulsar fuera en el mapa), la cámara se queda en la zona actual.
      // NO se ejecuta ningún flyTo de alejamiento.
      prevSelectedIdRef.current = null;
    }
  }, [selectedPlace, map]);

  // 2. Transición cuando el usuario cambia explícitamente de localidad o pueblo en el selector
  useEffect(() => {
    if (!targetLocation) return;
    const prev = prevTargetRef.current;
    const isSame =
      prev &&
      prev.lat === targetLocation.lat &&
      prev.lng === targetLocation.lng &&
      prev.zoom === targetLocation.zoom;

    if (!isSame) {
      prevTargetRef.current = targetLocation;
      map.flyTo([targetLocation.lat, targetLocation.lng], targetLocation.zoom || 14.5, {
        duration: 1.2,
      });
    }
  }, [targetLocation, map]);

  // 3. Transición cuando se activa GPS con nuevas coordenadas del usuario
  useEffect(() => {
    if (!userLocation) return;
    const prev = prevUserLocRef.current;
    const isSame =
      prev &&
      prev.lat === userLocation.lat &&
      prev.lng === userLocation.lng;

    if (!isSame) {
      prevUserLocRef.current = userLocation;
      map.flyTo([userLocation.lat, userLocation.lng], 15, {
        duration: 1.2,
      });
    }
  }, [userLocation, map]);

  return null;
}

// Listen to background map clicks to clear spotlight focus
function MapClickHandler({ onClearSelection }: { onClearSelection?: () => void }) {
  useMapEvents({
    click: () => {
      if (onClearSelection) {
        onClearSelection();
      }
    },
  });
  return null;
}

// Marker component with automatic popup opening on selection
interface PlaceMarkerProps {
  place: Lugar;
  isSelected: boolean;
  hasSelection: boolean;
  onSelect?: (place: Lugar) => void;
}

const PlaceMarker: React.FC<PlaceMarkerProps> = ({
  place,
  isSelected,
  hasSelection,
  onSelect,
}) => {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      // Delay opening popup slightly so flyTo animation settles
      const timer = setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  const icon = useMemo(
    () => createCustomMarkerIcon(place, isSelected, hasSelection),
    [place, isSelected, hasSelection]
  );

  const iconSrc = getIconSrc(place.icono);
  const category = getCategoryStyle(place);
  const isP1 = place.prioridad === 1 || place.origen === 'ubicame_cc';
  const actionConfig = getPlaceActionConfig(place);

  return (
    <Marker
      ref={markerRef}
      position={[place.latitud, place.longitud]}
      icon={icon}
      zIndexOffset={isSelected ? 1500 : 0}
      eventHandlers={{
        click: () => onSelect && onSelect(place),
      }}
    >
      <Popup className="custom-popup" autoPan={false}>
        <div className="min-w-[240px] max-w-[280px] text-slate-100 select-none py-1">
          {/* Header: Icon with category glow + Title + Subtitle */}
          <div className="flex items-start gap-2.5 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{
                backgroundColor: '#0f172a',
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
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
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
              </div>
              <h4 className="font-black text-[13px] text-white leading-snug mt-1 line-clamp-1">
                {place.nombre}
              </h4>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <MapPin size={11} className="text-cyan-400 shrink-0" />
                <span className="truncate">{place.zona}, {place.ciudad}</span>
                {place.distancia_km !== undefined && (
                  <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1 rounded ml-auto shrink-0">
                    {formatDistance(place.distancia_km)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {place.descripcion && (
            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-2.5 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
              {place.descripcion}
            </p>
          )}

          {/* Action Buttons: High-Contrast & Solid */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800">
            {/* Primary Action Button (Menu / Catalog / Profile) */}
            {place.url_perfil && (
              <a
                href={place.url_perfil}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#020617' }}
                className="col-span-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11.5px] font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 !text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span className="truncate">{actionConfig.label}</span>
                <ExternalLink size={12} className="stroke-[2.5] shrink-0" />
              </a>
            )}

            {/* WhatsApp Button */}
            {place.whatsapp && (
              <a
                href={`https://wa.me/${place.whatsapp.replace(/\+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#ffffff' }}
                className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11.5px] font-bold bg-emerald-600 hover:bg-emerald-500 !text-white shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer ${
                  !place.url_perfil ? 'col-span-2' : 'col-span-1'
                }`}
              >
                <MessageCircle size={13} className="shrink-0" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* GPS Navigation Button */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitud},${place.longitud}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#38bdf8' }}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-slate-900 hover:bg-slate-800 !text-cyan-400 border border-slate-700/80 hover:border-cyan-500/50 transition-all cursor-pointer ${
                place.url_perfil && place.whatsapp ? 'col-span-2 mt-0.5' : 'col-span-1'
              }`}
              title="Cómo llegar con Google Maps"
            >
              <Navigation size={12} className="shrink-0" />
              <span>Cómo llegar (GPS)</span>
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export const MapView: React.FC<MapViewProps> = ({
  lugares,
  selectedPlace,
  onSelectPlace,
  onClearSelection,
  userLocation,
  targetLocation,
}) => {
  const [showLegend, setShowLegend] = useState(false);

  // Center in coastal Santa Elena: Montañita / Olón / Manglaralto area (-1.8264, -80.7521)
  const defaultCenter: [number, number] = targetLocation
    ? [targetLocation.lat, targetLocation.lng]
    : userLocation
    ? [userLocation.lat, userLocation.lng]
    : [-1.8264, -80.7521];

  const hasSelection = Boolean(selectedPlace);

  return (
    <div className="w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl relative">
      {/* Floating Category Legend & Active Spotlight Badge */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col items-end gap-1.5 pointer-events-auto">
        {selectedPlace && (
          <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-950/90 border border-white/20 shadow-xl backdrop-blur-md text-[11px] text-white">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold truncate max-w-[120px] sm:max-w-[180px]">
              {selectedPlace.nombre}
            </span>
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="ml-0.5 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Restaurar vista de todos los negocios"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 shadow-lg backdrop-blur-md text-[11px] font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Ver leyenda de colores por categoría"
        >
          <Layers size={12} className="text-cyan-400" />
          <span>Categorías</span>
        </button>

        {showLegend && (
          <div className="p-2.5 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-md space-y-1.5 text-[10.5px] text-slate-300 w-44">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 font-bold text-white text-[11px]">
              <span>Colores del Mapa</span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] ring-2 ring-[#f59e0b]/30 flex-shrink-0" />
              <span>Destacados ubicame.cc</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] ring-2 ring-[#f97316]/30 flex-shrink-0" />
              <span>Gastronomía y Bares</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] ring-2 ring-[#0284c7]/30 flex-shrink-0" />
              <span>Hospedaje y Hoteles</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899] ring-2 ring-[#ec4899]/30 flex-shrink-0" />
              <span>Comercio y Tiendas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] ring-2 ring-[#10b981]/30 flex-shrink-0" />
              <span>Salud y Farmacia</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] ring-2 ring-[#a855f7]/30 flex-shrink-0" />
              <span>Puntos de Referencia</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] ring-2 ring-[#06b6d4]/30 flex-shrink-0" />
              <span>Servicios y Transporte</span>
            </div>
          </div>
        )}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={userLocation ? 14 : 12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '480px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController
          selectedPlace={selectedPlace}
          userLocation={userLocation}
          targetLocation={targetLocation}
        />
        <MapClickHandler onClearSelection={onClearSelection} />

        {/* User GPS location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserMarkerIcon()}
          >
            <Popup className="custom-popup">
              <div className="p-2 text-center">
                <span className="font-bold text-xs text-sky-400">📍 Tu Ubicación Actual</span>
                <p className="text-[11px] text-slate-300 mt-0.5">Mostrando negocios más cercanos</p>
              </div>
            </Popup>
          </Marker>
        )}

        {lugares.map((place) => {
          const isSelected = selectedPlace?.id_slug === place.id_slug;
          return (
            <PlaceMarker
              key={place.id_slug}
              place={place}
              isSelected={isSelected}
              hasSelection={hasSelection}
              onSelect={onSelectPlace}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
