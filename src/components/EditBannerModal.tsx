'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lugar } from '@/types/lugar';
import { getCategoryCoverBanner, getCategoryStyle } from '@/lib/categoryStyles';
import { GoogleSignIn, GoogleUser } from '@/components/GoogleSignIn';
import {
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ExternalLink,
  Sparkles,
  Lock,
  MessageCircle,
  RotateCcw,
} from 'lucide-react';

interface EditBannerModalProps {
  place: Lugar | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedPlace: Lugar) => void;
}

export const EditBannerModal: React.FC<EditBannerModalProps> = ({
  place,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [fotoUrl, setFotoUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [authMethod, setAuthMethod] = useState<'whatsapp' | 'admin' | 'google'>('whatsapp');
  const [claimPhone, setClaimPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Verificar sesión Super Admin
  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.authenticated) {
          setIsAdmin(true);
          setAuthMethod('admin');
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

  // Cargar foto actual cuando cambia el lugar
  useEffect(() => {
    if (place) {
      setFotoUrl(place.foto_url || '');
      setError(null);
      setSuccess(false);
      if (!place.whatsapp && !isAdmin) {
        setAuthMethod('admin');
      }
    }
  }, [place, isAdmin]);

  const isPhoneMatching = useMemo(() => {
    if (!place?.whatsapp || !claimPhone) return false;
    const cleanEntered = claimPhone.replace(/\D/g, '');
    const cleanReg = place.whatsapp.replace(/\D/g, '');
    if (cleanEntered.length < 7 || cleanReg.length < 7) return false;
    return cleanEntered.slice(-8) === cleanReg.slice(-8);
  }, [place?.whatsapp, claimPhone]);

  if (!isOpen || !place) return null;

  const defaultCategoryBanner = getCategoryCoverBanner({ ...place, foto_url: undefined });
  const previewBanner = fotoUrl.trim() || defaultCategoryBanner;
  const isPointOfInterest = Boolean(place.es_referencia || !place.whatsapp);

  const handleSave = async () => {
    // Validación de identidad
    if (!isAdmin && !isPhoneMatching && !adminPassword && !googleUser) {
      setError(
        isPointOfInterest
          ? 'Para puntos de interés públicos se requiere la clave o sesión de Super Administrador.'
          : 'Debes verificar tu identidad con el WhatsApp registrado del negocio o la clave de Super Admin para guardar.'
      );
      return;
    }

    if (fotoUrl.trim() && !fotoUrl.startsWith('http://') && !fotoUrl.startsWith('https://') && !fotoUrl.startsWith('/')) {
      setError('La URL de la imagen debe comenzar con https:// o http://');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/owner/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_slug: place.id_slug,
          foto_url: fotoUrl.trim() || null,
          google_user: googleUser,
          claim_whatsapp: claimPhone || undefined,
          admin_password: adminPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo guardar la imagen de portada.');
      }

      setSuccess(true);
      const updated = data.lugar || { ...place, foto_url: fotoUrl.trim() || undefined };

      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la imagen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#040711]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-[#0c1322] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 animate-slide-up sm:animate-none p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <ImageIcon size={11} />
                <span>Personalizar Portada / Banner</span>
              </span>
              {isPointOfInterest && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Punto de Interés
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-white truncate">
              {place.nombre}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Establece o cambia la imagen comercial que se muestra en la cabecera y tarjetas.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>¡Imagen de portada actualizada exitosamente!</span>
          </div>
        )}

        {/* Vista Previa del Banner */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1.5">
            <span>Vista Previa del Banner:</span>
            {fotoUrl.trim() && (
              <button
                type="button"
                onClick={() => setFotoUrl('')}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Usar portada por categoría</span>
              </button>
            )}
          </div>

          <div className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-inner group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewBanner}
              alt="Vista previa"
              className="w-full h-full object-cover filter brightness-[0.9] transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = defaultCategoryBanner;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="text-[11px] font-bold text-white drop-shadow">
                {place.nombre}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                {fotoUrl.trim() ? 'URL Personalizada' : 'Predeterminada por Rubro'}
              </span>
            </div>
          </div>
        </div>

        {/* Input de URL de Imagen */}
        <div className="mb-5 space-y-1.5">
          <label className="block text-xs font-bold text-slate-200">
            Enlace Directo de la Imagen (URL):
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... o enlace de tu foto"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 shadow-inner"
            />
            {fotoUrl.trim() && (
              <a
                href={fotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center justify-center transition-colors"
                title="Abrir imagen en nueva pestaña"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Acepta enlaces directos de fotos en alta resolución (JPG, PNG, WebP) desde Google Drive, Unsplash, Imgur o tu sitio web.
          </p>
        </div>

        {/* ========================================================
            AUTORIZACIÓN REQUERIDA (NEGOCIO REGISTRADO O SUPER ADMIN)
            ======================================================== */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span>Verificación de Autorización</span>
            </div>
            {isAdmin && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <span>⚡ Super Admin Activo</span>
              </span>
            )}
          </div>

          {isAdmin ? (
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
              <Sparkles size={14} className="shrink-0 text-purple-400" />
              <span>Tienes permisos totales de Super Administrador para guardar cambios de inmediato.</span>
            </div>
          ) : (
            <>
              {/* Tabs de verificación */}
              <div className="flex items-center gap-1.5 mb-3 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {place.whatsapp && (
                  <button
                    type="button"
                    onClick={() => setAuthMethod('whatsapp')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      authMethod === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    WhatsApp del Negocio
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAuthMethod('admin')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMethod === 'admin'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Clave Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('google')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMethod === 'google'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Google
                </button>
              </div>

              {/* Opción A: WhatsApp */}
              {authMethod === 'whatsapp' && place.whatsapp && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Ingresa el WhatsApp registrado para este negocio:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={claimPhone}
                      onChange={(e) => setClaimPhone(e.target.value)}
                      placeholder="Ej. 0994765377 o 5939..."
                      className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all ${
                        isPhoneMatching
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'border-slate-700 focus:border-cyan-400'
                      }`}
                    />
                    {isPhoneMatching && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                        <CheckCircle2 size={11} /> Coincide
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Compara con el número registrado: ••••{place.whatsapp.slice(-4)}
                  </p>
                </div>
              )}

              {/* Opción B: Clave Super Admin */}
              {authMethod === 'admin' && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Clave de Super Administrador:
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Ingresa la clave maestra"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Permite al Super Administrador modificar banners de negocios o puntos de interés generales.
                  </p>
                </div>
              )}

              {/* Opción C: Google */}
              {authMethod === 'google' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-300">
                    Inicia sesión con la cuenta de Google registrada para este negocio:
                  </p>
                  <GoogleSignIn
                    currentUser={googleUser}
                    onUserChange={setGoogleUser}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Guardar Portada</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
