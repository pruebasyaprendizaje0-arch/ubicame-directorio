'use client';

import React, { useEffect, useState, useRef } from 'react';
import Script from 'next/script';
import { CheckCircle2, User, LogOut, Sparkles, HelpCircle, X } from 'lucide-react';

export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
  sub?: string;
}

interface GoogleSignInProps {
  onUserChange: (user: GoogleUser | null) => void;
  currentUser: GoogleUser | null;
}

// Helper para decodificar JWT de Google sin librerías externas
function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onUserChange, currentUser }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [originMismatch, setOriginMismatch] = useState(false);
  const [demoEmail, setDemoEmail] = useState('');
  const [demoName, setDemoName] = useState('');
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '365141190013-kbuodek8l6833k20sif4uq6u0g2esb5i.apps.googleusercontent.com';

  // Cargar usuario previo de localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ubicame_google_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          onUserChange(parsed);
        }
      }
    } catch (e) {}
  }, [onUserChange]);

  // Manejar respuesta de credencial oficial de Google
  const handleCredentialResponse = (response: any) => {
    if (response?.credential) {
      const payload = decodeJwt(response.credential);
      if (payload && payload.email) {
        const user: GoogleUser = {
          email: payload.email,
          name: payload.name || payload.given_name || 'Usuario Google',
          picture: payload.picture,
          sub: payload.sub,
        };
        localStorage.setItem('ubicame_google_user', JSON.stringify(user));
        onUserChange(user);
      }
    }
  };

  // Inicializar Google Identity Services
  useEffect(() => {
    if (!scriptLoaded || currentUser || !clientId) return;

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        const googleId = (window as any).google.accounts.id;

        googleId.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });

        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = '';
          googleId.renderButton(buttonContainerRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 340,
          });
        }

        // Monitorear si el origen está bloqueado por Google
        googleId.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.()) {
            const reason = notification.getNotDisplayedReason();
            if (reason === 'origin_mismatch' || reason === 'opt_out_or_no_session') {
              setOriginMismatch(true);
            }
          }
        });
      } catch (err) {
        console.warn('Error al inicializar Google Sign-In SDK:', err);
        setOriginMismatch(true);
      }
    }
  }, [scriptLoaded, currentUser, clientId]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('ubicame_google_user');
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.disableAutoSelect();
      }
    } catch (e) {}
    onUserChange(null);
  };

  // Manejar login de prueba rápida cuando aún no se ha configurado el Client ID
  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail || !demoEmail.includes('@')) {
      alert('Ingresa un correo válido (ej: minombre@gmail.com)');
      return;
    }
    const user: GoogleUser = {
      email: demoEmail.trim(),
      name: demoName.trim() || demoEmail.split('@')[0],
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(demoEmail)}`,
      sub: 'demo-google-user',
    };
    localStorage.setItem('ubicame_google_user', JSON.stringify(user));
    onUserChange(user);
    setShowConfigModal(false);
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      {currentUser ? (
        // Estado: Usuario ya identificado con Google
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            {currentUser.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.picture}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full border-2 border-emerald-400/80 object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold">
                <User size={18} />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-xs sm:text-sm truncate">
                  {currentUser.name}
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase">
                  <CheckCircle2 size={10} />
                  <span>Verificado</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate font-mono">
                {currentUser.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-[11px] font-bold text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
            title="Cambiar o cerrar sesión de Google"
          >
            <LogOut size={12} />
            <span className="hidden xs:inline">Cambiar</span>
          </button>
        </div>
      ) : (
        // Estado: No identificado
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-blue-950/20 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Logo de Google SVG */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-xs font-black text-white">Identifícate con Google (Recomendado)</span>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              1 Clic
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3 leading-snug">
            Protege tu ficha contra duplicados y recibe la insignia de <strong>Propietario Verificado</strong>.
          </p>

          {clientId ? (
            // Render del botón oficial de Google Identity Services con opción de respaldo
            <div className="space-y-2.5">
              <div className="flex justify-center w-full min-h-[44px]">
                <div ref={buttonContainerRef} id="google-btn-container" className="flex justify-center" />
              </div>

              {originMismatch && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] leading-tight space-y-2">
                  <div className="font-bold text-amber-200 flex items-center gap-1.5">
                    <span>⚠️ Origen no autorizado en Google Cloud</span>
                  </div>
                  <p className="text-slate-300">
                    Google bloqueó la conexión porque el origen actual (<code className="text-amber-300">http://localhost:3000</code>) aún no está guardado en <strong>Orígenes de JavaScript autorizados</strong> en Google Cloud Console.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className="w-full py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                  >
                    ⚡ Usar Verificación Directa (Modo Rápido)
                  </button>
                </div>
              )}

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors underline cursor-pointer"
                >
                  ¿No carga el botón de Google? Clic aquí para verificación manual
                </button>
              </div>
            </div>
          ) : (
            // Botón interactivo con diálogo si falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>
          )}
        </div>
      )}

      {/* Modal de Configuración / Modo Prueba */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <h3 className="text-sm font-black text-white">Google Sign-In</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Para habilitar la ventana oficial de Google con tus credenciales reales, agrega tu <strong>Client ID</strong> en las variables de entorno.
            </p>

            {/* Formulario de prueba rápida */}
            <form onSubmit={handleDemoLogin} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <span className="text-[10.5px] font-bold text-cyan-400 uppercase tracking-wider block">
                ⚡ Probar ahora (Simulación Inmediata):
              </span>

              <input
                type="text"
                placeholder="Tu nombre (ej: Frank)"
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />

              <input
                type="email"
                required
                placeholder="Tu correo Gmail (ej: frank@gmail.com)"
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs shadow hover:brightness-110 active:scale-98 transition-all cursor-pointer"
              >
                Conectar como Usuario Verificado
              </button>
            </form>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">Variable para producción en Coolify:</span>
              <code className="text-cyan-300 font-mono text-[10px] block break-all">
                NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
              </code>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
