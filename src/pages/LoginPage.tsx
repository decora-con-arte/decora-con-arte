import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSupabase } from '../services/supabaseClient';
import { ensureFreshSession, isTokenIssuedInFuture } from '../services/authService';
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

type LoginMethod = 'password' | 'magic-link';

function getPasswordErrorMessage(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return 'Correo o contraseña incorrectos.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Confirma tu correo electrónico antes de iniciar sesión.';
  }
  if (/too many requests|rate limit/i.test(message)) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }
  if (/invalid email/i.test(message)) {
    return 'El correo no es válido.';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

function getMagicLinkErrorMessage(message: string): string {
  if (/too many requests|rate limit/i.test(message)) {
    return 'Se alcanzó el límite de enlaces. Inténtalo más tarde.';
  }
  if (/invalid email/i.test(message)) {
    return 'El correo no es válido.';
  }
  return 'No se pudo enviar el enlace. Inténtalo de nuevo.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [method, setMethod] = useState<LoginMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) return state.message;

    const reauth = new URLSearchParams(location.search).get('reauth');
    if (reauth === 'clock-skew') {
      return 'El servidor de autenticación tiene un desfase de reloj. Vuelve a iniciar sesión.';
    }
    if (reauth === 'session') {
      return 'Tu sesión expiró. Inicia sesión nuevamente.';
    }
    return '';
  });

  useEffect(() => {
    let active = true;

    ensureFreshSession()
      .then((result) => {
        if (!active) return;

        if (result.session) {
          navigate('/admin', { replace: true });
          return;
        }

        if (result.reason === 'clock-skew') {
          setNotice('El servidor de autenticación tiene un desfase de reloj. Vuelve a iniciar sesión.');
        } else if (result.reason === 'refresh-failed') {
          setNotice('Tu sesión expiró. Inicia sesión nuevamente.');
        }

        setChecking(false);
      })
      .catch(() => {
        if (active) setChecking(false);
      });

    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const supabase = getSupabase();
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && !isTokenIssuedInFuture(session.access_token)) {
          navigate('/admin', { replace: true });
        }
      });
      subscription = data.subscription;
    } catch {
      console.warn('[auth] No se pudo suscribir a los cambios de sesión');
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const clearFeedback = () => {
    setError('');
    setNotice('');
  };

  const switchMethod = (next: LoginMethod) => {
    setMethod(next);
    setPassword('');
    setSent(false);
    clearFeedback();
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Ingresa tu correo electrónico');
      return;
    }
    if (!password) {
      setError('Ingresa tu contraseña');
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (signInError) {
        console.error(signInError);
        setError(getPasswordErrorMessage(signInError.message));
        return;
      }

      navigate('/admin', { replace: true });
    } catch {
      setError('Error de configuración. Contacta al administrador.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Ingresa tu correo electrónico');
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (signInError) {
        console.error(signInError);
        setError(getMagicLinkErrorMessage(signInError.message));
      } else {
        setSent(true);
      }
    } catch {
      setError('Error de configuración. Contacta al administrador.');
    } finally {
      setLoading(false);
    }
  };

  const emailInput = (
    <div>
      <label
        htmlFor="email"
        className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2"
      >
        Correo electrónico
      </label>
      <div className="relative">
        <Mail
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFeedback();
          }}
          placeholder="tu@correo.com"
          autoFocus
          autoComplete="email"
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white
            text-sm text-brand-text placeholder:text-gray-300
            focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
            transition-shadow duration-200"
        />
      </div>
    </div>
  );

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="Decora Con Arte"
            className="h-16 md:h-20 w-auto object-contain mx-auto mb-4"
          />
          {!sent && (
            <p className="text-sm text-gray-500 font-medium">
              Ingresa a tu cuenta para administrar
            </p>
          )}
        </div>

        {notice && !sent && (
          <div className="mb-4 rounded-2xl border border-brand-danger/20 bg-brand-danger/5 px-4 py-3">
            <p className="text-xs font-bold text-brand-danger">{notice}</p>
          </div>
        )}

        {sent ? (
          <div className="text-center space-y-4">
            <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-2xl p-6">
              <CheckCircle2 size={40} className="text-brand-accent mx-auto mb-3" />
              <h2 className="text-base font-extrabold text-brand-text mb-2">
                ¡Enlace enviado!
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Revisa <span className="font-bold text-brand-text">{email}</span>.
                Hemos enviado un enlace mágico para que accedas a tu cuenta.
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Revisa también la carpeta de spam si no lo encuentras.
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="text-sm font-bold text-brand-primary hover:underline transition-colors"
              >
                Usar otro correo
              </button>
              <button
                onClick={() => switchMethod('password')}
                className="text-sm font-bold text-gray-400 hover:text-brand-primary hover:underline transition-colors"
              >
                Volver a contraseña
              </button>
            </div>
          </div>
        ) : method === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {emailInput}

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <KeyRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearFeedback();
                  }}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-gray-200 bg-white
                    text-sm text-brand-text placeholder:text-gray-300
                    focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                    transition-shadow duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400
                    hover:text-brand-primary hover:bg-gray-100 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-brand-danger ml-1">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-cta">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => switchMethod('magic-link')}
                className="text-sm font-bold text-brand-primary hover:underline transition-colors"
              >
                Usar enlace mágico
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            {emailInput}

            {error && (
              <p className="text-xs font-bold text-brand-danger ml-1">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-cta">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Enviar enlace mágico</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => switchMethod('password')}
                className="text-sm font-bold text-gray-400 hover:text-brand-primary hover:underline transition-colors"
              >
                Volver a contraseña
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
