import { useState } from 'react';
import type { Product } from '../types/product';

const CATEGORY_ICONS: Record<string, string> = {
  PICADAS: '🥗',
  CARNES: '🥩',
  BURROS: '🌯',
  HAMBURGUESAS: '🍔',
  PAPAS: '🍟',
  PERROS: '🌭',
  BEBIDAS: '🥤',
  OTRO: '🍽️'
};

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const [imgError, setImgError] = useState(false); 
  
  const priceFormatted = product.price ? product.price.toLocaleString() : '0';
  const isImageUrl = product.image?.startsWith('http://') || product.image?.startsWith('https://');
  const fallbackIcon = CATEGORY_ICONS[product.category] || CATEGORY_ICONS.OTRO;

  return (
    <div 
      onClick={() => onSelect(product)}
      className="bg-white p-4 rounded-2xl shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center gap-4 active:scale-[0.98] hover:shadow-md transition-all cursor-pointer"
    >
      <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-3xl shadow-inner border border-gray-100 overflow-hidden flex-shrink-0">
        {isImageUrl && !imgError ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span role="img" aria-label={product.category} className="opacity-80">
            {fallbackIcon}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
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