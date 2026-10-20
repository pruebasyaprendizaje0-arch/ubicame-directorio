'use client';

import React from 'react';
import { Store, Crown, Landmark, MapPin } from 'lucide-react';
import { DirectoryStats } from '@/types/place';

interface StatsRibbonProps {
  stats: DirectoryStats;
}

export const StatsRibbon: React.FC<StatsRibbonProps> = ({ stats }) => {
  return (
    <div className="stats-ribbon">
      <div className="stat-card">
        <div className="stat-icon cyan">
          <Store size={22} />
        </div>
        <div className="stat-info">
          <div className="stat-value">{stats.totalLugares}</div>
          <div className="stat-label">Lugares Activos</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon gold">
          <Crown size={22} />
        </div>
        <div className="stat-info">
          <div className="stat-value">{stats.clientesUbicameCc}</div>
          <div className="stat-label">Clientes ubicame.cc</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon indigo">
          <Landmark size={22} />
        </div>
        <div className="stat-info">
          <div className="stat-value">{stats.puntosReferencia}</div>
          <div className="stat-label">Puntos de Referencia</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon emerald">
          <MapPin size={22} />
        </div>
        <div className="stat-info">
          <div className="stat-value">{stats.ciudadesCount}</div>
          <div className="stat-label">Ciudades y {stats.zonasCount} Zonas</div>
        </div>
      </div>
    </div>
  );
};
