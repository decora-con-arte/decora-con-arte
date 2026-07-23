import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface CategoryFormPayload {
  nombre: string;
  icono: string;
}

interface CategoryFormProps {
  initial?: {
    nombre: string;
    icono: string;
  };
  saving: boolean;
  onSave: (data: CategoryFormPayload) => void;
  onCancel: () => void;
}

export function CategoryForm({ initial, saving, onSave, onCancel }: CategoryFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [icono, setIcono] = useState(initial?.icono ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = nombre.trim();
    if (!trimmedName) {
      setError('El nombre de la categoría es obligatorio');
      return;
    }
    const wordCount = trimmedName.split(/\s+/).length;
    if (wordCount > 6) {
      setError('El nombre no puede tener más de 6 palabras');
      return;
    }

    onSave({
      nombre: trimmedName,
      icono: icono.trim(),
    });
  };

  const labelClass = 'block text-xs font-black uppercase tracking-widest text-gray-400 mb-2';
  const inputClass = 'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm text-brand-text placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-shadow duration-200';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="cat-nombre" className={labelClass}>Nombre</label>
        <input
          id="cat-nombre"
          type="text"
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setError(''); }}
          placeholder="Ej: Pasteles"
          autoFocus
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="cat-icono" className={labelClass}>Icono</label>
        <input
          id="cat-icono"
          type="text"
          value={icono}
          onChange={(e) => { setIcono(e.target.value); setError(''); }}
          placeholder="Ej: 🎂 (opcional)"
          maxLength={20}
          className={inputClass}
        />
        <p className="text-xs text-gray-400 mt-1.5">Un emoji o icono corto (máx. 20 caracteres)</p>
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
          {initial ? 'Guardar cambios' : 'Crear categoría'}
        </button>
      </div>
    </form>
  );
}
