import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { storageService } from '../../services/storageService';
import { ProductForm } from '../../components/admin/ProductForm';
import { Loader2, ChevronLeft, Plus, Image as ImageIcon, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { Toast, type ToastVariant } from '../../components/Toast';
import type { PostgrestError } from '@supabase/supabase-js';

interface ProductRow {
  id: number;
  slug: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria_id: number | null;
  img_path: string | null;
  disponibilidad: boolean;
  categorias?: { nombre: string } | null;
}

interface CategoryRow {
  id: number;
  nombre: string;
}

interface FormPayload {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: string;
  disponibilidad: boolean;
  file?: File;
  removeImage?: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function AdminProductos() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const mountedRef = useRef(true);

  const fetchProducts = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .order('id', { ascending: false });

    if (err) {
      console.error('Error fetching products:', err);
      setError('No se pudieron cargar los productos');
      return;
    }
    setProducts((data ?? []) as unknown as ProductRow[]);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('categorias')
      .select('id, nombre')
      .order('id');

    if (!err) setCategories((data ?? []) as CategoryRow[]);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        await Promise.all([fetchProducts(), fetchCategories()]);
      } catch (err) {
        console.error('Error loading admin data:', err);
        setError('Error al cargar los datos');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => { mountedRef.current = false; };
  }, [fetchProducts, fetchCategories]);

  const handleSave = async (formData: FormPayload) => {
    setSaving(true);
    setError('');

    const slug = editingProduct?.slug ?? slugify(formData.nombre);

    try {
      let imageUrl = editingProduct?.img_path ?? '';

      if (formData.removeImage) {
        if (editingProduct?.img_path) {
          await storageService.remove(editingProduct.img_path);
        }
        imageUrl = '';
      }

      if (formData.file) {
        if (editingProduct?.img_path) {
          await storageService.remove(editingProduct.img_path);
        }
        imageUrl = await storageService.upload(formData.file, slug);
      }

      const categoriaId = formData.categoria_id ? Number(formData.categoria_id) : null;

      if (editingProduct) {
        const { error: updateErr } = await supabase
          .from('productos')
          .update({
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
            precio: formData.precio,
            categoria_id: categoriaId,
            img_path: imageUrl || null,
            disponibilidad: formData.disponibilidad,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProduct.id);

        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('productos')
          .insert({
            slug,
            nombre: formData.nombre,
            descripcion: formData.descripcion || null,
            precio: formData.precio,
            categoria_id: categoriaId,
            img_path: imageUrl || null,
            disponibilidad: formData.disponibilidad,
          });

        if (insertErr) throw insertErr;
      }

      const wasEditing = !!editingProduct;
      setShowForm(false);
      setEditingProduct(null);
      await fetchProducts();
      setToast({
        message: wasEditing ? `Producto actualizado — ${formData.nombre}` : `Producto creado — ${formData.nombre}`,
        variant: 'success',
      });
      setToastKey(k => k + 1);
    } catch (err) {
      const message = (err as PostgrestError | Error).message || 'Error al guardar el producto';
      console.error('Error saving product:', err);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: ProductRow) => {
    if (deletingId === product.id) {
      setSaving(true);
      try {
        if (product.img_path) {
          await storageService.remove(product.img_path);
        }

        const { error: delErr } = await supabase
          .from('productos')
          .delete()
          .eq('id', product.id);

        if (delErr) throw delErr;

        setDeletingId(null);
        await fetchProducts();
        setToast({
          message: `Producto eliminado — ${product.nombre}`,
          variant: 'remove',
        });
        setToastKey(k => k + 1);
      } catch (err) {
        const message = (err as PostgrestError | Error).message || 'Error al eliminar el producto';
        console.error('Error deleting product:', err);
        setError(message);
      } finally {
        setSaving(false);
      }
    } else {
      setDeletingId(product.id);
    }
  };

  const startEdit = (product: ProductRow) => {
    setEditingProduct(product);
    setShowForm(true);
    setError('');
    setDeletingId(null);
  };

  const startCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
    setError('');
    setDeletingId(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
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
          <h1 className="text-lg font-black text-brand-text">Productos</h1>
        </div>
        {!showForm && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-brand-primary px-4 py-2.5 rounded-xl hover:brightness-95 transition-all shadow-sm"
          >
            <Plus size={16} />
            Nuevo
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
            {editingProduct ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <ProductForm
            categories={categories}
            initial={editingProduct ? {
              nombre: editingProduct.nombre,
              descripcion: editingProduct.descripcion ?? '',
              precio: String(editingProduct.precio),
              categoria_id: editingProduct.categoria_id ? String(editingProduct.categoria_id) : '',
              disponibilidad: editingProduct.disponibilidad,
              img_path: editingProduct.img_path ?? undefined,
            } : undefined}
            saving={saving}
            onSave={handleSave}
            onCancel={cancelForm}
          />
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon size={40} className="text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-400">No hay productos aún</p>
          <p className="text-xs text-gray-400 mt-1">Crea tu primer producto para empezar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
            >
              <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                {product.img_path ? (
                  <img
                    src={product.img_path}
                    alt={product.nombre}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon size={20} className="text-gray-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-brand-text text-sm truncate">
                  {product.nombre}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-brand-primary">
                    ${product.precio.toLocaleString()}
                  </span>
                  {product.categorias && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{product.categorias.nombre}</span>
                    </>
                  )}
                  {!product.disponibilidad && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs font-bold text-brand-danger">No disponible</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(product)}
                  className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Edit3 size={14} className="text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    deletingId === product.id
                      ? 'bg-brand-danger text-white'
                      : 'bg-gray-100 text-gray-400 hover:text-brand-danger hover:bg-brand-danger/10'
                  }`}
                >
                  {saving && deletingId === product.id ? (
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
