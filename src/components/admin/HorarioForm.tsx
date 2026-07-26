import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface HorarioFormPayload {
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  abierto: boolean;
}

interface HorarioFormProps {
  dia: string;
  initial: {
    hora_inicio: string;
    hora_fin: string;
    abierto: boolean;
  };
  saving: boolean;
  onSave: (data: HorarioFormPayload) => void;
  onCancel: () => void;
}

export function HorarioForm({ dia, initial, saving, onSave, onCancel }: HorarioFormProps) {
  const [horaInicio, setHoraInicio] = useState(initial.hora_inicio);
  const [horaFin, setHoraFin] = useState(initial.hora_fin);
  const [abierto, setAbierto] = useState(initial.abierto);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (abierto) {
      if (!horaInicio) {
        setError('Selecciona la hora de apertura');
        return;
      }
      if (!horaFin) {
        setError('Selecciona la hora de cierre');
        return;
      }
      if (horaInicio >= horaFin) {
        setError('La hora de apertura debe ser menor a la hora de cierre');
        return;
      }
    }

    onSave({ dia, hora_inicio: horaInicio, hora_fin: horaFin, abierto });
  };

  const labelClass = 'block text-xs font-black uppercase tracking-widest text-gray-400 mb-2';
  const inputClass = 'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm text-brand-text placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-shadow duration-200';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm font-extrabold text-brand-text">{dia}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="hor-inicio" className={labelClass}>Apertura</label>
          <input
            id="hor-inicio"
            type="time"
            value={horaInicio}
            onChange={(e) => { setHoraInicio(e.target.value); setError(''); }}
            disabled={!abierto}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="hor-fin" className={labelClass}>Cierre</label>
          <input
            id="hor-fin"
            type="time"
            value={horaFin}
            onChange={(e) => { setHoraFin(e.target.value); setError(''); }}
            disabled={!abierto}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={abierto}
          onClick={() => setAbierto(!abierto)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            abierto ? 'bg-brand-accent' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
              abierto ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-gray-600 font-medium">
          {abierto ? 'Abierto' : 'Cerrado'}
        </span>
      </div>

      {error && (
        <p className="text-xs font-bold text-brand-danger">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3.5 rounded-2xl bg-brand-primary text-white text-sm font-bold shadow-sm hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
