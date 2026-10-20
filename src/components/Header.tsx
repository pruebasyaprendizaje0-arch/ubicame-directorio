'use client';

import React from 'react';
import { MapPin, Plus, ExternalLink } from 'lucide-react';

interface HeaderProps {
  onOpenRegister: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRegister }) => {
  return (
    <header className="header">
      <div className="container header-content">
        <div className="logo-group">
          <div className="logo-badge">
            <MapPin />
          </div>
          <div className="logo-text">
            <h1>Ubicame Directory</h1>
            <span className="logo-sub">Directorio Oficial • ubicame.info</span>
          </div>
        </div>

        <div className="header-nav">
          <a
            href="https://ubicame.cc"
            target="_blank"
            rel="noopener noreferrer"
            className="ecosystem-badge"
            title="Ir a la plataforma principal de cartas digitales y menús"
          >
            <span>Ecosistema ubicame.cc</span>
            <ExternalLink size={13} />
          </a>

          <button
            onClick={onOpenRegister}
            className="btn-primary"
            id="btn-register-place"
          >
            <Plus size={16} />
            <span>Registrar Negocio</span>
          </button>
        </div>
      </div>
    </header>
  );
};
