import { useState, useRef } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface CategoryOption {
  id: number;
  nombre: string;
}

export interface ProductFormPayload {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: string;
  disponibilidad: boolean;
  file?: File;
  removeImage?: boolean;
}

interface ProductFormProps {
  categories: CategoryOption[];
  initial?: {
    nombre: string;
    descripcion: string;
    precio: string;
    categoria_id: string;
    disponibilidad: boolean;
    img_path?: string;
  };
  saving: boolean;
  onSave: (data: ProductFormPayload) => void;
  onCancel: () => void;
}

export function ProductForm({ categories, initial, saving, onSave, onCancel }: ProductFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '');
  const [precio, setPrecio] = useState(initial?.precio ?? '');
  const [categoriaId, setCategoriaId] = useState(initial?.categoria_id ?? '');
  const [disponibilidad, setDisponibilidad] = useState(initial?.disponibilidad ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.img_path ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setRemoveImage(false);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreview(null);
    setRemoveImage(true);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = nombre.trim();
    if (!trimmedName) {
      setError('El nombre del producto es obligatorio');
      return;
    }
    const wordCount = trimmedName.split(/\s+/).length;
    if (wordCount > 6) {
      setError('El nombre no puede tener más de 6 palabras');
      return;
    }

    const price = Number(precio);
    if (!precio || isNaN(price) || price < 0 || price > 1000000) {
      setError('El precio debe estar entre 0 y 1,000,000');
      return;
    }

    onSave({
      nombre: trimmedName,
      descripcion: descripcion.trim(),
      precio: price,
      categoria_id: categoriaId,
      disponibilidad,
      file: file ?? undefined,
      removeImage,
    });
  };

  const labelClass = 'block text-xs font-black uppercase tracking-widest text-gray-400 mb-2';
  const inputClass = 'w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm text-brand-text placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-shadow duration-200';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="prod-nombre" className={labelClass}>Nombre</label>
        <input
          id="prod-nombre"
          type="text"
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setError(''); }}
          placeholder="Ej: Pastel de Chocolate"
          autoFocus
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="prod-descripcion" className={labelClass}>Descripción</label>
        <textarea
          id="prod-descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describe el producto..."
          rows={3}
          className={inputClass + ' resize-none'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="prod-precio" className={labelClass}>Precio ($)</label>
          <input
            id="prod-precio"
            type="number"
            min={0}
            max={1000000}
            value={precio}
            onChange={(e) => { setPrecio(e.target.value); setError(''); }}
            placeholder="0"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="prod-categoria" className={labelClass}>Categoría</label>
          <div className="relative">
            <select
              id="prod-categoria"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className={inputClass + ' appearance-none cursor-pointer'}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Imagen</label>
        <div className="flex items-center gap-3">
          {preview && !removeImage ? (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-0.5 right-0.5 bg-white/80 rounded-full p-0.5 shadow-sm hover:bg-white transition-colors"
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-colors flex-shrink-0"
            >
              <ImagePlus size={24} className="text-gray-400" />
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <span className="text-xs text-gray-400">
            {file ? file.name : 'Toca para subir una imagen'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={disponibilidad}
          onClick={() => setDisponibilidad(!disponibilidad)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            disponibilidad ? 'bg-brand-accent' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
              disponibilidad ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-gray-600 font-medium">
          {disponibilidad ? 'Disponible' : 'No disponible'}
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
          {initial ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  );
}
