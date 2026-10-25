'use client';

import React from 'react';
import { Lugar } from '@/types/lugar';
import { formatDistance } from '@/lib/geo';
import { getPlaceActionConfig } from '@/lib/placeActions';
import { getCategoryStyle, getCategoryCoverBanner } from '@/lib/categoryStyles';
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
  Flame,
} from 'lucide-react';

interface PlaceCardProps {
  place: Lugar;
  onSelect?: (place: Lugar) => void;
  onViewOnMap?: (place: Lugar) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onSelect, onViewOnMap }) => {
  const isP1 = place.prioridad === 1 || place.origen === 'ubicame_cc';
  const isVerified = place.prioridad === 2;
  const category = getCategoryStyle(place);
  const coverBanner = getCategoryCoverBanner(place);

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
      className={`relative rounded-2xl overflow-hidden transition-all duration-200 border ${
        isP1
          ? 'bg-gradient-to-b from-slate-900/95 via-amber-950/15 to-slate-900/95 border-amber-500/40 shadow-md shadow-amber-500/5 hover:border-amber-400'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Mini Cover Banner de Portada Comercial (Idea 1) */}
      <div
        onClick={() => onSelect && onSelect(place)}
        className="relative w-full h-28 sm:h-32 overflow-hidden bg-slate-950 cursor-pointer group"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverBanner}
          alt={`Portada de ${place.nombre}`}
          className="w-full h-full object-cover object-center filter brightness-[0.88] group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-black/25" />

        {/* Badges on top of cover */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          {isP1 ? (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md flex items-center gap-1">
              <Sparkles size={10} className="fill-slate-950" />
              <span>ubicame.cc</span>
            </span>
          ) : isVerified ? (
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow">
              Verificado
            </span>
          ) : null}

          {place.tiene_promo && (
            <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg flex items-center gap-1 border border-orange-300/40 animate-pulse">
              <Flame size={10} className="fill-white" />
              <span>{place.campana_destacada?.badge || 'Promo Activa'}</span>
            </span>
          )}

          <span
            className="text-[9.5px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow"
            style={{
              backgroundColor: `${category.borderColor}30`,
              color: category.borderColor,
              border: `1px solid ${category.borderColor}60`,
            }}
          >
            {category.name}
          </span>
        </div>

        {/* Floating Category Icon overlapping bottom-left */}
        <div
          className="absolute -bottom-2.5 left-3 w-11 h-11 rounded-xl flex items-center justify-center p-2 shadow-xl backdrop-blur-md"
          style={{
            backgroundColor: '#090e1a',
            border: `2px solid ${category.borderColor}`,
            boxShadow: `0 4px 14px ${category.glowColor}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={iconSrc}
            alt={place.tipo}
            className="w-full h-full invert object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/icons/lugar.svg';
            }}
          />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 pt-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3
              onClick={() => onSelect && onSelect(place)}
              className="text-base font-black text-white leading-tight cursor-pointer hover:text-cyan-300 transition-colors truncate"
            >
              {place.nombre}
            </h3>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-cyan-400 mt-1">
              <div className="flex items-center gap-1">
                <MapPin size={12} className="flex-shrink-0" />
                <span className="truncate">{place.zona}, {place.ciudad}</span>
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

        {/* Promo / Evento Destacado */}
        {place.tiene_promo && place.campana_destacada && (
          <div
            onClick={() => onSelect && onSelect(place)}
            className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-orange-950/70 via-amber-950/50 to-slate-900 border border-orange-500/40 cursor-pointer hover:border-orange-400 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between text-[10px] font-black uppercase text-orange-400">
              <span className="flex items-center gap-1">
                <Flame size={11} className="text-orange-400 fill-orange-400" />
                <span>{place.campana_destacada.badge || 'Promo Activa'}</span>
              </span>
              {place.campana_destacada.dias_semana && (
                <span className="text-slate-400 font-normal lowercase">{place.campana_destacada.dias_semana}</span>
              )}
            </div>
            <div className="text-xs font-bold text-white mt-0.5 truncate">
              {place.campana_destacada.titulo}
            </div>
            {place.campana_destacada.hora_inicio && (
              <div className="text-[10px] text-amber-300 font-bold mt-0.5">
                ⏰ {place.campana_destacada.hora_inicio} {place.campana_destacada.hora_fin ? `- ${place.campana_destacada.hora_fin}` : ''}
              </div>
            )}
          </div>
        )}

        {place.descripcion && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {place.descripcion}
          </p>
        )}

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 pt-2.5 border-t border-slate-800/80">
          {place.url_perfil && (
            <a
              href={place.url_perfil}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-1 sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 active:scale-95 transition-all shadow-md shadow-amber-500/20 truncate"
            >
              {renderActionIcon()}
              <span className="truncate">{actionConfig.label}</span>
              <ExternalLink size={12} className="stroke-[2.5] shrink-0" />
            </a>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-1 sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-950/40 hover:bg-emerald-500 active:scale-95 transition-all"
            >
              <MessageCircle size={14} />
              <span>WhatsApp</span>
            </a>
          )}

          {onViewOnMap && (
            <button
              onClick={() => onViewOnMap(place)}
              className="col-span-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 text-slate-100 border border-slate-700/80 hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-400 active:scale-95 transition-all cursor-pointer shadow-sm"
              title="Ubicar en el mapa interactivo"
            >
              <MapPin size={13} />
              <span>Mapa</span>
            </button>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 text-cyan-300 hover:text-white hover:bg-slate-700 border border-slate-700/80 active:scale-95 transition-all shadow-sm"
            title="Cómo llegar con Google Maps"
          >
            <Navigation size={13} />
            <span>GPS</span>
          </a>
        </div>
      </div>
    </article>
  );
};

export default PlaceCard;
