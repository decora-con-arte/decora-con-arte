import Papa from 'papaparse';
import type { Product } from '../types/models';

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID ?? '';
const PRODUCTS_GID = import.meta.env.VITE_SHEET_GID_PRODUCTS ?? '0';

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

      const rawName = (data.Nombre || data.nombre || data.Name || '').trim();
      const safeName = rawName || `Item-${index + 1}`;
      
      const safeId = data.id?.trim() || safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const rawPriceStr = String(data.Precio || data.precio || data.Price || '0').replace(/[^0-9]/g, '');
      const price = parseInt(rawPriceStr, 10);

      const isAvailable = ['SÍ', 'TRUE', '1', 'YES'].includes(
        String(data.Disponibilidad || data.disponibilidad || data.Available || 'TRUE').toUpperCase().trim()
      );

      return {
        id: safeId,
        name: safeName,
        description: (data.Descripción || data.descripción || data.Description || '').trim(),
        price: price || 0,
        category: (data.Categoría || data.categoría || data.Category || 'OTRO').toUpperCase().replace(/\s+/g, ' ').trim(),
        image: (data.Imagen || data.imagen || data.Image || '').trim(),
        isAvailable: isAvailable
      };
    });
  }
};