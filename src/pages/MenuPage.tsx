import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { dataService } from '../services/dataService'; 
import { ProductCard } from '../components/ProductCard';
import type { Product, Category, SpecialMeal } from '../types/models'; 
import { ChevronLeft, ChevronRight, X, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export function MenuPage() {
    const { items, addToCart } = useCart();
    const { showToast } = useToast();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [specialMeals, setSpecialMeals] = useState<SpecialMeal[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadData() {
            try {
                const [productsData, categoriesData, specialsData] = await Promise.all([
                    dataService.getProducts(),
                    dataService.getCategories(),
                    dataService.getSpecialMeals()
                ]);

                setSpecialMeals(specialsData);

                setProducts(productsData.filter(p => p.isAvailable));

                const hasAllCategory = categoriesData.some(c => c.id === 'ALL');
                
                if (hasAllCategory) {
                    setCategories(categoriesData);
                } else {
                    const defaultCategory: Category = { id: 'ALL', name: 'All', icon: '📋' };
                    setCategories([defaultCategory, ...categoriesData]);
                }

            } catch (error) {
                console.error("Error al cargar la hoja de cálculo:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleAddToCart = useCallback((item: Product) => {
        const safeId = item.id;
        const currentQty = items.find(i => i.cartItemId === safeId)?.quantity ?? 0;
        const newQty = currentQty + 1;

        addToCart({
            cartItemId: safeId,
            name: item.name,
            price: item.price,
            quantity: 1,
            image: item.image,
        });

        showToast(`${item.name} — x${newQty} en tu pedido`);
    }, [addToCart, items, showToast]);

    const handleSelectProduct = useCallback((product: Product) => {
        setSelectedProduct(product);
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
        if (activeCategory === 'ALL') return true;
        return product.category === activeCategory;
    }), [products, activeCategory]);

    return (
        <div className="page-scroll -m-4 space-y-6 p-4">

            <div
                onClick={() => navigate('/builder')}
                className="bg-gradient-to-br from-[#F2C1C1] to-[#D57479] rounded-3xl p-6 md:w-full shadow-[0_8px_20px_-6px_rgba(213,116,121,0.5)] relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer border-b-4 border-[#d57479] hover:shadow-[0_12px_25px_-6px_rgba(213,116,121,0.6)]"
            >
                <div className="relative z-10">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase px-2 py-1 rounded-md mb-2 inline-block shadow-sm border border-white/20">
                        Producto Personalizado
                    </span>
                    <h2 className="text-3xl font-black italic text-white drop-shadow-md leading-none mt-1">
                        Personaliza Tu<br />Producto!
                    </h2>
                </div>
                <span className="absolute -bottom-6 -right-4 text-9xl opacity-20 rotate-12 drop-shadow-2xl">
                    <img src="/logo_icon.png" alt="Custom Product" className="w-32 h-32 object-contain mb-2 mr-2" />
                </span>
            </div>

            {specialMeals.length > 0 && (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                {specialMeals.length > 3 && (
                    <span className="text-[10px] text-gray-400 font-medium hidden md:block">
                    Desliza para ver más →
                    </span>
                )}
                </div>

                <div 
                className={`
                    flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth
                    ${specialMeals.length === 1 
                    ? 'md:justify-center md:overflow-x-visible md:mx-0 md:px-0 md:snap-none' 
                    : ''
                    }
                    ${specialMeals.length === 2 
                    ? 'md:grid md:grid-cols-2 md:overflow-x-visible md:mx-0 md:px-0 md:snap-none' 
                    : ''
                    }
                    ${specialMeals.length >= 3 
                    ? 'md:snap-x md:snap-mandatory' 
                    : ''
                    }
                `}
                >
                {specialMeals.map((meal) => (
                    <div
                    key={meal.id}
                    onClick={() => handleSelectProduct({
                        id: meal.id,
                        name: meal.name,
                        description: meal.description,
                        price: meal.price,
                        category: 'Special',
                        image: meal.image,
                        isAvailable: true
                    })}
                    className={`
                        bg-white border border-gray-100 rounded-2xl p-4 shadow-sm 
                        active:scale-[0.98] transition-all duration-200 cursor-pointer 
                        flex items-center gap-4 hover:border-[#d57479] hover:shadow-md 
                        snap-start shrink-0 group
                        ${specialMeals.length === 1 
                        ? 'w-[100%] md:w-[450px] lg:w-[500px]'
                        : ''
                        }
                        ${specialMeals.length === 2 
                        ? 'w-[85%] md:w-full'
                        : ''
                        }
                        ${specialMeals.length >= 3 
                        ? 'w-[280px] sm:w-[320px] lg:w-[350px]'
                        : ''
                        }
                    `}
                    >
                    <div className="relative shrink-0">
                        {meal.image ? (
                        <img
                            src={meal.image}
                            alt={meal.name}
                            className={`
                            rounded-xl object-cover border border-gray-100 shadow-sm
                            transition-transform duration-200 group-hover:scale-105
                            ${specialMeals.length === 1 
                                ? 'w-24 h-24 md:w-28 md:h-28' 
                                : 'w-16 h-16'
                            }
                            `}
                            loading="lazy"
                        />
                        ) : (
                        <div className={`
                            bg-orange-50 rounded-xl flex items-center justify-center text-brand-primary
                            ${specialMeals.length === 1 
                            ? 'w-24 h-24 md:w-28 md:h-28' 
                            : 'w-16 h-16'
                            }
                        `}>
                            <Utensils size={specialMeals.length === 1 ? 36 : 24} />
                        </div>
                        )}

                        <span className={`
                        absolute -top-1.5 -right-1.5 bg-brand-primary text-white 
                        text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm
                        ${specialMeals.length === 1 ? 'md:text-[10px] md:px-2' : ''}
                        `}>
                        ★
                        </span>
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[10px] text-brand-primary font-black uppercase tracking-wider mb-0.5">
                        Daily Special
                        </span>
                        <h3 className={`
                        font-black text-brand-text leading-tight line-clamp-1
                        ${specialMeals.length === 1 
                            ? 'text-base md:text-lg' 
                            : 'text-sm'
                        }
                        `}>
                        {meal.name}
                        </h3>
                        {meal.description && specialMeals.length === 1 && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 hidden md:block">
                            {meal.description}
                        </p>
                        )}
                        <span className={`
                        font-black text-brand-text mt-1
                        ${specialMeals.length === 1 
                            ? 'text-lg md:text-xl' 
                            : 'text-sm'
                        }
                        `}>
                        ${meal.price.toLocaleString()}
                        </span>
                    </div>

                    <div className="pr-1">
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart({
                            id: meal.id,
                            name: meal.name,
                            description: meal.description,
                            price: meal.price,
                            category: 'Special',
                            image: meal.image,
                            isAvailable: true
                            });
                        }}
                        className={`
                            rounded-full bg-brand-primary text-white 
                            flex items-center justify-center font-black 
                            shadow-md cursor-pointer active:scale-90 
                            transition-all hover:bg-orange-600 hover:shadow-lg
                            ${specialMeals.length === 1 
                            ? 'w-10 h-10 md:w-12 md:h-12 text-lg' 
                            : 'w-8 h-8'
                            }
                        `}
                        aria-label={`Add ${meal.name} to cart`}
                        >
                        +
                        </button>
                    </div>
                    </div>
                ))}
                </div>

                {specialMeals.length > 3 && (
                <div className="flex justify-center gap-1.5 md:hidden">
                    {specialMeals.map((_, index) => (
                    <div 
                        key={index}
                        className={`
                        rounded-full transition-all duration-300
                        ${index === 0 
                            ? 'w-4 h-1.5 bg-brand-primary' 
                            : 'w-1.5 h-1.5 bg-gray-200'
                        }
                        `}
                    />
                    ))}
                </div>
                )}
            </div>
            )}

            <div className="flex items-center gap-2">
                <button onClick={() => scroll('left')} className="hidden md:flex p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-brand-primary border border-gray-200">
                    <ChevronLeft size={20} />
                </button>

                <div ref={scrollRef} className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 pl-1 scroll-smooth w-full">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border flex-shrink-0 ${activeCategory === cat.id
                                ? 'bg-brand-primary text-white border-brand-primary shadow-md scale-105'
                                : 'bg-white text-brand-text border-gray-200 hover:border-[#d57479]'
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
                    {activeCategory === 'ALL' 
                        ? 'Menú Completo' 
                        : categories.find(c => c.id === activeCategory)?.name || activeCategory}
                </h2>

                {loading ? (
                    <div className="text-center py-10 font-bold text-brand-primary">Cargando delicias...</div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
        </div>
    );
}