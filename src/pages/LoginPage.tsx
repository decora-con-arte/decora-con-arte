import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/admin', { replace: true });
        return;
      }
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/admin', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Ingresa tu correo electrónico');
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });

    if (signInError) {
      setError('No se pudo enviar el enlace. Intenta de nuevo.');
      console.error(signInError);
    } else {
      setSent(true);
    }

    setLoading(false);
  };

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

            <button
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className="text-sm font-bold text-brand-primary hover:underline transition-colors"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
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
              {error && (
                <p className="text-xs font-bold text-brand-danger mt-1.5 ml-1">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cta"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Enviar enlace mágico</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
