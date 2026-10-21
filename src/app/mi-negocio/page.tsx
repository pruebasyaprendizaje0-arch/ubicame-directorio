'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lugar } from '@/types/lugar';
import { GoogleSignIn, GoogleUser } from '@/components/GoogleSignIn';
import { LocationPickerMap } from '@/components/LocationPickerMap';
import {
  MapPin,
  ArrowLeft,
  Building2,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Loader2,
  Sparkles,
  ShieldCheck,
  Check,
  Clock,
  Navigation,
} from 'lucide-react';

function MiNegocioContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get('slug');

  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [places, setPlaces] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Lugar | null>(null);

  // Estado para el editor de reubicación
  const [editingCoords, setEditingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar negocios del usuario
  const loadUserPlaces = async (user: GoogleUser) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const url = initialSlug
        ? `/api/owner/places?email=${encodeURIComponent(user.email)}&slug=${encodeURIComponent(initialSlug)}`
        : `/api/owner/places?email=${encodeURIComponent(user.email)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setPlaces(data.data);
        if (initialSlug) {
          const match = data.data.find((p: Lugar) => p.id_slug === initialSlug);
          if (match) {
            handleStartRelocate(match);
          }
        }
      } else {
        setPlaces([]);
      }
    } catch (err: any) {
      console.error('Error al cargar negocios del propietario:', err);
      setErrorMessage('Error al cargar la información de tus negocios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (googleUser?.email) {
      loadUserPlaces(googleUser);
    } else {
      setPlaces([]);
      setSelectedPlace(null);
      setEditingCoords(null);
    }
  }, [googleUser, initialSlug]);

  const handleStartRelocate = (place: Lugar) => {
    setSelectedPlace(place);
    setEditingCoords({
      lat: place.latitud,
      lng: place.longitud,
    });
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSaveLocation = async (place: Lugar) => {
    if (!editingCoords) return;
    setSavingSlug(place.id_slug);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/owner/reubicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_slug: place.id_slug,
          latitud: editingCoords.lat,
          longitud: editingCoords.lng,
          google_user: googleUser,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo guardar la ubicación.');
      }

      setSuccessMessage(`¡Ubicación de "${place.nombre}" actualizada con éxito en el mapa!`);
      // Actualizar en el estado local
      setPlaces((prev) =>
        prev.map((p) =>
          p.id_slug === place.id_slug
            ? { ...p, latitud: editingCoords.lat, longitud: editingCoords.lng }
            : p
        )
      );
      setSelectedPlace(null);
      setEditingCoords(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión.');
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col">
      {/* Barra Superior */}
      <header className="sticky top-0 z-40 bg-[#050811]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Volver al Directorio</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
              🛰️
            </div>
            <span className="text-sm font-black text-white">Portal de Propietarios</span>
          </div>

          <Link
            href="/agregar"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nuevo Negocio</span>
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* Banner de Bienvenida */}
        <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-[#0a1224] border border-cyan-500/20 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Opción 2 • Precisión Satelital
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestión y Reubicación de Negocio
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Verifica tu negocio con tu cuenta de Google y ajusta el icono directamente sobre el techo de tu local para que los clientes lleguen sin perderse.
          </p>
        </div>

        {/* Tarjeta de Inicio de Sesión con Google */}
        <div className="mb-8 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-200">
              Identidad de Propietario Verificada
            </h2>
          </div>

          <GoogleSignIn
            currentUser={googleUser}
            onUserChange={(user) => {
              setGoogleUser(user);
            }}
          />

          {!googleUser && (
            <p className="text-xs text-slate-400 mt-3">
              🔒 Inicia sesión con la cuenta de Google con la que registraste tu negocio para acceder a sus controles de ubicación.
            </p>
          )}
        </div>

        {/* Notificaciones */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 flex items-center gap-2.5 text-xs animate-fade-in">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 flex items-start gap-2.5 text-xs animate-fade-in">
            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Listado de Negocios del Usuario */}
        {googleUser && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 size={18} className="text-cyan-400" />
                <span>Tus Negocios Registrados</span>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                  {places.length}
                </span>
              </h2>

              <Link
                href="/agregar"
                className="text-xs font-bold text-cyan-400 hover:text-white transition-colors"
              >
                + Registrar otro
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 size={24} className="text-cyan-400 animate-spin" />
                <span className="text-xs font-medium">Buscando tus negocios...</span>
              </div>
            ) : places.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mx-auto mb-3">
                  📍
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Aún no tienes negocios vinculados a {googleUser.email}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                  Si registraste tu local con otro correo o deseas registrar tu negocio por primera vez en 15 segundos, hazlo aquí:
                </p>
                <Link
                  href="/agregar"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-lg"
                >
                  <Plus size={15} />
                  <span>Registrar mi negocio ahora</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {places.map((place) => {
                  const isEditingThis = selectedPlace?.id_slug === place.id_slug;

                  return (
                    <div
                      key={place.id_slug}
                      className={`p-5 rounded-3xl transition-all border ${
                        isEditingThis
                          ? 'bg-[#091122] border-cyan-500 shadow-xl shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Cabecera del Negocio */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                place.icono.startsWith('/') || place.icono.startsWith('http')
                                  ? place.icono
                                  : `/icons/${place.icono}`
                              }
                              alt=""
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-white">{place.nombre}</h3>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  place.estado === 'activo'
                                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                                    : 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                                }`}
                              >
                                {place.estado === 'activo' ? 'Publicado' : 'En Revisión (24h)'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {place.tipo} • {place.zona}, {place.ciudad}
                            </p>
                          </div>
                        </div>

                        {/* Botón Iniciar Reubicación */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              isEditingThis ? setSelectedPlace(null) : handleStartRelocate(place)
                            }
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                              isEditingThis
                                ? 'bg-slate-800 text-slate-300 hover:text-white'
                                : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950'
                            }`}
                          >
                            <span>🛰️</span>
                            <span>{isEditingThis ? 'Ocultar Mapa' : 'Reubicar en Techos'}</span>
                          </button>

                          <Link
                            href={`/?q=${encodeURIComponent(place.nombre)}`}
                            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                            title="Ver en Directorio"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        </div>
                      </div>

                      {/* Editor Satelital desplegado */}
                      {isEditingThis && editingCoords && (
                        <div className="mt-4 pt-4 border-t border-slate-800/90 animate-fade-in space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <span className="font-semibold text-cyan-300">
                              👉 Arrastra el icono o haz clic en el techo de tu local
                            </span>
                            <span className="font-mono text-[11px] text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/30">
                              {editingCoords.lat.toFixed(6)}, {editingCoords.lng.toFixed(6)}
                            </span>
                          </div>

                          <LocationPickerMap
                            lat={editingCoords.lat}
                            lng={editingCoords.lng}
                            height="340px"
                            zoom={18}
                            onChange={(coords) => setEditingCoords(coords)}
                          />

                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setSelectedPlace(null)}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                            >
                              Cancelar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSaveLocation(place)}
                              disabled={savingSlug === place.id_slug}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                            >
                              {savingSlug === place.id_slug ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  <span>Guardando...</span>
                                </>
                              ) : (
                                <>
                                  <Check size={14} className="stroke-[3]" />
                                  <span>Guardar Ubicación Exacta</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MiNegocioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050811] flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      }
    >
      <MiNegocioContent />
    </Suspense>
  );
}
