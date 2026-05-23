import Papa from 'papaparse';
import type { Product } from '../types/product';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQrftq4ZTAwMAyBUNRHCyUrfx_kq8AasEMsbpAv8-vATGzxYzd-gjlD3dJCMiYO6208b9WJAhKf8vLP/pub?output=csv';

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