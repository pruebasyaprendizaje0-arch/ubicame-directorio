'use client';

import React, { useState, useEffect } from 'react';
import { Lugar } from '@/types/lugar';
import { LocationPickerMap } from '@/components/LocationPickerMap';
import { GoogleSignIn, GoogleUser } from '@/components/GoogleSignIn';
import {
  X,
  Crosshair,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Smartphone,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface OwnerRelocateModalProps {
  place: Lugar | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedPlace: Lugar) => void;
}

export const OwnerRelocateModal: React.FC<OwnerRelocateModalProps> = ({
  place,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: place?.latitud || -1.82,
    lng: place?.longitud || -80.75,
  });
  const [claimPhone, setClaimPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);

  // Cargar coordenadas cuando cambia el lugar
  useEffect(() => {
    if (place) {
      setCoords({
        lat: place.latitud,
        lng: place.longitud,
      });
      setError(null);
      setSuccess(false);
    }
  }, [place]);

  if (!isOpen || !place) return null;

  const handleSave = async () => {
    if (!coords.lat || !coords.lng) {
      setError('Debes posicionar el icono en el mapa.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/owner/reubicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_slug: place.id_slug,
          latitud: coords.lat,
          longitud: coords.lng,
          google_user: googleUser,
          claim_whatsapp: claimPhone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo actualizar la ubicación.');
      }

      setSuccess(true);
      const updated = data.lugar || { ...place, latitud: coords.lat, longitud: coords.lng };

      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#040711]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-5 overflow-y-auto animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-2xl bg-[#0c1322] border-t sm:border border-cyan-500/30 rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 animate-slide-up sm:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Down Indicator on Mobile */}
        <div className="w-12 h-1 rounded-full bg-slate-600/70 mx-auto mb-3 sm:hidden" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        {/* Encabezado */}
        <div className="flex items-start gap-3.5 mb-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-lg shrink-0">
            🛰️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Reubicación de Techos • Alta Precisión
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
              Reubicar {place.nombre}
            </h2>
            <p className="text-xs text-slate-400">
              Arrastra el pin satelital o haz clic sobre el techo exacto de la propiedad.
            </p>
          </div>
        </div>

        {/* Notificaciones de Éxito o Error */}
        {success && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 flex items-center gap-2.5 text-xs animate-fade-in">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="font-semibold">
              ¡Ubicación satelital guardada con éxito! Actualizando mapa...
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 flex items-start gap-2.5 text-xs animate-fade-in">
            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* Mini-Mapa Satelital de Techos (Esri World Imagery) */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>🛰️</span>
              <span>Vista Aérea Satelital (Esri World Imagery)</span>
            </span>
            <span className="font-mono text-[11.5px] text-cyan-300 font-bold bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-0.5 rounded-md">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </span>
          </div>

          <LocationPickerMap
            lat={coords.lat}
            lng={coords.lng}
            height="320px"
            zoom={18}
            onChange={(newCoords) => setCoords(newCoords)}
          />
        </div>

        {/* Sección Opcional de Verificación de Dueño */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setShowAdvancedAuth(!showAdvancedAuth)}
            className="w-full flex items-center justify-between text-slate-300 hover:text-white font-medium cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-cyan-400" />
              <span>Vincular cuenta de dueño con Google o WhatsApp (Opcional)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              {googleUser ? (
                <span className="text-emerald-400 font-bold">Conectado</span>
              ) : (
                <span>{showAdvancedAuth ? 'Ocultar' : 'Configurar'}</span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform ${showAdvancedAuth ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {showAdvancedAuth && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3 animate-fade-in">
              <p className="text-[11px] text-slate-400">
                Al vincularte con Google, tu cuenta quedará registrada como propietario oficial de este local en el directorio.
              </p>

              <GoogleSignIn
                currentUser={googleUser}
                onUserChange={(user) => {
                  setGoogleUser(user);
                  setError(null);
                }}
              />

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  WhatsApp o Teléfono de contacto (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej: 0994765377"
                  value={claimPhone}
                  onChange={(e) => setClaimPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Lat: {coords.lat.toFixed(5)} | Lng: {coords.lng.toFixed(5)}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando en el mapa...</span>
                </>
              ) : (
                <>
                  <Crosshair size={14} />
                  <span>Guardar Ubicación Exacta</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerRelocateModal;
