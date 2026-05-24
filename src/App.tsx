import { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { fetchProducts } from './services/googleSheets';
import { ProductCard } from './components/ProductCard';
import type { Product } from './types/product';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { id: 'TODOS', name: 'Todos', icon: '📋' },
  { id: 'PICADAS', name: 'Picadas', icon: '🥘' },
  { id: 'CARNES', name: 'Carnes', icon: '🍖' },
  { id: 'BURROS', name: 'Burros', icon: '🌯' },
  { id: 'HAMBURGUESAS', name: 'Hamburguesas', icon: '🍔' },
  { id: 'PAPAS', name: 'Papas', icon: '🍟' },
  { id: 'PERROS', name: 'Perros', icon: '🌭' },
  { id: 'BEBIDAS', name: 'Bebidas', icon: '🥤' }
];

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('TODOS');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const data = await fetchProducts();
      setProducts(data.filter(p => p.isAvailable));
      setLoading(false);
    }
    loadData();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  const filteredProducts = products.filter(product => {
    if (product.category === 'MELONA') return false; 
    if (activeCategory === 'TODOS') return true;
    return product.category === activeCategory;
  });

  return (
    <Layout>
      <div className="space-y-6">

        <div 
          onClick={() => console.log('Abrir configurador')}
          className="bg-gradient-to-br from-brand-primary to-orange-600 rounded-3xl p-6 shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)] relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer border-b-4 border-orange-700"
        >
          <div className="relative z-10">
            <span className="bg-brand-nav text-brand-text text-[10px] font-black uppercase px-2 py-1 rounded-md mb-2 inline-block shadow-sm">El Plato Estrella</span>
            <h2 className="text-3xl font-black italic text-white drop-shadow-md leading-none mt-1">¡Arma tu<br/>Melona!</h2>
          </div>
          <span className="absolute -bottom-6 -right-4 text-9xl opacity-20 rotate-12 drop-shadow-2xl">🍔</span>
        </div>

        <div className="flex items-center gap-2">
          
          <button 
            onClick={() => scroll('left')} 
            className="hidden md:flex p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-brand-primary hover:bg-gray-50 border border-gray-200 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={20} />
          </button>

          <div 
            ref={scrollRef} 
            className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 pl-1 scroll-smooth w-full"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border flex-shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-brand-primary text-white border-brand-primary shadow-md scale-105'
                    : 'bg-white text-brand-text border-gray-200 hover:border-orange-300'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          <button 
            onClick={() => scroll('right')} 
            className="hidden md:flex p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-brand-primary hover:bg-gray-50 border border-gray-200 transition-colors flex-shrink-0"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black text-brand-text uppercase px-1 border-b-2 border-gray-100 pb-2">
            {activeCategory === 'TODOS' ? 'Menú Completo' : activeCategory}
          </h2>
          
          {loading ? (
            <div className="text-center py-10">Cargando...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onSelect={(p) => console.log(p)} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500 py-4">No hay productos en esta categoría.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default App;