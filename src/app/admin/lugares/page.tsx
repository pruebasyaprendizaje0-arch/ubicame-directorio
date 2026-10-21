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
  Building,
  Home,
  Layers,
  Wrench,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Clock,
  Loader2,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  PROVINCIAS_ECUADOR,
  getCantonesPorProvincia,
  getParroquiasPorCanton,
  getComunasPorFiltros,
  inferHierarchy,
} from '@/lib/geo';

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProvincia, setSelectedProvincia] = useState<string>('');
  const [selectedCanton, setSelectedCanton] = useState<string>('');
  const [selectedParroquia, setSelectedParroquia] = useState<string>('');
  const [selectedComuna, setSelectedComuna] = useState<string>('');
  const [selectedFilterType, setSelectedFilterType] = useState<'all' | 'pending' | 'p1' | 'references' | 'services'>('all');

  // Modal & Action State
  const [editPlace, setEditPlace] = useState<Lugar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewPlace, setIsNewPlace] = useState(false);
  const [syncingUbicame, setSyncingUbicame] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [actionLoadingSlug, setActionLoadingSlug] = useState<string | null>(null);

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

  // 4-level territorial cascading lists
  const availableCantones = useMemo(() => {
    return getCantonesPorProvincia(selectedProvincia || undefined);
  }, [selectedProvincia]);

  const availableParroquias = useMemo(() => {
    return getParroquiasPorCanton(selectedProvincia || undefined, selectedCanton || undefined);
  }, [selectedProvincia, selectedCanton]);

  const availableComunas = useMemo(() => {
    return getComunasPorFiltros(
      selectedProvincia || undefined,
      selectedCanton || undefined,
      selectedParroquia || undefined
    );
  }, [selectedProvincia, selectedCanton, selectedParroquia]);

  const hasTerritorialFilter = Boolean(
    selectedProvincia || selectedCanton || selectedParroquia || selectedComuna
  );

  const clearTerritorialFilters = () => {
    setSelectedProvincia('');
    setSelectedCanton('');
    setSelectedParroquia('');
    setSelectedComuna('');
  };

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
          (p.zona && p.zona.toLowerCase().includes(q)) ||
          (p.comuna && p.comuna.toLowerCase().includes(q)) ||
          (p.parroquia && p.parroquia.toLowerCase().includes(q)) ||
          (p.ciudad && p.ciudad.toLowerCase().includes(q)) ||
          (p.provincia && p.provincia.toLowerCase().includes(q)) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 4-level Territorial filtering
      if (selectedProvincia && p.provincia) {
        if (p.provincia.toLowerCase() !== selectedProvincia.toLowerCase()) return false;
      }

      if (selectedCanton && p.ciudad) {
        if (p.ciudad.toLowerCase() !== selectedCanton.toLowerCase()) return false;
      }

      if (selectedParroquia) {
        const placeParroquia = p.parroquia || inferHierarchy(p.zona || p.nombre || '').parroquia;
        if (placeParroquia) {
          if (placeParroquia.toLowerCase() !== selectedParroquia.toLowerCase()) return false;
        } else {
          if (p.zona?.toLowerCase() !== selectedParroquia.toLowerCase()) return false;
        }
      }

      if (selectedComuna) {
        const cLower = selectedComuna.toLowerCase();
        const matchesComuna =
          (p.zona && p.zona.toLowerCase() === cLower) ||
          (p.comuna && p.comuna.toLowerCase() === cLower) ||
          (p.nombre && p.nombre.toLowerCase().includes(cLower));
        if (!matchesComuna) return false;
      }

      // Quick filter tabs
      if (selectedFilterType === 'pending') {
        return p.estado === 'pendiente';
      }
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
  }, [places, search, selectedProvincia, selectedCanton, selectedParroquia, selectedComuna, selectedFilterType]);

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

  // Quick 1-click Approve
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
        setPlaces(prev => prev.map(p => p.id_slug === place.id_slug ? { ...p, estado: 'activo' } : p));
        setSyncMessage(`¡Negocio "${place.nombre}" aprobado y visible públicamente en el mapa!`);
      } else {
        alert(data.error || 'No se pudo aprobar el lugar');
      }
    } catch (err: any) {
      alert('Error de conexión al aprobar lugar: ' + err.message);
    } finally {
      setActionLoadingSlug(null);
    }
  };

  // Quick Reject
  const handleReject = async (place: Lugar) => {
    if (!confirm(`¿Estás seguro de que deseas rechazar y eliminar la solicitud de "${place.nombre}"?`)) {
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
        setSyncMessage(`Solicitud de "${place.nombre}" rechazada y eliminada.`);
      } else {
        alert(data.error || 'No se pudo rechazar el lugar');
      }
    } catch (err: any) {
      alert('Error de conexión al rechazar lugar: ' + err.message);
    } finally {
      setActionLoadingSlug(null);
    }
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
  const pendingCount = places.filter(p => p.estado === 'pendiente').length;
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Total Lugares</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{totalCount}</div>
          </div>

          <div
            onClick={() => setSelectedFilterType('pending')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              pendingCount > 0
                ? 'bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10 hover:border-amber-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
              <Clock size={12} className={pendingCount > 0 ? 'text-amber-400 animate-pulse' : ''} />
              <span>Por Revisar</span>
            </span>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5 flex items-center gap-2">
              <span>{pendingCount}</span>
              {pendingCount > 0 && (
                <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full font-black uppercase">
                  Pendientes
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30 bg-gradient-to-br from-slate-900/80 to-amber-950/20">
            <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
              <Sparkles size={12} />
              <span>Clientes P1</span>
            </span>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5">{p1Count}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-purple-500/30">
            <span className="text-xs text-purple-300 font-medium flex items-center gap-1">
              <Landmark size={12} />
              <span>Referencias</span>
            </span>
            <div className="text-xl font-extrabold text-purple-400 mt-0.5">{refCount}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
            <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
              <Wrench size={12} />
              <span>Servicios</span>
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

            {/* Refresh Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={loadPlaces}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                title="Refrescar lista"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refrescar</span>
              </button>
            </div>
          </div>

          {/* 4-Level Territorial Cascading Selectors */}
          <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} />
                <span>Filtrar por Territorio (4 Niveles)</span>
              </span>
              {hasTerritorialFilter && (
                <button
                  onClick={clearTerritorialFilters}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X size={12} />
                  <span>Limpiar filtro territorial</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Provincia */}
              <div className="relative">
                <select
                  value={selectedProvincia}
                  onChange={e => {
                    setSelectedProvincia(e.target.value);
                    setSelectedCanton('');
                    setSelectedParroquia('');
                    setSelectedComuna('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 pr-7 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate font-medium"
                >
                  <option value="">Todas las Provincias ({PROVINCIAS_ECUADOR.length})</option>
                  {PROVINCIAS_ECUADOR.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={13} />
              </div>

              {/* 2. Cantón */}
              <div className="relative">
                <select
                  value={selectedCanton}
                  onChange={e => {
                    setSelectedCanton(e.target.value);
                    setSelectedParroquia('');
                    setSelectedComuna('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 pr-7 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate font-medium"
                >
                  <option value="">Todos los Cantones</option>
                  {availableCantones.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={13} />
              </div>

              {/* 3. Parroquia */}
              <div className="relative">
                <select
                  value={selectedParroquia}
                  onChange={e => {
                    setSelectedParroquia(e.target.value);
                    setSelectedComuna('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 pr-7 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer truncate font-medium"
                >
                  <option value="">Todas las Parroquias</option>
                  {availableParroquias.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={13} />
              </div>

              {/* 4. Comuna / Localidad */}
              <div className="relative">
                <select
                  value={selectedComuna}
                  onChange={e => setSelectedComuna(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2.5 pr-7 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 appearance-none cursor-pointer truncate font-bold"
                >
                  <option value="">Todas las Comunas</option>
                  {availableComunas.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={13} />
              </div>
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
              onClick={() => setSelectedFilterType('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedFilterType === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : pendingCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Clock size={12} className={pendingCount > 0 ? 'text-amber-400' : ''} />
              <span>Pendientes ({pendingCount})</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
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
                  <th className="py-3 px-3">Ubicación Territorial</th>
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
                        place.estado === 'pendiente'
                          ? 'bg-amber-950/20 border-l-4 border-amber-500'
                          : isP1
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* Place & Icon */}
                      <td className="py-3 px-3.5 font-sans">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center flex-shrink-0 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={iconSrc}
                              alt=""
                              className="w-4 h-4 invert object-contain"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/icons/lugar.svg'; }}
                            />
                            {place.foto_url && (
                              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-900" title="Tiene foto" />
                            )}
                          </div>

                          <div>
                            <div className="font-bold text-white text-sm leading-tight flex items-center gap-2">
                              <span>{place.nombre}</span>
                              {place.estado === 'pendiente' && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                                  ⏳ Pendiente
                                </span>
                              )}
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
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span>{place.id_slug}</span>
                              {place.foto_url && (
                                <a
                                  href={place.foto_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:underline flex items-center gap-0.5 font-sans text-[10.5px]"
                                >
                                  <span>[Ver Foto]</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ubicación Territorial: Comuna / Parroquia / Cantón */}
                      <td className="py-3 px-3 font-sans">
                        <div className="font-bold text-cyan-300 text-xs flex items-center gap-1">
                          <MapPin size={12} className="text-cyan-400 flex-shrink-0" />
                          <span>{place.zona || place.comuna || 'Sin comuna'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {place.parroquia ? (
                            <span>Parr. {place.parroquia} • {place.ciudad || 'Santa Elena'}</span>
                          ) : (
                            <span>{place.ciudad || 'Santa Elena'}, {place.provincia || 'Santa Elena'}</span>
                          )}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-3 font-sans text-slate-300 whitespace-nowrap">
                        {place.tipo}
                      </td>

                      {/* Prioridad */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {place.estado === 'pendiente' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10.5px] font-bold">
                            <Clock size={10} />
                            <span>Por Aprobar</span>
                          </span>
                        ) : isP1 ? (
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
                        {place.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => handleApprove(place)}
                              disabled={actionLoadingSlug === place.id_slug}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black bg-emerald-600 text-white hover:bg-emerald-500 transition-all cursor-pointer mr-1.5 shadow-sm shadow-emerald-600/30"
                              title="Aprobar y publicar en el mapa"
                            >
                              {actionLoadingSlug === place.id_slug ? (
                                <Loader2 size={12} className="animate-spin text-white" />
                              ) : (
                                <Check size={12} className="stroke-[3]" />
                              )}
                              <span>Aprobar</span>
                            </button>

                            <button
                              onClick={() => handleReject(place)}
                              disabled={actionLoadingSlug === place.id_slug}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-500/30 hover:bg-rose-900 transition-all cursor-pointer mr-1.5"
                              title="Rechazar y eliminar solicitud"
                            >
                              <Trash2 size={12} />
                              <span>Rechazar</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleEdit(place)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
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
