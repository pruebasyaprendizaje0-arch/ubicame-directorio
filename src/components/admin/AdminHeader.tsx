'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Building2,
  FileSpreadsheet,
  Globe,
  ExternalLink,
  Plus,
  LogOut,
  UserCheck,
  Clock,
} from 'lucide-react';

interface AdminHeaderProps {
  onNewPlace?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onNewPlace }) => {
  const pathname = usePathname();
  const router = useRouter();

  const isPlacesActive = pathname === '/admin/lugares' || pathname === '/admin';
  const isImportActive = pathname === '/admin/importar';
  const isPendingActive = pathname === '/admin/pendientes';

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      router.push('/admin/login');
    }
  };

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
            href="/admin/pendientes"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isPendingActive
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock size={14} />
            <span>Pendientes</span>
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

        {/* Right: User Identity & Actions */}
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
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Ver Directorio Público"
          >
            <Globe size={13} />
            <span>Ver Directorio</span>
          </Link>

          {/* User Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
            <UserCheck size={13} className="text-emerald-400" />
            <span className="text-[11px] truncate max-w-[130px]">pruebasyaprendizaje0</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer"
            title="Cerrar Sesión de Super Admin"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
