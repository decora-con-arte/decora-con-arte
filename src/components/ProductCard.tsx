import { memo, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { Product } from '../types/models';
import { useCart } from '../context/CartContext';

const ADD_HIGHLIGHT_MS = 250;

interface ProductCardProps {
  product: Product; 
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = memo(function ProductCard({ product, onSelect, onAddToCart }: ProductCardProps) {
  const { items } = useCart();
  const cartQuantity = items.find(i => i.cartItemId === product.id)?.quantity ?? 0;
  const inCart = cartQuantity > 0;

  const [imgError, setImgError] = useState(false);
  const [isAddHighlighted, setIsAddHighlighted] = useState(false);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => {
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
  }, []);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddHighlighted(true);
    onAddToCart(product);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => setIsAddHighlighted(false), ADD_HIGHLIGHT_MS);
  };
  
  const priceFormatted = product.price ? product.price.toLocaleString() : '0';
  const isImageUrl = product.image?.startsWith('http://') || product.image?.startsWith('https://');

  return (
    <div 
      onClick={() => onSelect(product)}
      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-[0.98] hover:shadow-md transition-all cursor-pointer"
    >
      <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shadow-inner border border-gray-100 overflow-hidden flex-shrink-0 relative">
        {inCart && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-black flex items-center justify-center shadow-sm border border-white z-10">
            {cartQuantity}
          </span>
        )}
        {isImageUrl && !imgError ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageIcon size={24} strokeWidth={1.5} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-brand-text text-base leading-tight truncate">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {product.description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-black text-brand-primary text-lg">
            ${priceFormatted}
          </span>
          <button 
            onClick={handleAddClick}
            className={`min-w-[4.5rem] text-xs font-black px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 ${
              isAddHighlighted || inCart
                ? 'bg-brand-primary text-white shadow-md shadow-[#F2C1C1]-200/60'
                : 'bg-gray-100 text-brand-text active:bg-brand-primary active:text-white hover:bg-brand-primary hover:text-white'
            }`}
          >
            {inCart ? `×${cartQuantity}` : 'Añadir'}
          </button>
        </div>
      </div>
    </div>
  );
});