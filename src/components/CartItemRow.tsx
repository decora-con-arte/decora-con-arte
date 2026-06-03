import { Minus, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import type { CartItem } from '../context/CartContext'; 
    
interface Props {
  item: CartItem;
  onQuantityChange: (item: CartItem, delta: number) => void;
  onRemove: (item: CartItem) => void;
}

export function CartItemRow({ item, onQuantityChange, onRemove }: Props) {

  return (
    <div className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4">

      <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center text-gray-300">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={24} strokeWidth={1.5} />
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-bold text-brand-text text-sm leading-tight truncate">{item.name}</h3>
          {item.description && (
            <p className="text-[11px] text-gray-500 mt-1 whitespace-pre-line line-clamp-2">
                {item.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="font-black text-brand-primary text-sm">
            ${(item.price * item.quantity).toLocaleString()}
          </span>

          <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1 border border-gray-200">
            {item.quantity === 1 ? (
              <button 
                onClick={() => onRemove(item)}
                className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 size={14} />
              </button>
            ) : (
              <button 
                onClick={() => onQuantityChange(item, -1)}
                className="w-7 h-7 flex items-center justify-center text-brand-text hover:bg-white rounded-full transition-all shadow-sm"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
            )}
            
            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
            
            <button 
              onClick={() => onQuantityChange(item, 1)}
              className="w-7 h-7 flex items-center justify-center bg-brand-primary text-white rounded-full transition-all shadow-sm active:scale-90"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}