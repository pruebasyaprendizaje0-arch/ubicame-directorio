'use client';

import React, { useState } from 'react';
import { X, PlusCircle, Check, AlertCircle } from 'lucide-react';
import { Lugar } from '@/types/place';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (place: Lugar) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Restaurante',
    provincia: 'Santa Elena',
    ciudad: 'Santa Elena',
    zona: '',
    latitud: -1.8285,
    longitud: -80.7532,
    whatsapp: '',
    url_perfil: '',
    descripcion: '',
    es_referencia: false,
    es_servicio: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const getIconForType = (tipo: string): string => {
    switch (tipo.toLowerCase()) {
      case 'restaurante': return '/icons/restaurante.svg';
      case 'cafetería':
      case 'cafeteria': return '/icons/cafeteria.svg';
      case 'hotel': return '/icons/hotel.svg';
      case 'bar': return '/icons/bar.svg';
      case 'farmacia': return '/icons/farmacia.svg';
      case 'supermercado': return '/icons/supermercado.svg';
      case 'servicio': return '/icons/servicio.svg';
      case 'artesanías':
      case 'artesanias': return '/icons/artesanias.svg';
      case 'punto de referencia': return '/icons/iglesia.svg';
      default: return '/icons/lugar.svg';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Partial<Lugar> = {
        ...formData,
        icono: getIconForType(formData.tipo),
        prioridad: 3,
        origen: 'directorio_info',
        estado: 'pendiente',
      };

      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo guardar el registro');
      }

      setSuccessMsg(true);
      setTimeout(() => {
        onSuccess(data.data);
        onClose();
        setSuccessMsg(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
          <X size={20} />
        </button>

        <h2 className="modal-title" style={{ marginBottom: '8px' }}>Registrar Nuevo Lugar</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '24px' }}>
          Agrega tu negocio o punto de interés a <strong>ubicame.info</strong>. Si eres cliente de <strong>ubicame.cc</strong>, tu ficha se vinculará directamente con tu menú digital.
        </p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', marginBottom: '16px', fontSize: '13.5px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10b981' }}>
              <Check size={28} />
            </div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>¡Registro Exitoso!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Tu lugar ha sido añadido a la lista y quedará pendiente de validación en la base de datos compartida.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del Negocio o Lugar *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Ej. Mar & Fuego Gastrobar"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Categoría / Tipo *</label>
                <select
                  className="form-select"
                  value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <option value="Restaurante">Restaurante</option>
                  <option value="Cafetería">Cafetería</option>
                  <option value="Hotel">Hotel / Hospedaje</option>
                  <option value="Bar">Bar / Lounge</option>
                  <option value="Farmacia">Farmacia</option>
                  <option value="Supermercado">Supermercado</option>
                  <option value="Servicio">Servicio Técnico</option>
                  <option value="Artesanías">Artesanías / Souvenirs</option>
                  <option value="Punto de Referencia">Punto de Referencia</option>
                </select>
              </div>

              <div className="form-group">
                <label>Provincia *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ej. Santa Elena"
                  value={formData.provincia}
                  onChange={e => setFormData({ ...formData, provincia: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Ciudad *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ej. Santa Elena, Salinas, Guayaquil"
                  value={formData.ciudad}
                  onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Zona / Sector *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ej. Montañita, Olón, Urdesa"
                  value={formData.zona}
                  onChange={e => setFormData({ ...formData, zona: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Latitud GPS</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={formData.latitud}
                  onChange={e => setFormData({ ...formData, latitud: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label>Longitud GPS</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={formData.longitud}
                  onChange={e => setFormData({ ...formData, longitud: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>WhatsApp (ej. 593991234567)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="5939..."
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>URL Menú / Perfil ubicame.cc</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://ubicame.cc/mi-negocio"
                  value={formData.url_perfil}
                  onChange={e => setFormData({ ...formData, url_perfil: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Descripción del Negocio o Punto</label>
              <textarea
                className="form-textarea"
                placeholder="Breve reseña, especialidades gastronómicas, horarios o puntos de contacto..."
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={formData.es_referencia}
                  onChange={e => setFormData({ ...formData, es_referencia: e.target.checked })}
                />
                <span>Punto de referencia cívico/turístico</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={formData.es_servicio}
                  onChange={e => setFormData({ ...formData, es_servicio: e.target.checked })}
                />
                <span>Es servicio esencial o de urgencia</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              <PlusCircle size={18} />
              <span>{loading ? 'Enviando...' : 'Completar Registro'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
