import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { fetchProducts, fetchSpecialMeal } from '../services/googleSheets';
import { ProductCard } from '../components/ProductCard';
import { Toast } from '../components/Toast';
import type { Product, SpecialMeal } from '../types/product';
import { ChevronLeft, ChevronRight, X, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

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

export function MenuPage() {
    const { addToCart } = useCart();


    const [products, setProducts] = useState<Product[]>([]);
    const [specialMeal, setSpecialMeal] = useState<SpecialMeal | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('TODOS');

    const [isSpecialModalOpen, setIsSpecialModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const handleAddToCart = useCallback((item: Product | SpecialMeal) => {
        const safeId = ('id' in item) ? item.id : `special-${item.name.replace(/\s+/g, '-').toLowerCase()}`;

        addToCart({
            cartItemId: safeId,
            name: item.name,
            price: item.price,
            quantity: 1,
            image: item.image,
        });

        setToastMessage(`${item.name} añadido al pedido`);
    }, [addToCart]);

    const handleSelectProduct = useCallback((product: Product) => {
        setSelectedProduct(product);
    }, []);

    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadData() {
            const [data, specialData] = await Promise.all([
                fetchProducts(),
                fetchSpecialMeal()
            ]);

            setProducts(data.filter(p => p.isAvailable));

            if (specialData && specialData.isActive) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const afterStart = !specialData.startDate || today >= specialData.startDate;
                const beforeEnd = !specialData.endDate || today <= specialData.endDate;

                if (afterStart && beforeEnd) {
                    setSpecialMeal(specialData);
                }
            }

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

    const filteredProducts = useMemo(() => products.filter(product => {
        if (product.category === 'MELONA') return false;
        if (activeCategory === 'TODOS') return true;
        return product.category === activeCategory;
    }), [products, activeCategory]);

    return (
        <div className="page-scroll -m-4 space-y-6 p-4">

            <div
                onClick={() => navigate('/builder')}
                className="bg-gradient-to-br from-brand-primary to-orange-600 rounded-3xl p-6 shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)] relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer border-b-4 border-orange-700"
            >
                <div className="relative z-10">
                    <span className="bg-brand-nav text-brand-text text-[10px] font-black uppercase px-2 py-1 rounded-md mb-2 inline-block shadow-sm">El Plato Estrella</span>
                    <h2 className="text-3xl font-black italic text-white drop-shadow-md leading-none mt-1">¡Arma tu<br />Melona!</h2>
                </div>
                <span className="absolute -bottom-6 -right-4 text-9xl opacity-20 rotate-12 drop-shadow-2xl">🍔</span>
            </div>

            {specialMeal && (
                <div
                    onClick={() => setIsSpecialModalOpen(true)}
                    className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center gap-4 hover:border-orange-200"
                >
                    {specialMeal.image ? (
                        <img
                            src={specialMeal.image}
                            alt={specialMeal.name}
                            className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                            <Utensils size={24} />
                        </div>
                    )}

                    <div className="flex flex-col flex-1">
                        <span className="text-[10px] text-brand-primary font-black uppercase tracking-wider mb-0.5">Especial del Día</span>
                        <h3 className="font-black text-brand-text text-sm leading-tight line-clamp-1">{specialMeal.name}</h3>
                        <span className="font-black text-brand-text text-sm mt-1">${specialMeal.price.toLocaleString()}</span>
                    </div>

                    <div className="pr-2">
                        <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-black shadow-md">
                            +
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-2">
                <button onClick={() => scroll('left')} className="hidden md:flex p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-brand-primary border border-gray-200">
                    <ChevronLeft size={20} />
                </button>

                <div ref={scrollRef} className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 pl-1 scroll-smooth w-full">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border flex-shrink-0 ${activeCategory === cat.id
                                ? 'bg-brand-primary text-white border-brand-primary shadow-md scale-105'
                                : 'bg-white text-brand-text border-gray-200 hover:border-orange-300'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>

                <button onClick={() => scroll('right')} className="hidden md:flex p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-brand-primary border border-gray-200">
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-black text-brand-text uppercase px-1 border-b-2 border-gray-100 pb-2">
                    {activeCategory === 'TODOS' ? 'Menú Completo' : activeCategory}
                </h2>

                {loading ? (
                    <div className="text-center py-10 font-bold text-brand-primary">Cargando delicias...</div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onSelect={handleSelectProduct}
                                onAddToCart={handleAddToCart}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-gray-500 py-4 font-medium">No hay productos en esta categoría.</p>
                )}
            </div>

            {isSpecialModalOpen && specialMeal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSpecialModalOpen(false)}></div>
                    <div className="relative bg-white w-full md:max-w-md rounded-[2rem] overflow-hidden shadow-2xl z-10 animate-in slide-in-from-bottom-8 fade-in duration-300">
                        <button onClick={() => setIsSpecialModalOpen(false)} className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/70 active:scale-90 transition-all">
                            <X size={20} strokeWidth={3} />
                        </button>
                        <div className="w-full h-64 bg-gray-100 relative">
                            <img src={specialMeal.image} alt={specialMeal.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 left-4 right-4">
                                <span className="bg-brand-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Recomendado</span>
                                <h2 className="text-white text-3xl font-black mt-2 leading-none drop-shadow-md">{specialMeal.name}</h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <p className="text-gray-600 text-sm font-medium leading-relaxed">{specialMeal.description}</p>
                            <button
                                onClick={() => {
                                    handleAddToCart(specialMeal);
                                    setIsSpecialModalOpen(false);
                                }}
                                className="w-full bg-brand-primary text-white p-4 rounded-2xl font-black flex items-center justify-between shadow-lg shadow-orange-200 active:scale-[0.98] transition-all"
                            >
                                <span className="uppercase tracking-tight text-sm">Añadir al Pedido</span>
                                <span className="text-xl font-black">${specialMeal.price.toLocaleString()}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedProduct(null)}></div>

                    <div className="relative bg-white w-full md:max-w-md rounded-[2rem] overflow-hidden shadow-2xl z-10 animate-in slide-in-from-bottom-8 fade-in duration-300 flex flex-col max-h-[90vh]">
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/70 active:scale-90 transition-all"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="w-full h-64 bg-gray-100 relative shrink-0">
                            {selectedProduct.image && (selectedProduct.image.startsWith('http') || selectedProduct.image.startsWith('https')) ? (
                                <>
                                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                </>
                            ) : (
                                <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                                    <Utensils size={64} className="text-brand-primary/30" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                </div>
                            )}

                            <div className="absolute bottom-4 left-4 right-4 text-left">
                                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border border-white/30">
                                    {selectedProduct.category}
                                </span>
                                <h2 className="text-white text-3xl font-black mt-2 leading-tight drop-shadow-md">
                                    {selectedProduct.name}
                                </h2>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            <p className="text-gray-600 text-sm font-medium leading-relaxed">
                                {selectedProduct.description || "Sin descripción detallada."}
                            </p>

                            <button
                                onClick={() => {
                                    handleAddToCart(selectedProduct);
                                    setSelectedProduct(null);
                                }}
                                className="w-full bg-brand-primary text-white p-4 rounded-2xl font-black flex items-center justify-between shadow-lg shadow-orange-200 active:scale-[0.98] transition-all shrink-0"
                            >
                                <span className="uppercase tracking-tight text-sm">Añadir al Pedido</span>
                                <span className="text-xl font-black">${selectedProduct.price?.toLocaleString()}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Toast
                isVisible={toastMessage !== null}
                message={toastMessage || ''}
                onClose={() => setToastMessage(null)}
            />
        </div>
    );
}