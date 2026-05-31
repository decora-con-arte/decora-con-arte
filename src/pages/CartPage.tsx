import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import type { CartItem } from '../context/CartContext';
import { CartItemRow } from '../components/CartItemRow';
import { useToast } from '../context/ToastContext';
import type { ToastVariant } from '../components/Toast';
import { ShoppingBag, ArrowRight, ChevronLeft, ShoppingCart } from 'lucide-react';

export function CartPage() {
  const { items, totalPrice, totalItems, clearCart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const notify = useCallback((message: string, variant: ToastVariant = 'success') => {
    showToast(message, variant);
  }, [showToast]);

  const handleQuantityChange = useCallback((item: CartItem, delta: number) => {
    updateQuantity(item.cartItemId, delta);
    const newQty = item.quantity + delta;
    if (delta > 0) {
      notify(`${item.name} — x${newQty} en tu pedido`);
    } else {
      notify(`${item.name} — x${newQty} en tu pedido`);
    }
  }, [updateQuantity, notify]);

  const handleRemove = useCallback((item: CartItem) => {
    removeFromCart(item.cartItemId);
    notify(`${item.name} — eliminado del carrito`, 'remove');
  }, [removeFromCart, notify]);

  const handleClearCart = useCallback(() => {
    clearCart();
    notify('Tu pedido — carrito vaciado', 'remove');
  }, [clearCart, notify]);

  const handleCheckout = () => {
    const phone = import.meta.env.VITE_WHATSAPP_PHONE;
    
    const messageLines = [
      `*¡Hola!* 🍔`,
      `Quiero hacer un pedido:`,
    ];
    
    items.forEach(item => {
      messageLines.push(`*${item.quantity}x* ${item.name}`);
      
      if (item.description) {
        item.description.split('\n').forEach(descLine => {
          messageLines.push(`   ${descLine}`);
        });
      }
      
      messageLines.push(`   *Subtotal:* $${(item.price * item.quantity).toLocaleString()}`);
      messageLines.push(``);
    });

    messageLines.push(`*Total a pagar: $${totalPrice.toLocaleString()}*`);
    messageLines.push(``);
    messageLines.push(`_Pedido enviado desde la App_`);

    const completoMensaje = messageLines.join('\n');
    const textoCodificado = encodeURIComponent(completoMensaje);

    window.open(`https://wa.me/${phone}?text=${textoCodificado}`, '_blank');
    clearCart();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} className="text-brand-primary/30" />
        </div>
        <h2 className="text-2xl font-black text-brand-text mb-2 uppercase">Tu carrito está vacío</h2>
        <p className="text-gray-500 text-sm mb-8 font-medium">Parece que aún no has elegido tu Melona ideal. ¡No dejes que tu barriga sufra!</p>
        <button 
          onClick={() => navigate('/')}
          className="btn-cta !w-auto px-8 flex items-center gap-2"
        >
          Ver el menú <ArrowRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <div className="page-with-checkout animate-in fade-in duration-500">
      <div className="page-scroll p-4 pb-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-brand-text active:scale-90 transition-transform"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-black text-brand-text uppercase italic tracking-tight">Tu Pedido</h2>
          </div>
          <button 
            onClick={handleClearCart}
            className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg active:bg-red-100"
          >
            Vaciar
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <CartItemRow
              key={item.cartItemId}
              item={item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      <div className="checkout-bar">
        <div className="checkout-bar__total-row">
          <span className="checkout-bar__label">Total · {totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          <span className="checkout-bar__amount">${totalPrice.toLocaleString()}</span>
        </div>

        <button type="button" onClick={handleCheckout} className="btn-cta">
          <ShoppingCart size={20} strokeWidth={2.5} />
          <span>Pedir por WhatsApp</span>
        </button>
        <p className="checkout-bar__hint">Atención inmediata · Don Melona</p>
      </div>
    </div>
  );
}
