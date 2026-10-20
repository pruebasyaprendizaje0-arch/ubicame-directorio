'use client';

import React from 'react';
import { Lugar } from '@/types/lugar';
import { MapPin, MessageCircle, ExternalLink, Navigation, Sparkles, ShieldCheck } from 'lucide-react';

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
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 mt-0.5">
              <MapPin size={12} className="flex-shrink-0" />
              <span>{place.zona}, {place.ciudad}</span>
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

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
        {/* Enlace directo al Menú en ubicame.cc */}
        {place.url_perfil && (
          <a
            href={place.url_perfil}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
          >
            <span>Ver Menú</span>
            <ExternalLink size={12} />
          </a>
        )}

        {/* WhatsApp Directo */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-colors"
          >
            <MessageCircle size={13} />
            <span>WhatsApp</span>
          </a>
        )}

        {/* Ver en Mapa */}
        {onViewOnMap && (
          <button
            onClick={() => onViewOnMap(place)}
            className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1"
            title="Ubicar en el mapa"
          >
            <MapPin size={13} />
            <span className="hidden sm:inline">Mapa</span>
          </button>
        )}

        {/* GPS */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1"
          title="Cómo llegar con GPS"
        >
          <Navigation size={13} />
          <span>GPS</span>
        </a>
      </div>
    </article>
  );
};

export default PlaceCard;
