'use client';

import React, { useState } from 'react';
import {
  X,
  MapPin,
  MessageCircle,
  ExternalLink,
  Navigation,
  Check,
  Share2,
  Sparkles,
  ShieldCheck,
  Landmark,
  Wrench,
  Building,
  UtensilsCrossed,
  ShoppingBag,
  Calendar,
  BedDouble,
} from 'lucide-react';
import { Lugar } from '@/types/lugar';
import { formatDistance } from '@/lib/geo';
import { getPlaceActionConfig } from '@/lib/placeActions';

interface PlaceDetailModalProps {
  place: Lugar | null;
  onClose: () => void;
  onViewOnMap?: (place: Lugar) => void;
  onRelocate?: (place: Lugar) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  onClose,
  onViewOnMap,
  onRelocate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!place) return null;

  const isUbicameClient = place.prioridad === 1 || place.origen === 'ubicame_cc';
  const isVerified = place.prioridad === 2;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitud},${place.longitud}`;
  const whatsappUrl = place.whatsapp
    ? `https://wa.me/${place.whatsapp.replace(/\+/g, '')}`
    : undefined;

  const actionConfig = getPlaceActionConfig(place);

  const renderActionIcon = () => {
    switch (actionConfig.actionType) {
      case 'booking':
        return <BedDouble size={15} className="shrink-0" />;
      case 'appointments':
        return <Calendar size={15} className="shrink-0" />;
      case 'service':
        return <Wrench size={15} className="shrink-0" />;
      case 'catalog':
        return <ShoppingBag size={15} className="shrink-0" />;
      case 'menu':
      default:
        return <UtensilsCrossed size={15} className="shrink-0" />;
    }
  };

  const iconSrc =
    place.icono.startsWith('/') || place.icono.startsWith('http')
      ? place.icono
      : `/icons/${place.icono}`;

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/?q=${encodeURIComponent(place.nombre)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#040711]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-lg bg-[#0d1322] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-7 shadow-2xl relative max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 animate-slide-up sm:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thumb Pull Down Bar on Mobile */}
        <div className="w-12 h-1 rounded-full bg-slate-600/70 mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        {/* Header with Icon, Name & Location */}
        <div className="flex items-start gap-3.5 mb-4 pr-8">
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0 border p-2.5 ${
              isUbicameClient
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-cyan-400'
            }`}
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

          <div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              {place.nombre}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 mt-1">
              <MapPin size={13} className="flex-shrink-0 text-cyan-400" />
              <span>
                {place.zona}, {place.ciudad} ({place.provincia})
              </span>
            </div>
            {place.distancia_km !== undefined && (
              <span className="inline-block mt-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] border border-emerald-500/30">
                {formatDistance(place.distancia_km)}
              </span>
            )}
          </div>
        </div>

        {/* Badges / Badging Row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {isUbicameClient && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
              <Sparkles size={12} className="text-amber-400" />
              <span>Cliente Oficial ubicame.cc (P1)</span>
            </span>
          )}
          {isVerified && !isUbicameClient && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/40 text-cyan-300">
              <ShieldCheck size={12} />
              <span>Verificado</span>
            </span>
          )}
          {place.es_referencia && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/40 text-purple-300">
              <Landmark size={12} />
              <span>Punto de Referencia</span>
            </span>
          )}
          {place.es_servicio && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              <Wrench size={12} />
              <span>Servicio de Urgencia</span>
            </span>
          )}
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60">
            {place.tipo}
          </span>
        </div>

        {/* Description */}
        {place.descripcion && (
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
            {place.descripcion}
          </div>
        )}

        {/* 4-Level Territorial Breakdown */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 mb-5 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Provincia</span>
            <div className="font-semibold text-white mt-0.5">{place.provincia}</div>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Cantón</span>
            <div className="font-semibold text-white mt-0.5">{place.ciudad}</div>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Parroquia</span>
            <div className="font-semibold text-white mt-0.5">{place.parroquia || 'Manglaralto'}</div>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Comuna / Sector</span>
            <div className="font-semibold text-white mt-0.5">{place.comuna || place.zona}</div>
          </div>
        </div>

        {/* Action Buttons: 2x2 grid on mobile, responsive row on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-2 border-t border-slate-800">
          {place.url_perfil && (
            <a
              href={place.url_perfil}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 sm:flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 transition-all shadow-md"
            >
              {renderActionIcon()}
              <span>{actionConfig.detailLabel}</span>
              <ExternalLink size={13} className="opacity-75" />
            </a>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-1 sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white active:scale-95 transition-all"
            >
              <MessageCircle size={14} />
              <span>WhatsApp</span>
            </a>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 text-cyan-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
            title="Cómo llegar con Google Maps"
          >
            <Navigation size={14} />
            <span>GPS</span>
          </a>

          {onViewOnMap && (
            <button
              onClick={() => {
                onViewOnMap(place);
                onClose();
              }}
              className="col-span-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <MapPin size={14} />
              <span>Ver Mapa</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="col-span-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            title="Copiar enlace"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            <span>{copied ? 'Copiado' : 'Compartir'}</span>
          </button>
        </div>

        {/* Sección Reubicar Icono (Opción 2) */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
            <span>¿Ubicación inexacta en el mapa?</span>
          </div>
          {onRelocate ? (
            <button
              onClick={() => {
                onRelocate(place);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-500/30 transition-all cursor-pointer active:scale-95"
            >
              <span>🛰️ Soy el dueño: Reubicar</span>
            </button>
          ) : (
            <a
              href={`/mi-negocio?slug=${place.id_slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-500/30 transition-all active:scale-95"
            >
              <span>🛰️ Soy el dueño: Reubicar</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailModal;
