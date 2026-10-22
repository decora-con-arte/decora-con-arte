import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ensureFreshSession } from '../services/authService';
import type { SessionCheckResult } from '../services/authService';

function getNotice(result: SessionCheckResult): string | undefined {
  if (result.reason === 'clock-skew') {
    return 'El servidor de autenticación tiene un desfase de reloj. Vuelve a iniciar sesión.';
  }
  if (result.reason === 'refresh-failed') {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }
  return undefined;
}

export function RequireAuth() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    ensureFreshSession().then((result) => {
      if (!active) return;

      if (result.session) {
        setReady(true);
        return;
      }

      const message = getNotice(result);
      navigate('/login', {
        replace: true,
        state: message ? { message } : undefined,
      });
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  return <Outlet />;
}
