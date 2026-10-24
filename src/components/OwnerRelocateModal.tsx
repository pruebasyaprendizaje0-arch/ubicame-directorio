'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lugar } from '@/types/lugar';
import { LocationPickerMap } from '@/components/LocationPickerMap';
import { GoogleSignIn, GoogleUser } from '@/components/GoogleSignIn';
import {
  X,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  MessageCircle,
  KeyRound,
  Lock,
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
  // Coordenadas actuales o del negocio
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: place?.latitud || -1.82,
    lng: place?.longitud || -80.75,
  });

  // Estado de sesión Super Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Métodos de autenticación
  const [authMethod, setAuthMethod] = useState<'whatsapp' | 'admin' | 'google'>('whatsapp');
  const [claimPhone, setClaimPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);

  // Estados de guardado
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Verificar si la sesión activa en el navegador es Super Admin
  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.authenticated) {
          setIsAdmin(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setCheckingAdmin(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Validación en tiempo real del WhatsApp ingresado contra el registrado
  const isPhoneMatching = useMemo(() => {
    if (!place?.whatsapp || !claimPhone) return false;
    const cleanEntered = claimPhone.replace(/\D/g, '');
    const cleanReg = place.whatsapp.replace(/\D/g, '');
    if (cleanEntered.length < 7 || cleanReg.length < 7) return false;
    return cleanEntered.slice(-8) === cleanReg.slice(-8);
  }, [place?.whatsapp, claimPhone]);

  if (!isOpen || !place) return null;

  const handleSave = async () => {
    if (!coords.lat || !coords.lng) {
      setError('Debes posicionar el icono en el mapa.');
      return;
    }

    // Validación estricta: Solo negocio registrado o Super Admin
    if (!isAdmin && !isPhoneMatching && !adminPassword && !googleUser) {
      setError(
        'Debes verificar tu identidad con el WhatsApp registrado del negocio o la clave de Super Admin para guardar.'
      );
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
          admin_password: adminPassword || undefined,
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
                Reubicación Satelital • Techo Exacto
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

        {/* 1. SECCIÓN DE SEGURIDAD Y VERIFICACIÓN (Solo negocio registrado o Super Admin) */}
        {isAdmin ? (
          <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 text-purple-200 flex items-center justify-between text-xs animate-fade-in shadow-md">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-purple-400 shrink-0" size={20} />
              <div>
                <p className="font-bold text-white text-xs">Sesión Activa de Super Administrador</p>
                <p className="text-[11px] text-purple-300">Tienes autorización total para reubicar este negocio en el mapa.</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
              Super Admin
            </span>
          </div>
        ) : (
          <div className="mb-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <Lock size={15} />
              <span className="font-bold text-slate-200">
                Verificación Requerida • Solo Negocio Registrado o Super Admin
              </span>
            </div>

            {/* Selector de Método de Verificación */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setAuthMethod('whatsapp')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  authMethod === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('admin')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  authMethod === 'admin'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound size={13} />
                <span>Super Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('google')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  authMethod === 'google'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Google</span>
              </button>
            </div>

            {/* Contenido según el método de autenticación elegido */}
            {authMethod === 'whatsapp' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-[11px] text-slate-300 font-semibold">
                  Ingresa el WhatsApp registrado de {place.nombre}
                  {place.whatsapp && (
                    <span className="text-slate-400 font-normal ml-1">
                      (Terminado en ...{place.whatsapp.replace(/\D/g, '').slice(-4)})
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  placeholder="ej: 0994765377"
                  value={claimPhone}
                  onChange={(e) => {
                    setClaimPhone(e.target.value);
                    setError(null);
                  }}
                  className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors ${
                    isPhoneMatching
                      ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'border-slate-700 focus:border-cyan-400'
                  }`}
                />
                {isPhoneMatching ? (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold animate-fade-in">
                    <CheckCircle2 size={13} />
                    <span>¡WhatsApp verificado! Identidad del negocio confirmada.</span>
                  </p>
                ) : (
                  <p className="text-[10.5px] text-slate-400">
                    Solo quien conozca el número de teléfono/WhatsApp registrado podrá reubicar este negocio.
                  </p>
                )}
              </div>
            )}

            {authMethod === 'admin' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-[11px] text-slate-300 font-semibold">
                  Clave de Acceso Super Administrador
                </label>
                <input
                  type="password"
                  placeholder="Ingresa la clave de Super Admin..."
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                />
                <p className="text-[10.5px] text-slate-400">
                  Si eres el Super Administrador, ingresa tu clave para autorizar esta reubicación.
                </p>
              </div>
            )}

            {authMethod === 'google' && (
              <div className="space-y-2 animate-fade-in">
                <p className="text-[11px] text-slate-400">
                  Inicia sesión con la cuenta de Google vinculada como propietaria de este negocio.
                </p>
                <GoogleSignIn
                  currentUser={googleUser}
                  onUserChange={(user) => {
                    setGoogleUser(user);
                    setError(null);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* 2. Mini-Mapa Satelital de Techos (Esri World Imagery) */}
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
            height="300px"
            zoom={18}
            onChange={(newCoords) => setCoords(newCoords)}
          />
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
