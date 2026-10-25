'use client';

import React from 'react';
import { Search, X, ChevronDown, Sparkles, Crown, MapPin, Wrench, CheckCircle, Flame } from 'lucide-react';
import { PlaceFilters } from '@/types/place';

interface SearchFiltersProps {
  filters: PlaceFilters;
  onChange: (updated: Partial<PlaceFilters>) => void;
  categories: string[];
  provincias: string[];
  ciudades: string[];
  zonas: string[];
  selectedCategory?: string;
  onSelectCategory: (cat?: string) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onChange,
  categories,
  provincias,
  ciudades,
  zonas,
  selectedCategory,
  onSelectCategory,
}) => {
  const isAllActive =
    !filters.prioridad &&
    filters.es_referencia === undefined &&
    filters.es_servicio === undefined &&
    !filters.solo_ubicame_cc;

  return (
    <div className="search-hub">
      {/* Search Input Bar */}
      <div className="search-input-wrapper">
        <Search className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar negocio, restaurante, zona, farmacia o iglesia..."
          value={filters.search || ''}
          onChange={e => onChange({ search: e.target.value })}
          id="main-search-input"
        />
        {filters.search && (
          <button
            className="search-clear-btn"
            onClick={() => onChange({ search: '' })}
            title="Limpiar búsqueda"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Dropdown Filters */}
      <div className="filter-row">
        {/* Provincia */}
        <div className="select-wrapper">
          <select
            className="select-control"
            value={filters.provincia || ''}
            onChange={e => onChange({ provincia: e.target.value || undefined, ciudad: undefined, zona: undefined })}
            id="filter-provincia"
          >
            <option value="">Todas las Provincias</option>
            {provincias.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronDown className="select-arrow" />
        </div>

        {/* Ciudad */}
        <div className="select-wrapper">
          <select
            className="select-control"
            value={filters.ciudad || ''}
            onChange={e => onChange({ ciudad: e.target.value || undefined, zona: undefined })}
            id="filter-ciudad"
          >
            <option value="">Todas las Ciudades</option>
            {ciudades.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="select-arrow" />
        </div>

        {/* Zona */}
        <div className="select-wrapper">
          <select
            className="select-control"
            value={filters.zona || ''}
            onChange={e => onChange({ zona: e.target.value || undefined })}
            id="filter-zona"
          >
            <option value="">Todas las Zonas</option>
            {zonas.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <ChevronDown className="select-arrow" />
        </div>

        {/* Tipo / Categoria */}
        <div className="select-wrapper">
          <select
            className="select-control"
            value={filters.tipo || ''}
            onChange={e => {
              const val = e.target.value || undefined;
              onChange({ tipo: val });
              onSelectCategory(val);
            }}
            id="filter-tipo"
          >
            <option value="">Todos los Tipos</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="select-arrow" />
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="quick-tabs">
        <button
          className={`quick-tab ${isAllActive ? 'active' : ''}`}
          onClick={() =>
            onChange({
              prioridad: undefined,
              es_referencia: undefined,
              es_servicio: undefined,
              solo_ubicame_cc: undefined,
            })
          }
        >
          <Sparkles size={14} />
          <span>Todos los Lugares</span>
        </button>

        <button
          className={`quick-tab ${filters.solo_ubicame_cc ? 'active-gold' : ''}`}
          onClick={() =>
            onChange({
              solo_ubicame_cc: !filters.solo_ubicame_cc ? true : undefined,
              solo_promos: undefined,
              prioridad: undefined,
              es_referencia: undefined,
              es_servicio: undefined,
            })
          }
        >
          <Crown size={14} color="#f59e0b" />
          <span>Clientes ubicame.cc (P1)</span>
        </button>

        <button
          className={`quick-tab ${filters.solo_promos ? 'active-orange' : ''}`}
          style={filters.solo_promos ? { borderColor: '#f97316', background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' } : {}}
          onClick={() =>
            onChange({
              solo_promos: !filters.solo_promos ? true : undefined,
              solo_ubicame_cc: undefined,
              prioridad: undefined,
              es_referencia: undefined,
              es_servicio: undefined,
            })
          }
        >
          <Flame size={14} color="#f97316" />
          <span>🔥 Promos & Eventos</span>
        </button>

        <button
          className={`quick-tab ${filters.prioridad === 2 ? 'active' : ''}`}
          onClick={() =>
            onChange({
              prioridad: filters.prioridad === 2 ? undefined : 2,
              solo_ubicame_cc: undefined,
              es_referencia: undefined,
              es_servicio: undefined,
            })
          }
        >
          <CheckCircle size={14} color="#06b6d4" />
          <span>Verificados (P2)</span>
        </button>

        <button
          className={`quick-tab ${filters.es_referencia === true ? 'active-purple' : ''}`}
          onClick={() =>
            onChange({
              es_referencia: filters.es_referencia === true ? undefined : true,
              solo_ubicame_cc: undefined,
              prioridad: undefined,
              es_servicio: undefined,
            })
          }
        >
          <MapPin size={14} color="#c084fc" />
          <span>Puntos de Referencia</span>
        </button>

        <button
          className={`quick-tab ${filters.es_servicio === true ? 'active' : ''}`}
          onClick={() =>
            onChange({
              es_servicio: filters.es_servicio === true ? undefined : true,
              solo_ubicame_cc: undefined,
              prioridad: undefined,
              es_referencia: undefined,
            })
          }
        >
          <Wrench size={14} color="#10b981" />
          <span>Servicios Esenciales</span>
        </button>
      </div>
    </div>
  );
};
