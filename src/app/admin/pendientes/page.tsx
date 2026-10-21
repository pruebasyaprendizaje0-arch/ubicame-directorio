'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lugar } from '@/types/lugar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PlaceEditModal } from '@/components/admin/PlaceEditModal';
import {
  Clock,
  Check,
  Trash2,
  Edit2,
  ExternalLink,
  MapPin,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Building2,
} from 'lucide-react';

export default function AdminPendientesPage() {
  const [places, setPlaces] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingSlug, setActionLoadingSlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Modal State
  const [editPlace, setEditPlace] = useState<Lugar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar lugares pendientes
  const loadPendingPlaces = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/places');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const pending = data.data.filter((p: Lugar) => p.estado === 'pendiente');
        setPlaces(pending);
      }
    } catch (err) {
      console.error('Error al cargar pendientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingPlaces();
  }, []);

  // Aprobar un lugar (Pasa a estado activo y se publica en el mapa)
  const handleApprove = async (place: Lugar) => {
    setActionLoadingSlug(place.id_slug);
    try {
      const res = await fetch(`/api/admin/places/${place.id_slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'activo' }),
      });
      const data = await res.json();
      if (data.success) {
        setPlaces(prev => prev.filter(p => p.id_slug !== place.id_slug));
        setMessage(`¡"${place.nombre}" ha sido aprobado y publicado en el mapa exitosamente!`);
      } else {
        alert(data.error || 'No se pudo aprobar el lugar');
      }
    } catch (err: any) {
      alert('Error de conexión al aprobar lugar: ' + err.message);
    } finally {
      setActionLoadingSlug(null);
    }
  };

  // Rechazar un lugar
  const handleReject = async (place: Lugar) => {
    if (!confirm(`¿Estás seguro de que deseas rechazar y eliminar definitivamente la solicitud de "${place.nombre}"?`)) {
      return;
    }
    setActionLoadingSlug(place.id_slug);
    try {
      const res = await fetch(`/api/admin/places/${place.id_slug}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setPlaces(prev => prev.filter(p => p.id_slug !== place.id_slug));
        setMessage(`Solicitud de "${place.nombre}" rechazada y eliminada.`);
      } else {
        alert(data.error || 'No se pudo rechazar el lugar');
      }
    } catch (err: any) {
      alert('Error de conexión al rechazar lugar: ' + err.message);
    } finally {
      setActionLoadingSlug(null);
    }
  };

  const handleEdit = (place: Lugar) => {
    setEditPlace(place);
    setIsModalOpen(true);
  };

  const handleSaved = (savedLugar: Lugar) => {
    if (savedLugar.estado === 'activo') {
      setPlaces(prev => prev.filter(p => p.id_slug !== savedLugar.id_slug));
      setMessage(`"${savedLugar.nombre}" guardado y activado.`);
    } else {
      setPlaces(prev => prev.map(p => p.id_slug === savedLugar.id_slug ? savedLugar : p));
    }
  };

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col selection:bg-purple-500/30">
      <AdminHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-amber-950/20 to-slate-900/90 border border-amber-500/30 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 mb-2">
              <Clock size={12} />
              <span>Moderación Comunitaria • Registro en 15 Seg</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Solicitudes Pendientes de Aprobación
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Negocios registrados por usuarios a través de <strong>/agregar</strong>. Revisa las coordenadas GPS y datos antes de publicarlos en el mapa en vivo.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadPendingPlaces}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Actualizar</span>
            </button>

            <Link
              href="/admin/lugares"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-colors"
            >
              <Building2 size={14} />
              <span>Ver Todos los Lugares</span>
            </Link>
          </div>
        </div>

        {/* Feedback message banner */}
        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              <span>{message}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-emerald-400/70 hover:text-white px-2 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Pending Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#080d1a] border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-3.5">Nombre del Negocio</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Pueblo / Comuna</th>
                  <th className="py-3 px-3">Coordenadas GPS</th>
                  <th className="py-3 px-3">WhatsApp</th>
                  <th className="py-3 px-3">Foto</th>
                  <th className="py-3 px-3 text-right">Acciones de Moderación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11.5px]">
                {places.map((place) => {
                  const mapUrl = `https://www.google.com/maps?q=${place.latitud},${place.longitud}`;
                  return (
                    <tr
                      key={place.id_slug}
                      className="bg-amber-950/15 border-l-4 border-amber-500 hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Nombre */}
                      <td className="py-3.5 px-3.5 font-sans">
                        <div className="font-bold text-white text-sm">{place.nombre}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{place.id_slug}</div>
                        {place.email_propietario && (
                          <div className="mt-1 flex items-center gap-1 text-[11px]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold">
                              <CheckCircle2 size={11} />
                              <span>Google: {place.email_propietario}</span>
                            </span>
                          </div>
                        )}
                        {place.descripcion && (
                          <div className="text-[10px] text-slate-400 mt-1 max-w-xs line-clamp-1 italic">
                            {place.descripcion}
                          </div>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-3 font-sans">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {place.tipo}
                        </span>
                      </td>

                      {/* Pueblo */}
                      <td className="py-3.5 px-3 font-sans text-cyan-300 font-bold whitespace-nowrap">
                        {place.zona}
                        <span className="text-[10px] text-slate-400 block font-normal">{place.ciudad}</span>
                      </td>

                      {/* Coordenadas GPS */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                          title="Abrir punto en Google Maps"
                        >
                          <MapPin size={12} />
                          <span>{place.latitud.toFixed(4)}, {place.longitud.toFixed(4)}</span>
                          <ExternalLink size={10} />
                        </a>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-emerald-400">
                        {place.whatsapp ? (
                          <a
                            href={`https://wa.me/${place.whatsapp.replace(/\+/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            <MessageCircle size={12} />
                            <span>+{place.whatsapp}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Foto */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {place.foto_url ? (
                          <a
                            href={place.foto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-cyan-400 hover:underline"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={place.foto_url}
                              alt=""
                              className="w-7 h-7 rounded object-cover border border-slate-700"
                            />
                            <span className="text-[11px] font-sans">Ver</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">Sin foto</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleApprove(place)}
                          disabled={actionLoadingSlug === place.id_slug}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 text-white hover:bg-emerald-500 transition-all cursor-pointer mr-1.5 shadow-md shadow-emerald-600/30 active:scale-95"
                          title="Aprobar y publicar inmediatamente"
                        >
                          {actionLoadingSlug === place.id_slug ? (
                            <Loader2 size={13} className="animate-spin text-white" />
                          ) : (
                            <Check size={13} className="stroke-[3]" />
                          )}
                          <span>Aprobar</span>
                        </button>

                        <button
                          onClick={() => handleReject(place)}
                          disabled={actionLoadingSlug === place.id_slug}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-500/30 hover:bg-rose-900 transition-all cursor-pointer mr-1.5 active:scale-95"
                          title="Rechazar y eliminar solicitud"
                        >
                          <Trash2 size={13} />
                          <span>Rechazar</span>
                        </button>

                        <button
                          onClick={() => handleEdit(place)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
                          title="Editar detalles antes de aprobar"
                        >
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {places.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400 font-sans">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                        <Check size={24} />
                      </div>
                      <div className="font-bold text-white text-base">¡Todo al día!</div>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        No hay solicitudes pendientes de revisión en este momento. Los nuevos negocios registrados en <strong>/agregar</strong> aparecerán aquí automáticamente.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <PlaceEditModal
        place={editPlace}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
