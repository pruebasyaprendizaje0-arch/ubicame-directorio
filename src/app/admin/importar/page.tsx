'use client';

import React from 'react';
import { BatchExcelUploader } from '@/components/admin/BatchExcelUploader';
import { AdminHeader } from '@/components/admin/AdminHeader';
import {
  ShieldAlert,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function AdminImportPage() {
  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col selection:bg-purple-500/30">
      <AdminHeader />

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner informativo de Super Admin y Arquitectura de Negocios */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/20 to-slate-900/90 border border-indigo-500/30 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 mb-2.5">
              <Lock size={12} />
              <span>Módulo de Ingesta Masiva & Superadministración</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Importación por Lotes desde Excel (.xlsx / .csv)
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Carga masiva con validación previa de columnas, detección de coordenadas GPS y sincronización directa contra la tabla compartida de <strong>PostgreSQL</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 size={14} />
                <span>Transacción UPSERT (ON CONFLICT id_slug)</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Sparkles size={14} />
                <span>Priorización automática de clientes ubicame.cc</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Layers size={14} />
                <span>Chunks de 50 registros</span>
              </div>
            </div>
          </div>
        </div>

        {/* Componente Uploader Principal */}
        <BatchExcelUploader />

        {/* Sección de Documentación Técnica para Super Admin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Database size={16} className="text-cyan-400" />
              <span>Reglas de Inserción y Conflicto (UPSERT)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Cada fila del archivo Excel se identifica de manera unívoca mediante su <code>id_slug</code>. Si el registro ya existe en PostgreSQL, se actualizan sus atributos (nombre, tipo, zona, teléfono, url_perfil, coordenadas) sin crear duplicados.
            </p>
            <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800">
              INSERT INTO lugares (...) ON CONFLICT (id_slug) DO UPDATE...
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <ShieldAlert size={16} className="text-purple-400" />
              <span>Escalabilidad: Portal de Clientes vs Super Admin</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Este módulo está reservado para el <strong>Super Administrador</strong> para la ingesta global de comunas, parroquias y directorios cantonales. Los clientes que son dueños de negocios conservan su origen <code>ubicame_cc</code> y su menú digital vinculado.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Super Admin */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        Panel Super Admin • ubicame.info & ubicame.cc • Ecosistema Unificado de Directorio y Menús Digitales
      </footer>
    </div>
  );
}
