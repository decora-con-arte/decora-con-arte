import Papa from 'papaparse';
import type { Product, SpecialMeal, Ingredient, IngredientCategory, StoreSchedule } from '../types/product';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSf-ehQbxC87zfQkwQlhQ_SXiMzFiKmxZ3amTS1zV6oPJiP2GPhSh3g8zUXtsgqiW9fkkpoFmFC6zCo/pub?gid=0&single=true&output=csv';

const SPECIAL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSf-ehQbxC87zfQkwQlhQ_SXiMzFiKmxZ3amTS1zV6oPJiP2GPhSh3g8zUXtsgqiW9fkkpoFmFC6zCo/pub?gid=1183394839&single=true&output=csv';

const INGREDIENTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSf-ehQbxC87zfQkwQlhQ_SXiMzFiKmxZ3amTS1zV6oPJiP2GPhSh3g8zUXtsgqiW9fkkpoFmFC6zCo/pub?gid=500777&single=true&output=csv';

const SCHEDULE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSf-ehQbxC87zfQkwQlhQ_SXiMzFiKmxZ3amTS1zV6oPJiP2GPhSh3g8zUXtsgqiW9fkkpoFmFC6zCo/pub?gid=1757918505&single=true&output=csv';

export async function fetchProducts(): Promise<Product[]> {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Error al conectar con Sheets');

        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results: Papa.ParseResult<any>) => {
                    const rawData = results.data as any[];

                    const products = rawData.map((data: any, index: number) => {
                        const rawName = (data.Nombre || data.nombre || '').trim();
                        const safeName = rawName || `Producto-Sin-Nombre-${index}`;

                        const safeId = data.id?.trim() || safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                        const rawPriceStr = String(data.Precio || data.precio || '0').replace(/[^0-9]/g, '');
                        const price = parseInt(rawPriceStr, 10);
                        const isValidPrice = !isNaN(price) && price > 0;

                        const isAvailableInSheet = ['SÍ', 'TRUE', '1'].includes(
                            String(data.Disponibilidad || data.disponibilidad).toUpperCase()
                        );

                        const isAvailable = isAvailableInSheet && isValidPrice;

                        if (isAvailableInSheet && !isValidPrice) {
                            console.warn(`[Don Melona] Producto desactivado por precio inválido: ${safeName}`);
                        }

                        return {
                            id: safeId,
                            name: safeName,
                            description: (data.Descripción || data.descripción || '').trim(),
                            price: price || 0,
                            category: (data.Categoría || data.categoría || 'OTRO').toUpperCase().replace(/\s+/g, ' ').trim(),
                            image: (data.Imagen || data.imagen || '🍔').trim(),
                            isAvailable: isAvailable
                        };
                    });

                    resolve(products);
                },
                error: (error: Error) => {
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

function parseSheetDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.trim() === '') return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; 
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
    return null;
}

export async function fetchSpecialMeal(): Promise<SpecialMeal | null> {
    try {
        const response = await fetch(SPECIAL_CSV_URL);
        if (!response.ok) throw new Error('Error al conectar con la pestaña Especiales');

        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results: Papa.ParseResult<any>) => {
                    const rawData = results.data as any[];
                    if (rawData.length === 0) {
                        resolve(null);
                        return;
                    }

                    // Solo nos interesa la primera fila (el almuerzo activo)
                    const data = rawData[0];
                    
                    const isActive = ['SÍ', 'TRUE', '1', 'VERDADERO'].includes(
                        String(data.Activo || data.activo || '').toUpperCase().trim()
                    );

                    const special: SpecialMeal = {
                        name: (data.Nombre || data.nombre || '').trim(),
                        description: (data.Descripcion || data.Descripción || '').trim(),
                        price: parseInt(String(data.Precio || '0').replace(/[^0-9]/g, ''), 10) || 0,
                        image: (data.Imagen || data.imagen || '').trim(),
                        isActive: isActive,
                        startDate: parseSheetDate(data['Fecha Inicio'] || data.FechaInicio || ''),
                        endDate: parseSheetDate(data['Fecha Fin'] || data.FechaFin || '')
                    };

                    resolve(special);
                },
                error: (error: Error) => reject(error)
            });
        });
    } catch (error) {
        console.error('Error fetching special meal:', error);
        return null;
    }
}

export async function fetchIngredients(): Promise<Ingredient[]> {
    try {
        const response = await fetch(INGREDIENTS_CSV_URL);
        if (!response.ok) throw new Error('Error al conectar con Sheets');

        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results: Papa.ParseResult<any>) => {
                    const rawData = results.data as any[];

                    const ingredients = rawData.map((data: any, index: number) => {
                        const rawName = (data.Nombre || '').trim();
                        
                        const safeId = `ing-${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`;
                        
                        const rawPriceStr = String(data.PrecioExtra || '0').replace(/[^0-9]/g, '');
                        const extraPrice = parseInt(rawPriceStr, 10) || 0;

                        // 1. Limpiamos espacios y pasamos a mayúsculas
                        const rawCategory = (data.Categoría || '').trim().toUpperCase();
                        
                        // 2. Quitamos tildes (convierte PROTEÍNA en PROTEINA)
                        const cleanCategory = rawCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                        // 3. Mapeamos el español al tipo exacto de TypeScript
                        let category: IngredientCategory = 'TOPPING';
                        
                        if (cleanCategory === 'BASE') {
                            category = 'BASE';
                        } else if (cleanCategory === 'PROTEINA' || cleanCategory === 'PROTEIN') {
                            category = 'PROTEIN';
                        } else if (cleanCategory === 'TOPPING') {
                            category = 'TOPPING';
                        } else if (cleanCategory === 'SALSA' || cleanCategory === 'SAUCE') {
                            category = 'SAUCE';
                        }

                        const isAvailable = ['SÍ', 'TRUE', '1'].includes(
                            String(data.Disponibilidad || '').toUpperCase()
                        );

                        return {
                            id: safeId,
                            name: rawName,
                            category: category,
                            extraPrice: extraPrice,
                            isAvailable: isAvailable
                        };
                    });

                    resolve(ingredients.filter(ing => ing.isAvailable));
                },
                error: (error: Error) => reject(error)
            });
        });
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

export async function fetchSchedule(): Promise<StoreSchedule[]> {
  try {
    const response = await fetch(SCHEDULE_CSV_URL);

    if (!response.ok) {
      throw new Error("No se pudo conectar con la hoja de horarios");
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          const rawData = results.data as any[];

          const schedule: StoreSchedule[] = rawData
            .map((data: any) => ({
              dia: (data.dia || data.Dia || '').trim(),
              horaInicio: (data.horaInicio || data['Hora Inicio'] || data.HoraInicio || '').trim(),
              horaFin: (data.horaFin || data['Hora Fin'] || data.HoraFin || '').trim(),
              cerrado: (data.cerrado || data.Cerrado || '').trim()
            }))
            .filter(row => row.dia !== '');

          resolve(schedule);
        },
        error: (error: Error) => reject(error)
      });
    });
  } catch (error) {
    console.error("Error en fetchSchedule:", error);
    return [];
  }
}