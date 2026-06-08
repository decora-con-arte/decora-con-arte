import Papa from 'papaparse';
import type { Category, Product, StoreSchedule } from '../types/models';

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;
const PRODUCTS_GID = import.meta.env.VITE_SHEET_GID_PRODUCTS ?? '0';
const CATEGORIES_GID = import.meta.env.VITE_SHEET_GID_CATEGORIES;
const SCHEDULE_GID = import.meta.env.VITE_SHEET_GID_SCHEDULE;

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
      
      if (!name) return null; // Ignora filas vacías

      return {
        id: name.toUpperCase().replace(/\s+/g, '-'), // Ej: "Hamburguesas" -> "HAMBURGUESAS"
        name: name,
        icon: (data.Icono || data.icono || data.Icon || '📋').trim()
      };
    });
  },
  
  getSchedule: async (): Promise<StoreSchedule[]> => {
    return fetchSheetData<StoreSchedule>(SCHEDULE_GID, (data) => {
      const day = (data.Day || data.Dia || '').trim();
      
      if (!day) return null;

      const rawIsOpen = (data.IsOpen || data.Abierto || 'FALSE').toString().trim().toUpperCase();
      const isOpen = ['TRUE', '1', 'SI', 'YES'].includes(rawIsOpen);

      return {
        day: day,
        startTime: (data['Start Time'] || data.HoraInicio || '00:00').trim(),
        endTime: (data['End Time'] || data.HoraFin || '23:59').trim(),
        isOpen: isOpen
      };
    });
  }
};