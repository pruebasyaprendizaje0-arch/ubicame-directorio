'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Lugar } from '@/types/lugar';
import { formatDistance } from '@/lib/geo';
import { getPlaceActionConfig } from '@/lib/placeActions';

interface MapViewProps {
  lugares: Lugar[];
  selectedPlace?: Lugar | null;
  onSelectPlace?: (place: Lugar) => void;
  userLocation?: { lat: number; lng: number } | null;
}

// Helper to sanitize icon path
function getIconSrc(icono: string): string {
  if (icono.startsWith('/') || icono.startsWith('http')) {
    return icono;
  }
  return `/icons/${icono}`;
}

// Custom Leaflet DivIcon with local SVG and priority colors
function createCustomMarkerIcon(lugar: Lugar) {
  const iconSrc = getIconSrc(lugar.icono);
  const isP1 = lugar.prioridad === 1 || lugar.origen === 'ubicame_cc';
  const isRef = lugar.es_referencia;

  let borderColor = '#06b6d4'; // Cyan default
  let glowColor = 'rgba(6, 182, 212, 0.4)';
  let bgBadge = '#0f172a';

  if (isP1) {
    borderColor = '#f59e0b'; // Gold
    glowColor = 'rgba(245, 158, 11, 0.5)';
  } else if (isRef) {
    borderColor = '#a855f7'; // Purple
    glowColor = 'rgba(168, 85, 247, 0.4)';
  }

  const html = `
    <div style="
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${bgBadge};
      border: 2.5px solid ${borderColor};
      border-radius: 50%;
      box-shadow: 0 4px 14px ${glowColor};
      cursor: pointer;
      transition: transform 0.2s ease;
    ">
      <img src="${iconSrc}" style="width: 20px; height: 20px; filter: invert(1); object-fit: contain;" alt="${lugar.tipo}" onerror="this.src='/icons/lugar.svg'" />
      ${isP1 ? `<div style="position: absolute; top: -5px; right: -5px; width: 14px; height: 14px; background: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #000; font-weight: bold;">★</div>` : ''}
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
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

// Controller to smoothly pan to selected place or user GPS
function MapController({
  selectedPlace,
  userLocation,
}: {
  selectedPlace?: Lugar | null;
  userLocation?: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) {
      map.flyTo([selectedPlace.latitud, selectedPlace.longitud], 15, {
        duration: 1.2,
      });
    } else if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, {
        duration: 1.2,
      });
    }
  }, [selectedPlace, userLocation, map]);

  return null;
}

export const MapView: React.FC<MapViewProps> = ({
  lugares,
  selectedPlace,
  onSelectPlace,
  userLocation,
}) => {
  // Center in coastal Santa Elena: Montañita / Olón / Manglaralto area (-1.82, -80.75)
  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [-1.82, -80.75];

  return (
    <div className="w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl relative">
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

        <MapController selectedPlace={selectedPlace} userLocation={userLocation} />

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
          const isP1 = place.prioridad === 1 || place.origen === 'ubicame_cc';
          const icon = createCustomMarkerIcon(place);
          const iconSrc = getIconSrc(place.icono);

          return (
            <Marker
              key={place.id_slug}
              position={[place.latitud, place.longitud]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectPlace && onSelectPlace(place),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[200px] text-slate-900">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={iconSrc}
                        alt={place.tipo}
                        className="w-4 h-4 invert object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/icons/lugar.svg';
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs leading-tight text-slate-950">
                        {place.nombre}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-cyan-700 font-semibold">
                          {place.zona}, {place.ciudad}
                        </span>
                        {place.distancia_km !== undefined && (
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                            {formatDistance(place.distancia_km)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {place.descripcion && (
                    <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                      {place.descripcion}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200">
                    {place.url_perfil && (
                      <a
                        href={place.url_perfil}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1 px-2 rounded text-[10.5px] font-bold bg-amber-500 text-slate-950 text-center hover:bg-amber-400 transition-colors"
                      >
                        {getPlaceActionConfig(place).label}
                      </a>
                    )}
                    {place.whatsapp && (
                      <a
                        href={`https://wa.me/${place.whatsapp.replace(/\+/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1 px-2 rounded text-[10.5px] font-semibold bg-emerald-600 text-white text-center hover:bg-emerald-500 transition-colors"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
