'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Layers, Crosshair, MapPin, Navigation, Compass } from 'lucide-react';

interface LocationPickerMapViewProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: string;
  zoom?: number;
  readOnly?: boolean;
}

// Icono de precisión con punto de mira (Crosshair)
function createPickerMarkerIcon() {
  const html = `
    <div style="
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    ">
      <!-- Pulso de radar exterior -->
      <div style="
        position: absolute;
        width: 44px;
        height: 44px;
        background: rgba(6, 182, 212, 0.25);
        border: 1.5px dashed #06b6d4;
        border-radius: 50%;
        animation: spin 8s linear infinite;
      "></div>

      <!-- Pin central con sombra de contraste -->
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        background: #06b6d4;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.8), 0 0 12px rgba(6, 182, 212, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
      </div>

      <!-- Flecha indicadora de base hacia abajo -->
      <div style="
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 8px solid #06b6d4;
      "></div>
    </div>
  `;

  return L.divIcon({
    className: 'picker-marker-custom',
    html,
    iconSize: [44, 44],
    iconAnchor: [22, 42],
  });
}

// Escuchador de clics en el mapa para mover el pin
function MapClickHandler({
  onClick,
  disabled,
}: {
  onClick: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Controlador para centrar suavemente el mapa cuando cambian las coordenadas externas
function MapCenterController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

export const LocationPickerMapView: React.FC<LocationPickerMapViewProps> = ({
  lat,
  lng,
  onChange,
  height = '320px',
  zoom = 17,
  readOnly = false,
}) => {
  const [layerType, setLayerType] = useState<'satellite' | 'streets'>('satellite');
  const [isLocating, setIsLocating] = useState(false);
  const markerRef = useRef<L.Marker>(null);

  const markerIcon = useMemo(() => createPickerMarkerIcon(), []);

  // Manejador de evento al arrastrar el pin
  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const position = marker.getLatLng();
      onChange({
        lat: Number(position.lat.toFixed(6)),
        lng: Number(position.lng.toFixed(6)),
      });
    }
  };

  // Manejador al hacer clic en el mapa
  const handleMapClick = (clickLat: number, clickLng: number) => {
    onChange({
      lat: Number(clickLat.toFixed(6)),
      lng: Number(clickLng.toFixed(6)),
    });
  };

  // Geolocalización física en el local
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert('No se pudo obtener el GPS actual del dispositivo.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const safeLat = !isNaN(lat) && lat !== 0 ? lat : -1.804;
  const safeLng = !isNaN(lng) && lng !== 0 ? lng : -80.73;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner bg-slate-950">
      {/* Controles flotantes superiores */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none">
        {/* Toggle de capa Satelital / Calles */}
        <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-1 pointer-events-auto">
          <button
            type="button"
            onClick={() => setLayerType('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              layerType === 'satellite'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🛰️ Satélite Aéreo</span>
          </button>
          <button
            type="button"
            onClick={() => setLayerType('streets')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              layerType === 'streets'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🗺️ Calles</span>
          </button>
        </div>

        {/* Botón GPS físico */}
        {!readOnly && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-cyan-500/40 shadow-lg backdrop-blur-md flex items-center gap-1.5 pointer-events-auto transition-all cursor-pointer active:scale-95"
            title="Usar mi ubicación GPS actual si estoy físicamente en el local"
          >
            <Navigation size={13} className={isLocating ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Estoy en mi local</span>
          </button>
        )}
      </div>

      {/* Mapa Leaflet */}
      <div style={{ height }}>
        <MapContainer
          center={[safeLat, safeLng]}
          zoom={zoom}
          maxZoom={19}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {layerType === 'satellite' ? (
            // Capa Satelital de Alta Resolución (Esri World Imagery)
            <TileLayer
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              maxNativeZoom={18}
            />
          ) : (
            // Capa de Calles (OpenStreetMap)
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          <MapCenterController lat={safeLat} lng={safeLng} />
          <MapClickHandler onClick={handleMapClick} disabled={readOnly} />

          <Marker
            position={[safeLat, safeLng]}
            icon={markerIcon}
            draggable={!readOnly}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
            ref={markerRef}
          />
        </MapContainer>
      </div>

      {/* Barra de estado inferior con coordenadas exactas e instrucción */}
      <div className="bg-[#080d1a] px-3.5 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-400">
          <Crosshair size={13} className="text-cyan-400 shrink-0" />
          <span>{safeLat.toFixed(6)}, {safeLng.toFixed(6)}</span>
        </div>

        {!readOnly ? (
          <span className="text-[10.5px] text-slate-400">
            👉 Haz clic o <strong>arrastra el pin</strong> al techo del local
          </span>
        ) : (
          <span className="text-[10.5px] text-slate-400">Posición fijada</span>
        )}
      </div>
    </div>
  );
};

export default LocationPickerMapView;
