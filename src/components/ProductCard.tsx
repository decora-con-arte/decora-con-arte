import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const priceFormatted = product.price ? product.price.toLocaleString() : '0';

  // 🕵️‍♂️ Detectamos si lo que viene en 'image' es un link o un emoji/texto corto
  const isImageUrl = product.image?.startsWith('http://') || product.image?.startsWith('https://');

  return (
    <div 
      onClick={() => onSelect(product)}
      className="bg-white p-4 rounded-2xl shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center gap-4 active:scale-[0.98] hover:shadow-md transition-all cursor-pointer"
    >
      {/* Contenedor de la imagen */}
      <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-3xl shadow-inner border border-gray-100 overflow-hidden flex-shrink-0">
        {isImageUrl ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
            loading="lazy" // Mejora rendimiento de carga
          />
        ) : (
          product.image || '🥤'
        )}
      </div>

      {/* Info del producto */}
      <div className="flex-1 min-w-0"> {/* El min-w-0 evita que textos largos rompan el flex */}
        <h3 className="font-black text-brand-text text-lg leading-tight truncate">
          {product.name}
        </h3>
        <p className="text-xs text-brand-text/50 mt-1 line-clamp-2 font-medium">
          {product.description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-black text-brand-primary text-lg">
            ${priceFormatted}
          </span>
          
          <button className="bg-gray-100 text-brand-text text-xs font-black px-4 py-2 rounded-lg hover:bg-brand-primary hover:text-white transition-colors shadow-sm">
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}