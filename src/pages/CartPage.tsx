import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CartItemRow } from '../components/CartItemRow';
import { ShoppingBag, ArrowRight, ChevronLeft, ShoppingCart } from 'lucide-react';

export function CartPage() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    const phone = "573195543774";
    
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
          className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-orange-200 active:scale-95 transition-all flex items-center gap-2"
        >
          VER EL MENÚ <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="pb-40 animate-in fade-in duration-500">

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
          onClick={clearCart}
          className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg active:bg-red-100"
        >
          Vaciar
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <CartItemRow key={item.cartItemId} item={item} />
        ))}
      </div>

      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full md:max-w-md bg-white/95 backdrop-blur-md border-t border-gray-100 p-6 z-[40] shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400 font-bold text-sm uppercase tracking-widest">Total ({totalItems} items)</span>
          <span className="text-2xl font-black text-brand-text">${totalPrice.toLocaleString()}</span>
        </div>
        
        <button 
          onClick={handleCheckout}
          className="w-full bg-brand-primary text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-orange-200 active:scale-[0.98] transition-all"
        >
          <ShoppingCart size={20} />
          <span className="uppercase tracking-tight">Pedir por WhatsApp</span>
        </button>
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase mt-4 tracking-widest">Atención inmediata • Don Melona</p>
      </div>
    </div>
  );
}