import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../services/supabaseClient';
import { Loader2, LogOut, ShieldCheck, Package, Tags } from 'lucide-react';
import { AdminCard } from '../components/AdminCard';

export function AdminPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const supabase = getSupabase();

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          navigate('/login', { replace: true });
          return;
        }
        setEmail(session.user.email ?? null);
        setChecking(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          navigate('/login', { replace: true });
        }
      });

      return () => subscription.unsubscribe();
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch {
      // Si falla, navegamos igual
    }
    navigate('/login', { replace: true });
  };

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-8 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} className="text-brand-accent" />
          <div>
            <h1 className="text-lg font-black text-brand-text">Administración</h1>
            <p className="text-xs text-gray-500 font-medium">{email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400
            hover:text-brand-danger transition-colors duration-200"
        >
          <LogOut size={14} />
          Salir
        </button>
      </div>

      <div className="space-y-3">
        <AdminCard
          icon={Package}
          title="Productos"
          description="Gestionar el catálogo de productos"
          onClick={() => navigate('/admin/productos')}
        />
        <AdminCard
          icon={Tags}
          title="Categorías"
          description="Gestionar las categorías de productos"
          onClick={() => navigate('/admin/categorias')}
        />
      </div>
    </div>
  );
}
