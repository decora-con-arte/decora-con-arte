import Papa from 'papaparse';
import type { Category, Product, StoreSchedule, SpecialMeal, Ingredient } from '../types/models';

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;

const PRODUCTS_GID = import.meta.env.VITE_SHEET_GID_PRODUCTS ?? '0';
const CATEGORIES_GID = import.meta.env.VITE_SHEET_GID_CATEGORIES;
const SCHEDULE_GID = import.meta.env.VITE_SHEET_GID_SCHEDULE;
const SPECIALS_GID = import.meta.env.VITE_SHEET_GID_SPECIALS;
const INGREDIENTS_GID = import.meta.env.VITE_SHEET_GID_INGREDIENTS;

const SPECIALS_LIMIT = Number(import.meta.env.VITE_SPECIALS_LIMIT) || 5;

function parseSheetDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  const fallback = new Date(cleaned);
  return isNaN(fallback.getTime()) ? null : fallback;
}

const getSheetUrl = (gid: string | number) =>
  `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=${gid}&single=true&output=csv`;

async function fetchSheetData<T>(
  gid: string | number,
  mapper: (rawRow: any, index: number) => T | null
): Promise<T[]> {
  try {
    const url = getSheetUrl(gid);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} al conectar con GID ${gid}`);
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {

          const data = results.data
            .map((row, index) => mapper(row, index))
            .filter((item): item is T => item !== null);
          
          resolve(data);
        },
        error: (error: Error) => reject(error),
      });
    });
  } catch (error) {
    console.error(`Error en fetchSheetData (GID: ${gid}):`, error);
    return [];
  }
}

export const dataService = {

  getProducts: async (): Promise<Product[]> => {
    return fetchSheetData<Product>(PRODUCTS_GID, (data, index) => {
      
      let rawPrice = String(data.Price || data.Precio || data.precio || '0').trim();
      
      let price = 0;
      
      rawPrice = rawPrice.replace(/[$\s]/g, '');

      if (rawPrice.includes(',') && rawPrice.includes('.')) {
        price = parseFloat(rawPrice.replace(/\./g, '').replace(',', '.'));
      } else if (rawPrice.includes(',')) {
        price = parseFloat(rawPrice.replace(',', '.'));
      } else if (rawPrice.includes('.')) {

        const parts = rawPrice.split('.');
        if (parts[parts.length - 1].length <= 2) {
            price = parseFloat(rawPrice);
        } else {
            price = parseFloat(rawPrice.replace(/\./g, ''));
        }
      } else {
        price = parseFloat(rawPrice);
      }

      if (isNaN(price) || price <= 0) {
        console.warn(`Producto descartado: ${data.Name || 'Sin nombre'} | Valor procesado: ${price}`);
        return null;
      }

      const rawName = (data.Name || data.Nombre || data.nombre || '').trim();
      const safeName = rawName || `Item-${index + 1}`;
      const safeId = data.ID?.trim() || data.id?.trim() || safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const isAvailableRaw = String(data.isAvailable || data.Available || data.Disponibilidad || 'TRUE').toUpperCase().trim();
      const isAvailable = ['SÍ', 'TRUE', '1', 'YES'].includes(isAvailableRaw);

      const description = (data.Description || data.Descripción || data.descripción || '').trim();
      const rawCategory = (data.Category || data.Categoría || data.categoría || 'OTRO').trim();
      const categoryId = rawCategory.toUpperCase().replace(/\s+/g, '-');

      return {
        id: safeId,
        name: safeName,
        description: description,
        price: price,
        category: categoryId,
        image: (data.Image || data.Imagen || data.imagen || '').trim(),
        isAvailable: isAvailable
      };
    });
  },

  getCategories: async (): Promise<Category[]> => {
    return fetchSheetData<Category>(CATEGORIES_GID, (data) => {
      const name = (data.Nombre || data.nombre || data.Name || '').trim();
      
      if (!name) return null; 

      return {
        id: name.toUpperCase().replace(/\s+/g, '-'),
        name: name,
        icon: (data.Icono || data.icono || data.Icon || '📋').trim()
      };
    });
  },
  
  getSpecialMeals: async (): Promise<SpecialMeal[]> => {
    if (!SPECIALS_GID) return [];

    return fetchSheetData<SpecialMeal>(SPECIALS_GID, (data) => {
      const rawName = (data.Name || data.Nombre || '').trim();
      if (!rawName) return null;

      const rawPrice = String(data.Price || data.Precio || '0').replace(/[^0-9.,]/g, '');
      let price = 0;
      if (rawPrice.includes(',') && rawPrice.includes('.')) {
        price = parseFloat(rawPrice.replace(/\./g, '').replace(',', '.'));
      } else if (rawPrice.includes(',')) {
        price = parseFloat(rawPrice.replace(',', '.'));
      } else if (rawPrice.includes('.')) {
        const parts = rawPrice.split('.');
        price = parseFloat(parts[parts.length - 1].length <= 2 ? rawPrice : rawPrice.replace(/\./g, ''));
      } else {
        price = parseFloat(rawPrice);
      }
      if (isNaN(price) || price <= 0) return null;

      const isActive = ['SÍ', 'TRUE', '1', 'YES', 'VERDADERO'].includes(
        String(data.IsActive || data.isActive || data.Activo || 'FALSE').toUpperCase().trim()
      );

      if (!isActive) return null;

      const now = new Date();
      const rawStart = (data['Start Date'] || data.StartDate || data['Fecha Inicio'] || '').trim();
      const rawEnd = (data['End Date'] || data.EndDate || data['Fecha Fin'] || '').trim();
      const startDate = rawStart ? parseSheetDate(rawStart) : null;
      const endDate = rawEnd ? parseSheetDate(rawEnd) : null;

      if (startDate && endDate) {
        if (now < startDate || now > endDate) return null;
      } else if (startDate && now < startDate) {
        return null;
      } else if (endDate && now > endDate) {
        return null;
      }

      const safeName = rawName;
      const safeId = safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      return {
        id: safeId,
        name: safeName,
        description: (data.Description || data.Descripción || data.Descripcion || '').trim(),
        price,
        image: (data.Image || data.Imagen || data.imagen || '').trim(),
        isActive,
        startDate: rawStart || undefined,
        endDate: rawEnd || undefined,
      };
    }).then(items => items.slice(0, SPECIALS_LIMIT));
  },

  getSchedule: async (): Promise<StoreSchedule[]> => {
    return fetchSheetData<StoreSchedule>(SCHEDULE_GID, (data) => {
      const day = (data.Day || data.Dia || '').trim();
      
      if (!day) return null;

      const rawIsOpen = (data.IsOpen || data.Abierto || 'FALSE').toString().trim().toUpperCase();
      const isOpen = ['TRUE', '1', 'SI', 'YES'].includes(rawIsOpen);

      return {
        day: day,
        startTime: (data['Start Time'] || data.HoraInicio  || data['Fecha Inicio'] || '00:00').trim(),
        endTime: (data['End Time'] || data.HoraFin || data['Fecha Fin'] || '23:59').trim(),
        isOpen: isOpen
      };
    });
  },

  getIngredients: async (): Promise<Ingredient[]> => {
    return fetchSheetData<Ingredient>(INGREDIENTS_GID, (data, index) => {
      const name = (data.Nombre || data.Name || '').trim();
      if (!name) return null;

      const category = (data.Categoría || data.Category || 'OTRO').trim();
      const rawPrice = String(data.Price || data.Precio || data.PrecioExtra || data.ExtraPrice || '0').replace(/[^0-9.,]/g, '');
      
      let extraPrice = 0;
      if (rawPrice.includes(',') && rawPrice.includes('.')) {
        extraPrice = parseFloat(rawPrice.replace(/\./g, '').replace(',', '.'));
      } else if (rawPrice.includes(',')) {
        extraPrice = parseFloat(rawPrice.replace(',', '.'));
      } else if (rawPrice.includes('.')) {
        const parts = rawPrice.split('.');
        extraPrice = parseFloat(parts[parts.length - 1].length <= 2 ? rawPrice : rawPrice.replace(/\./g, ''));
      } else {
        extraPrice = parseFloat(rawPrice) || 0;
      }

      const isAvailableRaw = String(data.IsActive || data.isActive || data.Disponibilidad || data.isAvailable || 'Sí').toUpperCase().trim();
      const isAvailable = ['SÍ', 'TRUE', '1', 'YES'].includes(isAvailableRaw);
      
      const isRequiredRaw = String(data.Required || data.isRequired || data.Obligatorio || 'NO').toUpperCase().trim();
      const isRequired = ['SÍ', 'TRUE', '1', 'YES'].includes(isRequiredRaw);

      return {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        category,
        extraPrice,
        isAvailable,
        isRequired,
        stepOrder: parseInt(data.Order || data.Orden || data.StepOrder || '0') || index + 1,
        maxFree: parseInt(data.MaxFree || data.MaxGratis || '0') || 0
      };
    });
  }
};