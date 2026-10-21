'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lugar } from '@/types/lugar';
import {
  X,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Landmark,
  Building,
  Home,
  Layers,
} from 'lucide-react';
import { LocationPickerMap } from '@/components/LocationPickerMap';
import {
  PROVINCIAS_ECUADOR,
  getCantonesPorProvincia,
  getParroquiasPorCanton,
  getComunasPorFiltros,
  inferHierarchy,
} from '@/lib/geo';

interface PlaceEditModalProps {
  place: Lugar | null;
  isOpen: boolean;
  isNew?: boolean;
  onClose: () => void;
  onSaved: (updated: Lugar) => void;
  onDeleted?: (slug: string) => void;
}

const AVAILABLE_ICONS = [
  { value: 'restaurante.svg', label: 'Restaurante / Comida' },
  { value: 'cafeteria.svg', label: 'Cafetería / Panadería' },
  { value: 'hotel.svg', label: 'Hotel / Alojamiento' },
  { value: 'bar.svg', label: 'Bar / Lounge' },
  { value: 'playa.svg', label: 'Playa / Tours / Kayak' },
  { value: 'farmacia.svg', label: 'Farmacia / Botica' },
  { value: 'taxi.svg', label: 'Taxi / Transporte' },
  { value: 'salud.svg', label: 'Salud / Hospital' },
  { value: 'iglesia.svg', label: 'Iglesia / Santuario' },
  { value: 'artesanias.svg', label: 'Artesanías / Paja Toquilla' },
  { value: 'lugar.svg', label: 'Punto General' },
];

export const PlaceEditModal: React.FC<PlaceEditModalProps> = ({
  place,
  isOpen,
  isNew = false,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const [formData, setFormData] = useState<Partial<Lugar>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (place) {
      const inferred = inferHierarchy(place.zona || place.nombre || '');
      const prov = place.provincia || inferred.provincia || 'Santa Elena';
      const cant = place.ciudad || inferred.canton || (prov === 'Santa Elena' ? 'Santa Elena' : '');
      const parr = place.parroquia || inferred.parroquia || (prov === 'Santa Elena' && cant === 'Santa Elena' ? 'Manglaralto' : '');
      const zon = place.zona || place.comuna || inferred.comuna || 'Olón';

      setFormData({
        ...place,
        provincia: prov,
        ciudad: cant,
        parroquia: parr,
        zona: zon,
        comuna: zon,
      });
    } else if (isNew) {
      setFormData({
        id_slug: '',
        nombre: '',
        tipo: 'Gastronomía',
        icono: 'restaurante.svg',
        provincia: 'Santa Elena',
        ciudad: 'Santa Elena',
        parroquia: 'Manglaralto',
        zona: 'Olón',
        comuna: 'Olón',
        latitud: -1.8021,
        longitud: -80.7605,
        es_referencia: false,
        es_servicio: false,
        prioridad: 2,
        origen: 'directorio_info',
        whatsapp: '',
        url_perfil: '',
        estado: 'activo',
        descripcion: '',
      });
    }
    setError(null);
    setSuccessMsg(false);
  }, [place, isNew, isOpen]);

  // Territorial Cascade Options
  const currentProv = formData.provincia || 'Santa Elena';
  const currentCanton = formData.ciudad || 'Santa Elena';
  const currentParroquia = formData.parroquia || 'Manglaralto';
  const currentZona = formData.zona || formData.comuna || 'Olón';

  const availableCantones = useMemo(() => {
    return getCantonesPorProvincia(currentProv);
  }, [currentProv]);

  const availableParroquias = useMemo(() => {
    return getParroquiasPorCanton(currentProv, currentCanton);
  }, [currentProv, currentCanton]);

  const availableComunas = useMemo(() => {
    return getComunasPorFiltros(currentProv, currentCanton, currentParroquia);
  }, [currentProv, currentCanton, currentParroquia]);

  const handleProvinciaChange = (newProv: string) => {
    const cantones = getCantonesPorProvincia(newProv);
    const nextCanton = cantones[0] || '';
    const parroquias = getParroquiasPorCanton(newProv, nextCanton);
    const nextParr = parroquias[0] || '';
    const comunas = getComunasPorFiltros(newProv, nextCanton, nextParr);
    const nextComuna = comunas[0] || nextParr || nextCanton;

    setFormData(prev => ({
      ...prev,
      provincia: newProv,
      ciudad: nextCanton,
      parroquia: nextParr,
      zona: nextComuna,
      comuna: nextComuna,
    }));
  };

  const handleCantonChange = (newCanton: string) => {
    const parroquias = getParroquiasPorCanton(currentProv, newCanton);
    const nextParr = parroquias[0] || '';
    const comunas = getComunasPorFiltros(currentProv, newCanton, nextParr);
    const nextComuna = comunas[0] || nextParr || newCanton;

    setFormData(prev => ({
      ...prev,
      ciudad: newCanton,
      parroquia: nextParr,
      zona: nextComuna,
      comuna: nextComuna,
    }));
  };

  const handleParroquiaChange = (newParr: string) => {
    const comunas = getComunasPorFiltros(currentProv, currentCanton, newParr);
    const nextComuna = comunas[0] || newParr;

    setFormData(prev => ({
      ...prev,
      parroquia: newParr,
      zona: nextComuna,
      comuna: nextComuna,
    }));
  };

  const handleComunaChange = (newComuna: string) => {
    setFormData(prev => ({
      ...prev,
      zona: newComuna,
      comuna: newComuna,
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!formData.nombre || !formData.zona) {
        throw new Error('El Nombre y la Zona son campos requeridos');
      }

      const url = isNew
        ? '/api/admin/places'
        : `/api/admin/places/${place?.id_slug}`;

      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar los cambios');
      }

      setSuccessMsg(true);
      setTimeout(() => {
        onSaved(data.data);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error en la petición');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!place?.id_slug) return;
    if (!confirm(`¿Estás seguro de eliminar permanentemente "${place.nombre}"?`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/places/${place.id_slug}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar');
      }

      if (onDeleted) onDeleted(place.id_slug);
      onClose();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#040711]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0d1322] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              SUPER ADMIN • EDITOR
            </span>
            <span className="text-xs text-slate-400">
              {isNew ? 'Nuevo Registro' : `ID: ${place?.id_slug}`}
            </span>
          </div>
          <h2 className="text-xl font-black text-white">
            {isNew ? 'Agregar Negocio o Punto de Referencia' : `Editar: ${place?.nombre}`}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>¡Guardado correctamente!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre del Negocio o Punto *
              </label>
              <input
                type="text"
                required
                value={formData.nombre || ''}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="Ej. Hostal Mamacucha"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ID Slug (identificador único)
              </label>
              <input
                type="text"
                disabled={!isNew}
                value={formData.id_slug || ''}
                onChange={e => setFormData({ ...formData, id_slug: e.target.value })}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 font-mono disabled:opacity-60"
                placeholder={isNew ? 'Autogenerado si está vacío' : ''}
              />
            </div>
          </div>

          {/* Categoría / Tipo & Icono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoría / Tipo *
              </label>
              <input
                type="text"
                required
                value={formData.tipo || ''}
                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="Gastronomía, Alojamiento, Comercio, etc."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Icono SVG Asignado
              </label>
              <select
                value={formData.icono || 'lugar.svg'}
                onChange={e => setFormData({ ...formData, icono: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {AVAILABLE_ICONS.map(i => (
                  <option key={i.value} value={i.value}>
                    {i.label} ({i.value})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* División Territorial de Ecuador (4 Niveles en Cascada) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} />
                <span>División Territorial de Ecuador (4 Niveles)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentProv} &gt; {currentCanton} &gt; {currentParroquia}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Provincia */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Landmark size={12} className="text-indigo-400" />
                  <span>1. Provincia *</span>
                </label>
                <select
                  value={currentProv}
                  onChange={e => handleProvinciaChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {PROVINCIAS_ECUADOR.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* 2. Cantón */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Building size={12} className="text-cyan-400" />
                  <span>2. Cantón *</span>
                </label>
                <select
                  value={currentCanton}
                  onChange={e => handleCantonChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {availableCantones.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 3. Parroquia */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin size={12} className="text-purple-400" />
                  <span>3. Parroquia *</span>
                </label>
                <select
                  value={currentParroquia}
                  onChange={e => handleParroquiaChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {availableParroquias.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* 4. Comuna / Localidad */}
              <div>
                <label className="block text-[11px] font-bold text-cyan-300 mb-1 flex items-center gap-1">
                  <Home size={12} className="text-emerald-400" />
                  <span>4. Comuna / Localidad *</span>
                </label>
                <select
                  value={currentZona}
                  onChange={e => handleComunaChange(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-500/60 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-bold shadow-inner"
                >
                  {!availableComunas.includes(currentZona) && currentZona && (
                    <option value={currentZona}>{currentZona} (Actual)</option>
                  )}
                  {availableComunas.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Mini-Mapa Satelital de Precisión (Super Admin) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="text-cyan-400">🛰️</span>
                <span>Reubicar Pin Satelital (Alta Precisión Techos)</span>
              </label>
              <span className="text-[11px] text-cyan-400/90 font-mono bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-md self-start sm:self-auto">
                {(formData.latitud ?? -1.82).toFixed(6)}, {(formData.longitud ?? -80.75).toFixed(6)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Usa la capa satelital aérea para ver las construcciones y arrastra el pin directamente al techo de la propiedad.
            </p>

            <LocationPickerMap
              lat={formData.latitud ?? -1.82}
              lng={formData.longitud ?? -80.75}
              height="280px"
              zoom={18}
              onChange={(coords) => {
                setFormData((prev) => ({
                  ...prev,
                  latitud: coords.lat,
                  longitud: coords.lng,
                }));
              }}
            />

            {/* Campos manuales de GPS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Latitud Numérica
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitud ?? -1.82}
                  onChange={e => setFormData({ ...formData, latitud: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Longitud Numérica
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitud ?? -80.75}
                  onChange={e => setFormData({ ...formData, longitud: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Prioridad & Origen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nivel de Prioridad
              </label>
              <select
                value={formData.prioridad ?? 2}
                onChange={e => setFormData({ ...formData, prioridad: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>★ 1 - Destacado ubicame.cc (Máxima)</option>
                <option value={2}>2 - Negocio Verificado</option>
                <option value={3}>3 - Regular / Estándar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Origen de Registro
              </label>
              <select
                value={formData.origen || 'directorio_info'}
                onChange={e => setFormData({ ...formData, origen: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ubicame_cc">ubicame_cc (Cliente con Menú)</option>
                <option value="directorio_info">directorio_info (Directorio)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estado
              </label>
              <select
                value={formData.estado || 'activo'}
                onChange={e => setFormData({ ...formData, estado: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="activo">Activo (Visible)</option>
                <option value="pendiente">Pendiente de Revisión</option>
              </select>
            </div>
          </div>

          {/* Contacto: WhatsApp & URL Perfil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                WhatsApp Público (ej. 593987654321)
              </label>
              <input
                type="text"
                value={formData.whatsapp || ''}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="5939..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                URL Menú / Perfil (ubicame.cc o Web)
              </label>
              <input
                type="url"
                value={formData.url_perfil || ''}
                onChange={e => setFormData({ ...formData, url_perfil: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="https://ubicame.cc/mi-negocio"
              />
            </div>
          </div>

          {/* Flags: es_referencia, es_servicio */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(formData.es_referencia)}
                onChange={e => setFormData({ ...formData, es_referencia: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 focus:ring-0 bg-slate-800 border-slate-700"
              />
              <span className="font-semibold text-purple-300">
                Es Punto de Referencia (Iglesia, mirador, monumento, parque)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(formData.es_servicio)}
                onChange={e => setFormData({ ...formData, es_servicio: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-800 border-slate-700"
              />
              <span className="font-semibold text-emerald-300">
                Es Servicio de Urgencia / Esencial (Farmacia, taxi, salud)
              </span>
            </label>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción / Notas Verificables
            </label>
            <textarea
              rows={3}
              value={formData.descripcion || ''}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              placeholder="Detalles sobre especialidades, servicios, referencias de contacto..."
            />
          </div>

          {/* Actions Bottom Bar */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {!isNew && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{deleting ? 'Eliminando...' : 'Eliminar Lugar'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Save size={14} />
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceEditModal;
