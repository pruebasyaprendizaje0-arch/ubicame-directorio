'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, KeyRound, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin/lugares';

  const [email, setEmail] = useState('pruebasyaprendizaje0@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      // Redirigir a la URL solicitada
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl relative z-10">
      {/* Glow accent */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 mx-auto mb-4 shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-[#050811] rounded-[14px] flex items-center justify-center">
            <Lock className="text-indigo-400" size={28} />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-2">
          <ShieldCheck size={13} />
          <span>Acceso Restringido • Super Admin</span>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">
          Panel de Administración
        </h1>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
          Ingresa con tu cuenta autorizada para gestionar negocios, referencias e importación masiva.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0 animate-ping" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Contraseña de Seguridad
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Verificando credenciales...</span>
            </>
          ) : (
            <>
              <span>Iniciar Sesión como Super Admin</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {/* Footer Return */}
      <div className="mt-8 pt-5 border-t border-slate-800 text-center">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 font-medium"
        >
          <span>← Volver al Directorio Público</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex items-center justify-center p-4 selection:bg-purple-500/30 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <Suspense fallback={<div className="text-xs text-slate-500">Cargando formulario...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
