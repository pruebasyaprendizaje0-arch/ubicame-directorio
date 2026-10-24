'use client';

import React, { useState, useEffect } from 'react';
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
  UtensilsCrossed,
  ShoppingBag,
  Calendar,
  BedDouble,
  Camera,
} from 'lucide-react';
import { Lugar } from '@/types/lugar';
import { formatDistance } from '@/lib/geo';
import { getPlaceActionConfig } from '@/lib/placeActions';
import { getCategoryStyle, getCategoryCoverBanner } from '@/lib/categoryStyles';
import { EditBannerModal } from '@/components/EditBannerModal';

interface PlaceDetailModalProps {
  place: Lugar | null;
  onClose: () => void;
  onViewOnMap?: (place: Lugar) => void;
  onRelocate?: (place: Lugar) => void;
  onPlaceUpdated?: (updated: Lugar) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  onClose,
  onViewOnMap,
  onRelocate,
  onPlaceUpdated,
}) => {
  const [currentPlace, setCurrentPlace] = useState<Lugar | null>(place);
  const [isEditBannerOpen, setIsEditBannerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setCurrentPlace(place);
  }, [place]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.authenticated) setIsAdmin(true);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  if (!place) return null;
  const activePlace = currentPlace || place;

  const isUbicameClient = activePlace.prioridad === 1 || activePlace.origen === 'ubicame_cc';
  const isVerified = activePlace.prioridad === 2;
  const category = getCategoryStyle(activePlace);
  const coverBannerUrl = getCategoryCoverBanner(activePlace);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${activePlace.latitud},${activePlace.longitud}`;
  const whatsappUrl = activePlace.whatsapp
    ? `https://wa.me/${activePlace.whatsapp.replace(/\+/g, '')}`
    : undefined;

  const actionConfig = getPlaceActionConfig(activePlace);

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
    activePlace.icono.startsWith('/') || activePlace.icono.startsWith('http')
      ? activePlace.icono
      : `/icons/${activePlace.icono}`;

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/?q=${encodeURIComponent(activePlace.nombre)}`;
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
        className="w-full sm:max-w-xl bg-[#0c1322] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl relative max-h-[88vh] sm:max-h-[92vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 animate-slide-up sm:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            1. HERO HEADER PANORÁMICO INMERSIVO (IDEA 1)
            Banner comercial o vitrina oficial de ubicame.cc
            ======================================================== */}
        <div className="relative w-full h-48 sm:h-56 bg-slate-950 overflow-hidden shrink-0 group">
          {/* Imagen de Portada / Banner Comercial */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverBannerUrl}
            alt={`Banner comercial de ${activePlace.nombre}`}
            className="w-full h-full object-cover object-center filter brightness-[0.88] transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
            }}
          />

          {/* Gradiente cinemático de fusión hacia la base */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1322] via-[#0c1322]/40 to-black/35 pointer-events-none" />

          {/* Pull Down Bar en Móvil */}
          <div className="absolute top-2 inset-x-0 flex justify-center z-30 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/40 shadow" />
          </div>

          {/* Insignia Superior Izquierda */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 flex-wrap">
            {isUbicameClient ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg backdrop-blur-md">
                <Sparkles size={12} className="text-slate-950 fill-current" />
                <span>Cliente Oficial ubicame.cc</span>
              </span>
            ) : isVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow backdrop-blur-md">
                <ShieldCheck size={12} />
                <span>Verificado</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold shadow backdrop-blur-md"
                style={{
                  backgroundColor: `${category.borderColor}30`,
                  color: category.borderColor,
                  border: `1px solid ${category.borderColor}60`,
                }}
              >
                {category.name}
              </span>
            )}
          </div>

          {/* Botón para Cambiar / Poner Portada o Banner Comercial */}
          <button
            type="button"
            onClick={() => setIsEditBannerOpen(true)}
            className="absolute top-3 right-12 z-30 px-2.5 py-1 sm:py-1.5 rounded-full bg-black/60 hover:bg-black/85 text-slate-200 hover:text-white border border-white/20 backdrop-blur-md text-[10.5px] font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
            title="Personalizar imagen de portada / banner comercial"
          >
            <Camera size={12} className="text-cyan-400" />
            <span>{activePlace.foto_url ? 'Cambiar Portada' : 'Poner Portada'}</span>
          </button>

          {/* Botón Cerrar Flotante */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-90"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>

          {/* Avatar / Icono Flotante Superpuesto en el borde inferior */}
          <div className="absolute -bottom-5 left-4 sm:left-6 z-20 flex items-end gap-3.5">
            <div
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center p-3 shadow-2xl backdrop-blur-md shrink-0"
              style={{
                backgroundColor: '#090e1a',
                border: `2.5px solid ${category.borderColor}`,
                boxShadow: `0 8px 24px ${category.glowColor}`,
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
        </div>

        {/* ========================================================
            2. CUERPO DEL MODAL (Con Avatar Spacing y Datos Completos)
            ======================================================== */}
        <div className="pt-7 p-4 sm:p-6 space-y-4">
          {/* Nombre del Negocio y Ubicación */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                  {place.nombre}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium mt-1">
                  <MapPin size={13} className="shrink-0 text-cyan-400" />
                  <span>
                    {place.zona}, {place.ciudad} ({place.provincia})
                  </span>
                </div>
              </div>

              {place.distancia_km !== undefined && (
                <span className="inline-block shrink-0 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] border border-emerald-500/30">
                  {formatDistance(place.distancia_km)}
                </span>
              )}
            </div>

            {/* Etiquetas de Rubro / Tipo */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider"
                style={{
                  color: category.borderColor,
                  backgroundColor: `${category.borderColor}15`,
                  border: `1px solid ${category.borderColor}40`,
                }}
              >
                {category.name}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60">
                {place.tipo}
              </span>
              {place.es_servicio && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                  <Wrench size={11} />
                  <span>Servicio Activo</span>
                </span>
              )}
              {place.es_referencia && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/15 border border-purple-500/40 text-purple-300">
                  <Landmark size={11} />
                  <span>Punto Clave</span>
                </span>
              )}
            </div>
          </div>

          {/* Descripción */}
          {place.descripcion && (
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs sm:text-sm leading-relaxed">
              {place.descripcion}
            </div>
          )}

          {/* Desglose Territorial 4 Niveles */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
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

          {/* Botones de Acción */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-2 border-t border-slate-800">
            {place.url_perfil && (
              <a
                href={place.url_perfil}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 sm:flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 active:scale-95 transition-all shadow-md shadow-amber-500/25"
              >
                {renderActionIcon()}
                <span>{actionConfig.detailLabel}</span>
                <ExternalLink size={13} className="stroke-[2.5]" />
              </a>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-1 sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>
            )}

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 text-cyan-300 hover:text-white hover:bg-slate-700 border border-slate-700/80 active:scale-95 transition-all shadow-sm"
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
                className="col-span-1 sm:flex-none inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 text-slate-100 hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-400 border border-slate-700/80 active:scale-95 transition-all cursor-pointer shadow-sm"
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

          {/* Sección Reubicar Icono y Banner Protegida */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-400 text-[11px]">
              <span>¿Datos o portada desactualizados?</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsEditBannerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Camera size={13} className="text-cyan-400" />
                <span>{activePlace.foto_url ? 'Cambiar Banner' : 'Poner Banner'}</span>
              </button>

              {onRelocate ? (
                <button
                  onClick={() => {
                    onRelocate(activePlace);
                    onClose();
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 border ${
                    isAdmin
                      ? 'text-purple-300 hover:text-white bg-purple-950/70 hover:bg-purple-900/90 border-purple-500/40 shadow-sm'
                      : 'text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900/90 border-cyan-500/30'
                  }`}
                >
                  <span>🛰️ {isAdmin ? 'Reubicar (Super Admin)' : 'Soy el dueño: Reubicar'}</span>
                </button>
              ) : (
                <a
                  href={`/mi-negocio?slug=${activePlace.id_slug}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                    isAdmin
                      ? 'text-purple-300 hover:text-white bg-purple-950/70 hover:bg-purple-900/90 border-purple-500/40 shadow-sm'
                      : 'text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900/90 border-cyan-500/30'
                  }`}
                >
                  <span>🛰️ {isAdmin ? 'Reubicar (Super Admin)' : 'Soy el dueño: Reubicar'}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Editar / Poner Banner */}
      {isEditBannerOpen && activePlace && (
        <EditBannerModal
          place={activePlace}
          isOpen={isEditBannerOpen}
          onClose={() => setIsEditBannerOpen(false)}
          onSaved={(updated) => {
            setCurrentPlace(updated);
            if (onPlaceUpdated) onPlaceUpdated(updated);
          }}
        />
      )}
    </div>
  );
};

export default PlaceDetailModal;
