import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { CategoryForm } from '../../components/admin/CategoryForm';
import type { CategoryFormPayload } from '../../components/admin/CategoryForm';
import { Loader2, ChevronLeft, Plus, Hash, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { Toast, type ToastVariant } from '../../components/Toast';
import type { PostgrestError } from '@supabase/supabase-js';

interface CategoryRow {
  id: number;
  nombre: string;
  icono: string | null;
  slug: string | null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function AdminCategorias() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const mountedRef = useRef(true);

  const fetchCategories = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('categorias')
      .select('*')
      .order('id', { ascending: false });

    if (err) {
      console.error('Error fetching categories:', err);
      setError('No se pudieron cargar las categorías');
      return;
    }
    setCategories((data ?? []) as CategoryRow[]);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        await fetchCategories();
      } catch (err) {
        console.error('Error loading admin data:', err);
        setError('Error al cargar los datos');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => { mountedRef.current = false; };
  }, [fetchCategories]);

  const handleSave = async (formData: CategoryFormPayload) => {
    setSaving(true);
    setError('');

    const slug = editingCategory?.slug ?? slugify(formData.nombre);

    try {
      if (editingCategory) {
        const { error: updateErr } = await supabase
          .from('categorias')
          .update({
            nombre: formData.nombre,
            icono: formData.icono || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);

        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('categorias')
          .insert({
            slug,
            nombre: formData.nombre,
            icono: formData.icono || null,
          });

        if (insertErr) throw insertErr;
      }

      const wasEditing = !!editingCategory;
      setShowForm(false);
      setEditingCategory(null);
      await fetchCategories();
      setToast({
        message: wasEditing ? `Categoría actualizada — ${formData.nombre}` : `Categoría creada — ${formData.nombre}`,
        variant: 'success',
      });
      setToastKey(k => k + 1);
    } catch (err) {
      const message = (err as PostgrestError | Error).message || 'Error al guardar la categoría';
      console.error('Error saving category:', err);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: CategoryRow) => {
    if (deletingId === category.id) {
      setSaving(true);
      try {
        const { error: delErr } = await supabase
          .from('categorias')
          .delete()
          .eq('id', category.id);

        if (delErr) throw delErr;

        setDeletingId(null);
        await fetchCategories();
        setToast({
          message: `Categoría eliminada — ${category.nombre}`,
          variant: 'remove',
        });
        setToastKey(k => k + 1);
      } catch (err) {
        const message = (err as PostgrestError | Error).message || 'Error al eliminar la categoría';
        console.error('Error deleting category:', err);
        setError(message);
      } finally {
        setSaving(false);
      }
    } else {
      setDeletingId(category.id);
    }
  };

  const startEdit = (category: CategoryRow) => {
    setEditingCategory(category);
    setShowForm(true);
    setError('');
    setDeletingId(null);
  };

  const startCreate = () => {
    setEditingCategory(null);
    setShowForm(true);
    setError('');
    setDeletingId(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setError('');
  };

  if (loading) {
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
          <h1 className="text-lg font-black text-brand-text">Categorías</h1>
        </div>
        {!showForm && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-brand-primary px-4 py-2.5 rounded-xl hover:brightness-95 transition-all shadow-sm"
          >
            <Plus size={16} />
            Nueva
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-brand-danger/5 border border-brand-danger/20 rounded-2xl px-4 py-3 mb-5">
          <AlertCircle size={16} className="text-brand-danger shrink-0" />
          <p className="text-xs font-bold text-brand-danger">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="text-sm font-extrabold text-brand-text mb-4">
            {editingCategory ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <CategoryForm
            initial={editingCategory ? {
              nombre: editingCategory.nombre,
              icono: editingCategory.icono ?? '',
            } : undefined}
            saving={saving}
            onSave={handleSave}
            onCancel={cancelForm}
          />
        </div>
      )}

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Hash size={40} className="text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-400">No hay categorías aún</p>
          <p className="text-xs text-gray-400 mt-1">Crea tu primera categoría para empezar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
            >
              <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 text-xl">
                {category.icono || <Hash size={20} className="text-gray-300" />}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-brand-text text-sm truncate">
                  {category.nombre}
                </h3>
                {category.slug && (
                  <p className="text-xs text-gray-400 mt-0.5">/{category.slug}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(category)}
                  className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Edit3 size={14} className="text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    deletingId === category.id
                      ? 'bg-brand-danger text-white'
                      : 'bg-gray-100 text-gray-400 hover:text-brand-danger hover:bg-brand-danger/10'
                  }`}
                >
                  {saving && deletingId === category.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
