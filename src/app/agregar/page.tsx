'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Phone,
  Store,
  Utensils,
  Building2,
  Car,
  Cross,
  Loader2,
  X,
  Compass,
  Check,
  Send,
  HelpCircle,
} from 'lucide-react';
import { GoogleSignIn, GoogleUser } from '@/components/GoogleSignIn';

const CATEGORIES = [
  { id: 'Tienda', label: 'Tienda', icon: Store },
  { id: 'Restaurante', label: 'Restaurante', icon: Utensils },
  { id: 'Farmacia', label: 'Farmacia', icon: Cross },
  { id: 'Abarrotes', label: 'Abarrotes', icon: Store },
  { id: 'Bazar', label: 'Bazar', icon: Store },
  { id: 'Taxi', label: 'Taxi', icon: Car },
  { id: 'Hostal', label: 'Hostal', icon: Building2 },
  { id: 'Cancha', label: 'Cancha', icon: Sparkles },
  { id: 'Iglesia', label: 'Iglesia', icon: Building2 },
  { id: 'Otro', label: 'Otro', icon: MapPin },
];

const QUICK_TOWNS = [
  { name: 'Olón', lat: -1.804, lng: -80.73 },
  { name: 'Montañita', lat: -1.828, lng: -80.75 },
  { name: 'Manglaralto', lat: -2.006, lng: -80.73 },
  { name: 'Curía', lat: -1.77, lng: -80.74 },
  { name: 'San José', lat: -1.74, lng: -80.75 },
  { name: 'Ayangue', lat: -1.985, lng: -80.748 },
  { name: 'Santa Elena', lat: -2.22, lng: -80.85 },
  { name: 'Salinas', lat: -2.218, lng: -80.957 },
  { name: 'La Libertad', lat: -2.233, lng: -80.91 },
  { name: 'Guayaquil', lat: -2.17, lng: -79.92 },
  { name: 'Quito', lat: -0.18, lng: -78.46 },
];

export default function AgregarPage() {
  // Form State
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('Tienda');
  const [whatsapp, setWhatsapp] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);

  // Geolocation State
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [detectedTown, setDetectedTown] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showManualGeo, setShowManualGeo] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Photo Upload State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; pueblo: string } | null>(null);

  // 1. Capturar ubicación GPS
  const handleGetLocation = () => {
    setIsLocating(true);
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización. Ingresa la ubicación manualmente.');
      setIsLocating(false);
      setShowManualGeo(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        setCoords({ lat, lng });
        setAccuracy(acc);
        setManualLat(lat.toFixed(6));
        setManualLng(lng.toFixed(6));
        setIsLocating(false);

        // Predecir pueblo más cercano localmente
        let closest = QUICK_TOWNS[0];
        let minDist = 999999;
        QUICK_TOWNS.forEach(t => {
          const d = Math.hypot(t.lat - lat, t.lng - lng);
          if (d < minDist) {
            minDist = d;
            closest = t;
          }
        });
        setDetectedTown(closest.name);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'No se pudo obtener la ubicación GPS.';
        if (err.code === 1) msg = 'Permiso de ubicación denegado. Actívalo en tu navegador o selecciona tu pueblo abajo.';
        if (err.code === 2) msg = 'Posición GPS no disponible en este momento.';
        if (err.code === 3) msg = 'Tiempo de espera agotado al buscar satélites GPS.';
        setGeoError(msg);
        setShowManualGeo(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Manejar selección rápida de pueblo si GPS no está disponible
  const handleSelectQuickTown = (town: typeof QUICK_TOWNS[0]) => {
    setCoords({ lat: town.lat, lng: town.lng });
    setAccuracy(50);
    setDetectedTown(town.name);
    setManualLat(town.lat.toString());
    setManualLng(town.lng.toString());
    setGeoError(null);
  };

  // 2. Subida de Foto a ImgBB
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vista previa inmediata
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);
    setUploadingPhoto(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setFotoUrl(data.url);
      } else {
        setUploadError(data.error || 'No se pudo subir la foto a ImgBB. Puedes continuar sin foto.');
      }
    } catch (err: any) {
      setUploadError('Error de red al subir imagen. Puedes continuar sin foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFotoUrl('');
    setUploadError(null);
  };

  // 3. Enviar Registro Final
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!nombre.trim() || nombre.trim().length < 3) {
      setSubmitError('Por favor ingresa un nombre de al menos 3 caracteres.');
      return;
    }

    const effectiveLat = coords?.lat ?? parseFloat(manualLat);
    const effectiveLng = coords?.lng ?? parseFloat(manualLng);

    if (isNaN(effectiveLat) || isNaN(effectiveLng)) {
      setSubmitError('Por favor pulsa el botón "USAR MI UBICACIÓN ACTUAL" para fijar las coordenadas.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/agregar-lugar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          tipo,
          lat: effectiveLat,
          lng: effectiveLng,
          whatsapp: whatsapp.trim() || undefined,
          foto_url: fotoUrl || undefined,
          google_user: googleUser || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setSuccessData({ id: data.id, pueblo: data.pueblo });
        setIsSuccess(true);
      } else {
        setSubmitError(data.error || 'Error al guardar el lugar. Intenta de nuevo.');
      }
    } catch (err: any) {
      setSubmitError('Error de conexión con el servidor. Revisa tu internet e intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setNombre('');
    setTipo('Tienda');
    setWhatsapp('');
    setFotoUrl('');
    setCoords(null);
    setAccuracy(null);
    setDetectedTown(null);
    setPhotoPreview(null);
    setIsSuccess(false);
    setSuccessData(null);
  };

  // Pantalla de Éxito
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-md bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-emerald-950/40 space-y-5 animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Check size={36} className="text-slate-950 stroke-[3]" />
          </div>

          <div>
            <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              ¡Registro Exitoso!
            </span>
            <h2 className="text-2xl font-black text-white mt-3">
              {nombre}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Detectado en: <span className="text-white font-bold">{successData?.pueblo || 'Santa Elena'}</span>
            </p>
            {googleUser && (
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-emerald-500/30 text-[11px] text-emerald-300">
                {googleUser.picture && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={googleUser.picture} alt="" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                )}
                <span>Vinculado a: <strong>{googleUser.email}</strong></span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed text-left">
            <p className="font-semibold flex items-center gap-1.5 mb-1 text-emerald-200">
              <Sparkles size={14} /> Revisión Comunitaria en 24h
            </p>
            ¡Gracias por apoyar a la comunidad! Revisaremos tu negocio en un plazo máximo de 24 horas y aparecerá visible en el mapa interactivo de <strong>ubicame.info</strong>.
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm text-center shadow-lg hover:brightness-110 active:scale-98 transition-all"
            >
              Ver Mapa del Directorio
            </Link>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              + Agregar Otro Negocio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#060a17]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver al Mapa</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
            <MapPin size={13} className="text-slate-950" />
          </div>
          <span className="text-xs font-black text-white tracking-tight">ubicame.info</span>
        </div>
      </header>

      {/* Main Single-Screen Mobile Content */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 sm:py-6 flex flex-col justify-center">
        {/* Title & Tagline */}
        <div className="mb-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10.5px] font-black uppercase tracking-wider mb-1.5">
            <Sparkles size={11} />
            <span>En 15 Segundos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Agrega tu negocio en 15 seg
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Aparece en el mapa local gratis y conecta con clientes cercanos.
          </p>
        </div>

        {/* Global Errors Banner */}
        {submitError && (
          <div className="mb-3.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 0. Identificación Google */}
          <GoogleSignIn onUserChange={setGoogleUser} currentUser={googleUser} />

          {/* 1. Nombre del Lugar */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Nombre del Lugar / Negocio *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Tienda Doña Rosa / Cabañas El Delfín"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-semibold"
            />
          </div>

          {/* 2. Botón GIGANTE Ubicación Actual */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Ubicación Geográfica *
            </label>

            {!coords ? (
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-cyan-300/40"
              >
                {isLocating ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-slate-950" />
                    <span>Obteniendo GPS con Satélite...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={18} className="text-slate-950 fill-slate-950" />
                    <span>📍 USAR MI UBICACIÓN ACTUAL</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 text-emerald-400">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-300">
                      ✓ Ubicación capturada: {detectedTown || 'Ecuador'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Precisión GPS ±{accuracy ?? 12}m ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-[10px] text-cyan-400 hover:underline font-bold px-2 py-1 bg-slate-900 rounded-lg border border-slate-800"
                >
                  Recalcular
                </button>
              </div>
            )}

            {/* Error o Fallback de Ubicación */}
            {geoError && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-tight">
                {geoError}
              </div>
            )}

            {/* Selector Rápido de Pueblo si falla el GPS */}
            {showManualGeo && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Selecciona tu pueblo o comuna rápido:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-none">
                  {QUICK_TOWNS.map((t) => (
                    <button
                      type="button"
                      key={t.name}
                      onClick={() => handleSelectQuickTown(t)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        detectedTown === t.name
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Selector de Categoría / Tipo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Tipo de Negocio *
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = tipo === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setTipo(cat.id)}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-md shadow-cyan-500/20 scale-102'
                        : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent size={14} className={isSelected ? 'text-slate-950' : 'text-slate-400'} />
                    <span className="text-[10px] leading-tight truncate w-full">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. WhatsApp (Opcional) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              WhatsApp para Clientes (Opcional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" size={14} />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej: 0994765377 ó +593994765377"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 pl-8 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* 5. Foto del Lugar (Opcional) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Foto del Local o Fachada (Opcional)
            </label>

            {/* Inputs Ocultos de Archivos */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {!photoPreview ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera size={14} className="text-cyan-400" />
                  <span>Tomar Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload size={14} className="text-purple-400" />
                  <span>Subir Galería</span>
                </button>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Vista previa"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {uploadingPhoto ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-cyan-400" />
                          <span className="text-cyan-300 text-[11px]">Subiendo a la nube...</span>
                        </>
                      ) : fotoUrl ? (
                        <span className="text-emerald-400 text-[11px] font-bold">✓ Foto lista</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Foto seleccionada</span>
                      )}
                    </div>
                    {uploadError && (
                      <span className="text-[10px] text-amber-400 line-clamp-1">{uploadError}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removePhoto}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400"
                  title="Quitar foto"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          {/* 6. Botón GIGANTE Verde: AGREGAR AHORA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base tracking-wide shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin text-slate-950" />
                  <span>Enviando Registro Express...</span>
                </>
              ) : (
                <>
                  <Send size={18} className="text-slate-950 fill-slate-950" />
                  <span>AGREGAR AHORA (EN 15 SEG)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Micro Footer */}
      <footer className="text-center py-3 text-[11px] text-slate-500 border-t border-slate-900">
        ubicame.info • Directorio Georreferenciado Oficial
      </footer>
    </div>
  );
}
