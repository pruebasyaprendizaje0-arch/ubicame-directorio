'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Lugar } from '@/types/lugar';

interface MapViewProps {
  lugares: Lugar[];
  selectedPlace?: Lugar | null;
  onSelectPlace?: (place: Lugar) => void;
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

// Controller to smoothly pan to selected place
function MapController({ selectedPlace }: { selectedPlace?: Lugar | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) {
      map.flyTo([selectedPlace.latitud, selectedPlace.longitud], 15, {
        duration: 1.2,
      });
    }
  }, [selectedPlace, map]);

  return null;
}

export const MapView: React.FC<MapViewProps> = ({
  lugares,
  selectedPlace,
  onSelectPlace,
}) => {
  // Center in coastal Santa Elena: Montañita / Olón / Manglaralto area (-1.82, -80.75)
  const defaultCenter: [number, number] = [-1.82, -80.75];

  return (
    <div className="w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl relative">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '480px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController selectedPlace={selectedPlace} />

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
              <Popup className="custom-leaflet-popup">
                <div style={{ minWidth: '220px', padding: '4px', color: '#0f172a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '28px', height: '28px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={iconSrc} width="16" height="16" alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/icons/lugar.svg'; }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', lineHeight: 1.2 }}>
                        {place.nombre}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                        {place.zona} • {place.tipo}
                      </span>
                    </div>
                  </div>

                  {isP1 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '9999px', padding: '2px 8px', fontSize: '10.5px', fontWeight: 'bold', marginBottom: '8px' }}>
                      ★ Destacado ubicame.cc
                    </div>
                  )}

                  {place.descripcion && (
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                      {place.descripcion}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {place.url_perfil && (
                      <a
                        href={place.url_perfil}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ flex: 1, textAlign: 'center', background: '#d97706', color: '#fff', textDecoration: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        Ver Menú ↗
                      </a>
                    )}
                    {place.whatsapp && (
                      <a
                        href={`https://wa.me/${place.whatsapp.replace(/\+/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ flex: 1, textAlign: 'center', background: '#16a34a', color: '#fff', textDecoration: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}
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
