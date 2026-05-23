import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { ProductCard } from './components/ProductCard';
import { fetchProducts } from './services/googleSheets';
import type { Product } from './types/product';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await fetchProducts();
      console.log('Productos procesados:', data); // <--- Mira esto en consola
      setProducts(data.filter(p => p.isAvailable));
      setLoading(false);
    }
    loadData();
  }, []);

  // Filtramos los productos normales para la lista inferior 
  // (Excluimos la categoría 'MELONA' porque esa va en el banner principal)
  const menuProducts = products.filter(p => p.category !== 'MELONA');

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* 🌟 BANNER PRINCIPAL: ARMAR MELONA 🌟 */}
        <div 
          onClick={() => console.log('Abrir configurador de Melona')}
          className="bg-gradient-to-br from-brand-primary to-orange-600 rounded-3xl p-6 shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)] relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer border-b-4 border-orange-700"
        >
          <div className="relative z-10">
            <span className="bg-brand-nav text-brand-text text-[10px] font-black uppercase px-2 py-1 rounded-md mb-2 inline-block shadow-sm">
              El Plato Estrella
            </span>
            <h2 className="text-3xl font-black italic text-white drop-shadow-md leading-none mt-1">
              ¡Arma tu<br/>Melona!
            </h2>
            <p className="text-sm font-medium mt-2 text-white/90 leading-tight w-3/4">
              Personalízala paso a paso con tus ingredientes favoritos.
            </p>
          </div>
          <span className="absolute -bottom-6 -right-4 text-9xl opacity-20 rotate-12 drop-shadow-2xl">🍟</span>
        </div>

        {/* LISTA DE OTROS PRODUCTOS (Bebidas, Adicionales) */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-brand-text uppercase px-1 border-b-2 border-gray-100 pb-2">
            Para Acompañar
          </h2>
          
          {loading ? (
            <div className="flex flex-col gap-4 animate-pulse pt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 h-24 rounded-2xl w-full"></div>
              ))}
            </div>
          ) : menuProducts.length > 0 ? (
            menuProducts.map(product => (
              <ProductCard 
                key={product.id}
                product={product} 
                onSelect={(p) => console.log('Seleccionado:', p)} 
              />
            ))
          ) : (
            <p className="text-center text-sm text-gray-500 pt-4">No hay productos adicionales disponibles en este momento.</p>
          )}
        </div>

      </div>
    </Layout>
  );
}

export default App;