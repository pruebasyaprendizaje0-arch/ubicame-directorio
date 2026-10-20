'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lugar } from '@/types/lugar';
import { getPlaceActionConfig } from '@/lib/placeActions';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PlaceEditModal } from '@/components/admin/PlaceEditModal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Landmark,
  Wrench,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedZona, setSelectedZona] = useState<string>('all');
  const [selectedFilterType, setSelectedFilterType] = useState<'all' | 'p1' | 'references' | 'services'>('all');

  // Modal State
  const [editPlace, setEditPlace] = useState<Lugar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewPlace, setIsNewPlace] = useState(false);
  const [syncingUbicame, setSyncingUbicame] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Sync with ubicame.cc
  const handleSyncUbicame = async () => {
    setSyncingUbicame(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/admin/sync-ubicame', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(`¡Sincronización exitosa! ${data.data.syncedCount} negocios de ubicame.cc integrados.`);
        await loadPlaces();
      } else {
        setSyncMessage(`Aviso: ${data.error || 'No se pudo completar la sincronización'}`);
      }
    } catch (err: any) {
      setSyncMessage(`Error de conexión al sincronizar con ubicame.cc: ${err.message}`);
    } finally {
      setSyncingUbicame(false);
    }
  };

  // Load places
  const loadPlaces = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/places');
      const data = await res.json();
      if (data.success) {
        setPlaces(data.data);
      }
    } catch (err) {
      console.error('Error al cargar lugares en admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  // Zones unique list
  const zonas = useMemo(() => {
    const set = new Set(places.map(p => p.zona).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [places]);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    return places.filter(p => {
      // Search text
      if (search) {
        const q = search.toLowerCase();
        const matches =
          p.nombre.toLowerCase().includes(q) ||
          p.id_slug.toLowerCase().includes(q) ||
          p.tipo.toLowerCase().includes(q) ||
          p.zona.toLowerCase().includes(q) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Zona filter
      if (selectedZona !== 'all' && p.zona !== selectedZona) {
        return false;
      }

      // Quick filter tabs
      if (selectedFilterType === 'p1') {
        return p.prioridad === 1 || p.origen === 'ubicame_cc';
      }
      if (selectedFilterType === 'references') {
        return p.es_referencia;
      }
      if (selectedFilterType === 'services') {
        return p.es_servicio;
      }

      return true;
    });
  }, [places, search, selectedZona, selectedFilterType]);

  // Open edit modal
  const handleEdit = (place: Lugar) => {
    setEditPlace(place);
    setIsNewPlace(false);
    setIsModalOpen(true);
  };

  // Open new place modal
  const handleNew = () => {
    setEditPlace(null);
    setIsNewPlace(true);
    setIsModalOpen(true);
  };

  // Callbacks after save/delete
  const handleSaved = (savedLugar: Lugar) => {
    setPlaces(prev => {
      const index = prev.findIndex(p => p.id_slug === savedLugar.id_slug);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = savedLugar;
        return copy;
      }
      return [savedLugar, ...prev];
    });
  };

  const handleDeleted = (slug: string) => {
    setPlaces(prev => prev.filter(p => p.id_slug !== slug));
  };

  // Metrics
  const totalCount = places.length;
  const p1Count = places.filter(p => p.prioridad === 1 || p.origen === 'ubicame_cc').length;
  const refCount = places.filter(p => p.es_referencia).length;
  const servCount = places.filter(p => p.es_servicio).length;

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col selection:bg-purple-500/30">
      <AdminHeader onNewPlace={handleNew} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Title & Metrics Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-purple-950/20 to-slate-900/90 border border-purple-500/30 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20 mb-2">
              <span>Super Admin • Control Directo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Gestor de Negocios y Puntos de Referencia
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Edita nombres, categorías, enlaces a cartas digitales de <strong>ubicame.cc</strong>, números de WhatsApp y coordenadas georreferenciadas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleSyncUbicame}
              disabled={syncingUbicame}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/40 hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap shadow-sm"
              title="Sincronizar negocios registrados en la plataforma ubicame.cc"
            >
              <RefreshCw size={14} className={syncingUbicame ? 'animate-spin text-amber-400' : 'text-amber-400'} />
              <span>{syncingUbicame ? 'Sincronizando...' : 'Sincronizar ubicame.cc'}</span>
            </button>

            <button
              onClick={handleNew}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus size={16} />
              <span>Agregar Negocio o Referencia</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Notification Banner */}
        {syncMessage && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400 flex-shrink-0" />
              <span>{syncMessage}</span>
            </div>
            <button
              onClick={() => setSyncMessage(null)}
              className="text-amber-400/70 hover:text-white px-2 py-0.5 rounded cursor-pointer font-bold text-sm"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Total Lugares</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{totalCount}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30 bg-gradient-to-br from-slate-900/80 to-amber-950/20">
            <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
              <Sparkles size={12} />
              <span>Clientes P1 ubicame.cc</span>
            </span>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5">{p1Count}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-purple-500/30">
            <span className="text-xs text-purple-300 font-medium flex items-center gap-1">
              <Landmark size={12} />
              <span>Puntos de Referencia</span>
            </span>
            <div className="text-xl font-extrabold text-purple-400 mt-0.5">{refCount}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
            <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
              <Wrench size={12} />
              <span>Servicios de Urgencia</span>
            </span>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{servCount}</div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre, slug, categoría o notas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Zona Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedZona}
                onChange={e => setSelectedZona(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Todas las Comunas/Zonas</option>
                {zonas.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>

              <button
                onClick={loadPlaces}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Refrescar lista"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedFilterType === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              Todos ({totalCount})
            </button>

            <button
              onClick={() => setSelectedFilterType('p1')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                selectedFilterType === 'p1'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-amber-300/80 hover:text-amber-200'
              }`}
            >
              <Sparkles size={12} />
              <span>Destacados ubicame.cc ({p1Count})</span>
            </button>

            <button
              onClick={() => setSelectedFilterType('references')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                selectedFilterType === 'references'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-purple-300/80 hover:text-purple-200'
              }`}
            >
              <Landmark size={12} />
              <span>Solo Referencias ({refCount})</span>
            </button>

            <button
              onClick={() => setSelectedFilterType('services')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                selectedFilterType === 'services'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-emerald-300/80 hover:text-emerald-200'
              }`}
            >
              <Wrench size={12} />
              <span>Solo Servicios ({servCount})</span>
            </button>
          </div>
        </div>

        {/* Places List Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[580px] scrollbar-thin scrollbar-thumb-slate-700">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#080d1a] border-b border-slate-800 text-slate-400 font-semibold z-10">
                <tr>
                  <th className="py-3 px-3.5">Lugar / Negocio</th>
                  <th className="py-3 px-3">Comuna</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Prioridad / Origen</th>
                  <th className="py-3 px-3">WhatsApp</th>
                  <th className="py-3 px-3">Menú/Web</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11.5px]">
                {filteredPlaces.map((place) => {
                  const isP1 = place.prioridad === 1 || place.origen === 'ubicame_cc';
                  const iconSrc = place.icono.startsWith('/') || place.icono.startsWith('http')
                    ? place.icono
                    : `/icons/${place.icono}`;

                  return (
                    <tr
                      key={place.id_slug}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isP1 ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Place & Icon */}
                      <td className="py-3 px-3.5 font-sans">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={iconSrc}
                              alt=""
                              className="w-4 h-4 invert object-contain"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/icons/lugar.svg'; }}
                            />
                          </div>

                          <div>
                            <div className="font-bold text-white text-sm leading-tight flex items-center gap-2">
                              <span>{place.nombre}</span>
                              {place.es_referencia && (
                                <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Ref
                                </span>
                              )}
                              {place.es_servicio && (
                                <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Serv
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {place.id_slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Zona */}
                      <td className="py-3 px-3 font-sans text-cyan-300 font-semibold whitespace-nowrap">
                        {place.zona}
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-3 font-sans text-slate-300 whitespace-nowrap">
                        {place.tipo}
                      </td>

                      {/* Prioridad */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isP1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10.5px] font-bold">
                            <Sparkles size={10} />
                            <span>P1 ubicame.cc</span>
                          </span>
                        ) : place.prioridad === 2 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10.5px] font-medium">
                            <ShieldCheck size={10} />
                            <span>P2 Verificado</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">P3 Regular</span>
                        )}
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3 px-3 whitespace-nowrap text-emerald-400">
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

                      {/* Menu URL */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-400 max-w-[120px] truncate">
                        {place.url_perfil ? (
                          <a
                            href={place.url_perfil}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-400 hover:underline"
                          >
                            <span>{getPlaceActionConfig(place).label}</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(place)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer mr-1.5"
                          title="Editar negocio o punto"
                        >
                          <Edit2 size={12} />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredPlaces.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                      No se encontraron lugares que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Place Edit Modal */}
      <PlaceEditModal
        place={editPlace}
        isOpen={isModalOpen}
        isNew={isNewPlace}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
