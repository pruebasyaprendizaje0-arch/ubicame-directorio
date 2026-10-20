'use client';

import React, { useState } from 'react';
import { X, MapPin, MessageCircle, ExternalLink, Navigation, Check, Share2, Crown, Shield } from 'lucide-react';
import { Lugar } from '@/types/place';

interface PlaceDetailModalProps {
  place: Lugar | null;
  onClose: () => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ place, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!place) return null;

  const isUbicameClient = place.prioridad === 1 || place.origen === 'ubicame_cc';
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitud},${place.longitud}`;
  const whatsappUrl = place.whatsapp ? `https://wa.me/${place.whatsapp.replace(/\+/g, '')}` : undefined;

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/?slug=${place.id_slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
          <X size={20} />
        </button>

        <div className="modal-header-row">
          <div className="icon-badge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={place.icono || '/icons/lugar.svg'}
              alt={place.tipo}
              width={28}
              height={28}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/icons/lugar.svg';
              }}
            />
          </div>
          <div>
            <h2 className="modal-title">{place.nombre}</h2>
            <p className="modal-subtitle">
              {place.tipo} • {place.zona}, {place.ciudad}
            </p>
          </div>
        </div>

        {/* Priority & Status tags */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
          {isUbicameClient && (
            <span className="badge badge-gold">
              <Crown size={12} />
              <span>Cliente Oficial ubicame.cc (P1)</span>
            </span>
          )}
          {place.prioridad === 2 && (
            <span className="badge badge-cyan">
              <Shield size={12} />
              <span>Verificado (P2)</span>
            </span>
          )}
          {place.es_referencia && (
            <span className="badge badge-purple">
              <span>Punto de Referencia</span>
            </span>
          )}
          {place.es_servicio && (
            <span className="badge badge-emerald">
              <span>Servicio Esencial</span>
            </span>
          )}
          <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
            ID: {place.id_slug}
          </span>
        </div>

        {/* Description */}
        {place.descripcion && (
          <p style={{ color: '#cbd5e1', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '20px' }}>
            {place.descripcion}
          </p>
        )}

        {/* Coordenadas & Map Visualizer */}
        <div className="modal-map-preview">
          <div className="modal-map-grid" />
          <div className="modal-pin">
            <MapPin size={16} />
            <span>{place.latitud.toFixed(4)}, {place.longitud.toFixed(4)}</span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', zIndex: 1 }}>
            Coordenadas GPS georreferenciadas
          </span>
        </div>

        {/* Details Grid */}
        <div className="modal-details-grid">
          <div className="modal-detail-item">
            <div className="modal-detail-label">Provincia</div>
            <div className="modal-detail-val">{place.provincia}</div>
          </div>
          <div className="modal-detail-item">
            <div className="modal-detail-label">Ciudad</div>
            <div className="modal-detail-val">{place.ciudad}</div>
          </div>
          <div className="modal-detail-item">
            <div className="modal-detail-label">Zona / Sector</div>
            <div className="modal-detail-val">{place.zona}</div>
          </div>
          <div className="modal-detail-item">
            <div className="modal-detail-label">Origen de Datos</div>
            <div className="modal-detail-val">
              {place.origen === 'ubicame_cc' ? 'PostgreSQL ubicame.cc' : 'Directorio ubicame.info'}
            </div>
          </div>
        </div>

        {/* Action Buttons in Modal */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {place.url_perfil && (
            <a
              href={place.url_perfil}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <span>Ver Menú en ubicame.cc</span>
              <ExternalLink size={15} />
            </a>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-card-action btn-whatsapp"
              style={{ flex: 1, padding: '12px' }}
            >
              <MessageCircle size={16} />
              <span>Contactar WhatsApp</span>
            </a>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-card-action btn-directions"
            style={{ padding: '12px 18px' }}
            title="Abrir en Google Maps"
          >
            <Navigation size={16} />
            <span>Navegar GPS</span>
          </a>

          <button
            onClick={handleShare}
            className="btn-card-action btn-directions"
            style={{ padding: '12px 18px' }}
            title="Copiar enlace"
          >
            {copied ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
            <span>{copied ? 'Copiado' : 'Compartir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
