import { getSupabase } from './supabaseClient';
import type { Category, Product, StoreSchedule, SpecialMeal, Ingredient } from '../types/models';

const SPECIALS_LIMIT = Number(import.meta.env.VITE_SPECIALS_LIMIT) || 5;

function normalizeId(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '-');
}

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export const dataService = {

  getProducts: async (): Promise<Product[]> => {
    const supabase = getSupabase()
    const { data: rows, error } = await supabase
      .from('productos')
      .select('slug, nombre, descripcion, precio, img_path, disponibilidad, categorias(slug)')
      .order('id');

    if (error) {
      console.error('Error fetching products:', error.message, error.details, error.hint);
      return [];
    }

    return (rows || []).map((row: any) => ({
      id: row.slug || generateSlug(row.nombre),
      name: row.nombre,
      description: row.descripcion || '',
      price: row.precio,
      category: row.categorias?.slug || 'OTRO',
      image: row.img_path || '',
      isAvailable: row.disponibilidad,
    }));
  },

  getCategories: async (): Promise<Category[]> => {
    const supabase = getSupabase()
    const { data: rows, error } = await supabase
      .from('categorias')
      .select('nombre, icono, slug')
      .order('id');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return (rows || []).map((row) => {
      const name = row.nombre.trim();
      const isAllCategory = (['ALL', 'TODOS', 'TODAS', 'TODO'] as string[]).includes(
        name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
      );

      return {
        id: isAllCategory ? 'ALL' : row.slug || normalizeId(name),
        name,
        icon: row.icono || '📋',
      };
    });
  },

  getSpecialMeals: async (): Promise<SpecialMeal[]> => {
    const now = new Date().toISOString();

    const supabase = getSupabase()
    const { data: rows, error } = await supabase
      .from('productos_especiales')
      .select('*')
      .eq('activo', true)
      .or(`fecha_inicio.is.null,fecha_inicio.lte.${now}`)
      .or(`fecha_fin.is.null,fecha_fin.gte.${now}`)
      .order('id')
      .limit(SPECIALS_LIMIT);

    if (error) {
      console.error('Error fetching special meals:', error);
      return [];
    }

    return (rows || []).map((row: any) => ({
      id: generateSlug(row.nombre),
      name: row.nombre,
      description: row.descripcion || '',
      price: row.precio,
      image: row.imagen || '',
      isActive: row.activo,
      startDate: row.fecha_inicio || undefined,
      endDate: row.fecha_fin || undefined,
    }));
  },

  getSchedule: async (): Promise<StoreSchedule[]> => {
    const supabase = getSupabase()
    const { data: rows, error } = await supabase
      .from('horarios')
      .select('dia, hora_inicio, hora_fin, abierto')
      .order('id');

    if (error) {
      console.error('Error fetching schedule:', error);
      return [];
    }

    return (rows || []).map((row: any) => ({
      day: row.dia,
      startTime: formatTime(row.hora_inicio),
      endTime: formatTime(row.hora_fin),
      isOpen: row.abierto,
    }));
  },

  getIngredients: async (): Promise<Ingredient[]> => {
    const supabase = getSupabase()
    const { data: rows, error } = await supabase
      .from('ingredientes')
      .select('nombre, precio_extra, disponible, obligatorio, step_order, max_gratis, categorias(nombre)')
      .order('step_order')
      .order('id');

    if (error) {
      console.error('Error fetching ingredients:', error.message, error.details, error.hint);
      return [];
    }

    return (rows || []).map((row: any) => ({
      id: generateSlug(row.nombre),
      name: row.nombre,
      category: row.categorias?.nombre || 'OTRO',
      extraPrice: row.precio_extra,
      isAvailable: row.disponible,
      isRequired: row.obligatorio,
      stepOrder: row.step_order,
      maxFree: row.max_gratis,
    }));
  },
};
