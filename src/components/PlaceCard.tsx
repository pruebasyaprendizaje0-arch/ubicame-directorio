'use client';

import React from 'react';
import { Lugar } from '@/types/lugar';
import { formatDistance } from '@/lib/geo';
import { getPlaceActionConfig } from '@/lib/placeActions';
import {
  MapPin,
  MessageCircle,
  ExternalLink,
  Navigation,
  Sparkles,
  ShieldCheck,
  UtensilsCrossed,
  ShoppingBag,
  Wrench,
  Calendar,
  BedDouble,
} from 'lucide-react';

interface PlaceCardProps {
  place: Lugar;
  onSelect?: (place: Lugar) => void;
  onViewOnMap?: (place: Lugar) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onSelect, onViewOnMap }) => {
  const isP1 = place.prioridad === 1 || place.origen === 'ubicame_cc';
  const isVerified = place.prioridad === 2;

  const iconSrc = place.icono.startsWith('/') || place.icono.startsWith('http')
    ? place.icono
    : `/icons/${place.icono}`;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitud},${place.longitud}`;
  const whatsappUrl = place.whatsapp ? `https://wa.me/${place.whatsapp.replace(/\+/g, '')}` : undefined;

  const actionConfig = getPlaceActionConfig(place);

  const renderActionIcon = () => {
    switch (actionConfig.actionType) {
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
    <article
      className={`relative rounded-xl p-4 transition-all duration-200 border ${
        isP1
          ? 'bg-gradient-to-b from-slate-900/95 via-amber-950/15 to-slate-900/95 border-amber-500/40 shadow-md shadow-amber-500/5 hover:border-amber-400'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-3">
          {/* Category SVG Icon */}
          <div
            className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 border ${
              isP1
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-800/80 border-slate-700/80 text-cyan-400'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={iconSrc}
              alt={place.tipo}
              className="w-6 h-6 invert object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/icons/lugar.svg';
              }}
            />
          </div>

          <div>
            <h3
              onClick={() => onSelect && onSelect(place)}
              className="text-base font-bold text-white leading-tight cursor-pointer hover:text-cyan-300 transition-colors"
            >
              {place.nombre}
            </h3>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-cyan-400 mt-0.5">
              <div className="flex items-center gap-1">
                <MapPin size={12} className="flex-shrink-0" />
                <span>{place.zona}, {place.ciudad}</span>
              </div>

              {place.distancia_km !== undefined && (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded text-[11px] border border-emerald-500/30">
                  <Navigation size={10} className="rotate-45" />
                  <span>{formatDistance(place.distancia_km)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {isP1 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm">
              <Sparkles size={11} className="text-amber-400" />
              <span>Destacado ubicame.cc</span>
            </span>
          )}
          {isVerified && !isP1 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              <ShieldCheck size={11} />
              <span>Verificado</span>
            </span>
          )}
          {place.es_referencia && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-purple-500/10 border border-purple-500/30 text-purple-300">
              Punto Clave
            </span>
          )}
        </div>
      </div>

      {place.descripcion && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {place.descripcion}
        </p>
      )}

      {/* Action Buttons Row: 2x2 grid on small screens, horizontal flex on tablets/PC */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 pt-2.5 border-t border-slate-800/80">
        {/* Enlace directo a la acción específica de ubicame.cc (Menú, Catálogo, Cotizar, Citas o Reservas) */}
        {place.url_perfil && (
          <a
            href={place.url_perfil}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-2.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 transition-all shadow-sm"
          >
            {renderActionIcon()}
            <span>{actionConfig.label}</span>
            <ExternalLink size={11} className="opacity-75" />
          </a>
        )}

        {/* WhatsApp Directo */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white active:scale-95 transition-all"
          >
            <MessageCircle size={13} />
            <span>WhatsApp</span>
          </a>
        )}

        {/* Ver en Mapa Local */}
        {onViewOnMap && (
          <button
            onClick={() => onViewOnMap(place)}
            className="col-span-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            title="Ubicar en el mapa interactivo"
          >
            <MapPin size={13} />
            <span>Mapa</span>
          </button>
        )}

        {/* Navegación GPS Externa (Google Maps) */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 text-cyan-300 hover:text-cyan-200 hover:bg-slate-700 active:scale-95 transition-all"
          title="Cómo llegar con Google Maps"
        >
          <Navigation size={13} />
          <span>GPS</span>
        </a>
      </div>
    </article>
  );
};

export default PlaceCard;
