'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Building2,
  FileSpreadsheet,
  Globe,
  ExternalLink,
  Plus,
} from 'lucide-react';

interface AdminHeaderProps {
  onNewPlace?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onNewPlace }) => {
  const pathname = usePathname();

  const isPlacesActive = pathname === '/admin/lugares' || pathname === '/admin';
  const isImportActive = pathname === '/admin/importar';

  return (
    <header className="sticky top-0 z-40 bg-[#060a17]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Branding & Role */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
            <ShieldAlert size={20} className="text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300">
                SUPER ADMIN
              </span>
              <span className="text-xs text-slate-400">• ubicame.info</span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-white leading-tight mt-0.5">
              Panel de Administración
            </h1>
          </div>
        </div>

        {/* Center: Module Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <Link
            href="/admin/lugares"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isPlacesActive
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 size={14} />
            <span>Gestión de Lugares</span>
          </Link>

          <Link
            href="/admin/importar"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isImportActive
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet size={14} />
            <span>Carga Masiva</span>
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onNewPlace && (
            <button
              onClick={onNewPlace}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Nuevo Lugar</span>
            </button>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Ver Directorio Público"
          >
            <Globe size={13} />
            <span className="hidden md:inline">Ver Directorio</span>
          </Link>

          <a
            href="https://ubicame.cc"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <span>ubicame.cc</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
