import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../../services/supabaseClient';
import { HorarioForm } from '../../components/admin/HorarioForm';
import type { HorarioFormPayload } from '../../components/admin/HorarioForm';
import { Loader2, ChevronLeft, Clock, Edit3, AlertCircle } from 'lucide-react';
import { Toast, type ToastVariant } from '../../components/Toast';
import type { PostgrestError } from '@supabase/supabase-js';

const DIAS_ORDENADOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface HorarioRow {
  id: number;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  abierto: boolean;
}

function formatHora(hora: string): string {
  return hora ? hora.slice(0, 5) : '00:00';
}

export function AdminHorarios() {
  const navigate = useNavigate();

  const [horarios, setHorarios] = useState<HorarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingHorario, setEditingHorario] = useState<HorarioRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const mountedRef = useRef(true);

  const fetchHorarios = useCallback(async () => {
    const supabase = getSupabase();
    const { data, error: err } = await supabase
      .from('horarios')
      .select('*')
      .order('id');

    if (err) {
      console.error('Error fetching horarios:', err);
      setError('No se pudieron cargar los horarios');
      return [];
    }
    return (data ?? []) as HorarioRow[];
  }, []);

  const seedMissingDays = useCallback(async (existing: HorarioRow[]) => {
    const existingDias = new Set(existing.map(h => h.dia));
    const missing = DIAS_ORDENADOS.filter(d => !existingDias.has(d));
    if (missing.length === 0) return existing;

    setSeeding(true);
    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();

      for (const dia of missing) {
        const { error: insertErr } = await supabase
          .from('horarios')
          .insert({ dia, hora_inicio: '09:00', hora_fin: '18:00', abierto: true, created_at: now, updated_at: now });
        if (insertErr) console.error(`Error seeding ${dia}:`, insertErr);
      }

      return await fetchHorarios();
    } finally {
      setSeeding(false);
    }
  }, [fetchHorarios]);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        let data = await fetchHorarios();
        data = await seedMissingDays(data);
        if (mountedRef.current) setHorarios(data);
      } catch (err) {
        console.error('Error loading horarios:', err);
        setError('Error al cargar los datos');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => { mountedRef.current = false; };
  }, [fetchHorarios, seedMissingDays]);

  const horariosOrdenados = DIAS_ORDENADOS
    .map(dia => horarios.find(h => h.dia === dia))
    .filter((h): h is HorarioRow => !!h);

  const handleSave = async (formData: HorarioFormPayload) => {
    if (!editingHorario) return;
    setSaving(true);
    setError('');

    try {
      const supabase = getSupabase();
      const { error: updateErr } = await supabase
        .from('horarios')
        .update({
          hora_inicio: formData.hora_inicio,
          hora_fin: formData.hora_fin,
          abierto: formData.abierto,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingHorario.id);

      if (updateErr) throw updateErr;

      setShowForm(false);
      setEditingHorario(null);
      const data = await fetchHorarios();
      setHorarios(data);
      setToast({
        message: `Horario actualizado — ${formData.dia}`,
        variant: 'success',
      });
      setToastKey(k => k + 1);
    } catch (err) {
      const message = (err as PostgrestError | Error).message || 'Error al guardar el horario';
      console.error('Error saving horario:', err);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (horario: HorarioRow) => {
    setEditingHorario(horario);
    setShowForm(true);
    setError('');
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingHorario(null);
    setError('');
  };

  if (loading || seeding) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto pr-0.5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <h1 className="text-lg font-black text-brand-text">Horarios</h1>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-brand-danger/5 border border-brand-danger/20 rounded-2xl px-4 py-3 mb-5">
          <AlertCircle size={16} className="text-brand-danger shrink-0" />
          <p className="text-xs font-bold text-brand-danger">{error}</p>
        </div>
      )}

      {showForm && editingHorario && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="text-sm font-extrabold text-brand-text mb-4">
            Editar horario — {editingHorario.dia}
          </h2>
          <HorarioForm
            dia={editingHorario.dia}
            initial={{
              hora_inicio: formatHora(editingHorario.hora_inicio),
              hora_fin: formatHora(editingHorario.hora_fin),
              abierto: editingHorario.abierto,
            }}
            saving={saving}
            onSave={handleSave}
            onCancel={cancelForm}
          />
        </div>
      )}

      <div className="space-y-2">
        {horariosOrdenados.map((horario) => (
          <div
            key={horario.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${
              horario.abierto ? 'bg-brand-accent/10 border-brand-accent/20' : 'bg-gray-50 border-gray-100'
            }`}>
              <Clock size={20} className={horario.abierto ? 'text-brand-accent' : 'text-gray-300'} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-brand-text text-sm">
                {horario.dia}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                {horario.abierto ? (
                  <span className="text-xs font-bold text-gray-500">
                    {formatHora(horario.hora_inicio)} — {formatHora(horario.hora_fin)}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-brand-danger">Cerrado</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => startEdit(horario)}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Edit3 size={14} className="text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <Toast
          key={toastKey}
          message={toast.message}
          variant={toast.variant}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
