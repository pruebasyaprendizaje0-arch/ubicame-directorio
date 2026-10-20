'use client';

import React from 'react';
import { MapPin, Database, ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo-group" style={{ marginBottom: '14px' }}>
              <div className="logo-badge" style={{ width: '32px', height: '32px' }}>
                <MapPin size={18} />
              </div>
              <h4 style={{ margin: 0 }}>ubicame.info</h4>
            </div>
            <p>
              Directorio oficial de comercios, gastronomía, puntos turísticos y servicios esenciales en Ecuador. 
              Conectado en tiempo real con la infraestructura y cartas digitales de <strong>ubicame.cc</strong>.
            </p>
          </div>

          <div className="footer-col">
            <h5>Arquitectura de Datos</h5>
            <ul className="footer-links">
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} color="#06b6d4" />
                <span>PostgreSQL Compartido</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#10b981" />
                <span>Sin duplicidad de datos</span>
              </li>
              <li>
                <span style={{ color: 'var(--text-dim)', fontSize: '12.5px' }}>
                  Desarrollo: <code>src/data/lugares.json</code>
                </span>
              </li>
              <li>
                <span style={{ color: 'var(--text-dim)', fontSize: '12.5px' }}>
                  Producción: <code>DATABASE_URL</code>
                </span>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Ecosistema</h5>
            <ul className="footer-links">
              <li>
                <a href="https://ubicame.cc" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>Plataforma ubicame.cc</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a href="https://ubicame.cc/planes" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>Menús Digitales QR</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a href="#main-search-input">Buscar Lugares</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} Ubicame Directory (ubicame.info) • Todos los derechos reservados.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Ecuador: Santa Elena • Guayas • Pichincha</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
