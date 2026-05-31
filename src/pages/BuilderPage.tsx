import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Check, ChevronDown } from 'lucide-react';
import { fetchIngredients } from '../services/googleSheets';
import type { Ingredient } from '../types/product';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const FREE_LIMITS = {
    PROTEIN: 1,
    TOPPING: 1,
    SAUCE: 3
};

const SECTION_ORDER = ['BASE', 'PROTEIN', 'TOPPING', 'SAUCE'];
const REQUIRED_SECTIONS = new Set(['BASE', 'PROTEIN']);

export function BuilderPage() {

    const navigate = useNavigate();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);

    const [openSection, setOpenSection] = useState<string | null>('BASE');

    const [selectedBase, setSelectedBase] = useState<string | null>(null);
    const [selectedProteins, setSelectedProteins] = useState<string[]>([]);
    const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
    const [selectedSauces, setSelectedSauces] = useState<string[]>([]);

    const { addToCart } = useCart();
    const { showToast } = useToast();

    useEffect(() => {
        async function load() {
            const data = await fetchIngredients();
            setIngredients(data);
            setLoading(false);
        }
        load();
    }, []);

    const calculateTotal = () => {
        let total = 0;

        if (selectedBase) {
            const baseIng = ingredients.find(i => i.id === selectedBase);
            total += baseIng?.extraPrice || 0;
        }

        if (selectedProteins.length > FREE_LIMITS.PROTEIN) {
            selectedProteins.slice(FREE_LIMITS.PROTEIN).forEach(id => {
                const ing = ingredients.find(i => i.id === id);
                total += ing?.extraPrice || 0;
            });
        }

        if (selectedToppings.length > FREE_LIMITS.TOPPING) {
            selectedToppings.slice(FREE_LIMITS.TOPPING).forEach(id => {
                const ing = ingredients.find(i => i.id === id);
                total += ing?.extraPrice || 0;
            });
        }

        if (selectedSauces.length > FREE_LIMITS.SAUCE) {
            selectedSauces.slice(FREE_LIMITS.SAUCE).forEach(id => {
                const ing = ingredients.find(i => i.id === id);
                total += ing?.extraPrice || 0;
            });
        }

        return total;
    };

    const toggleSelection = (id: string, category: string) => {
        if (category === 'BASE') {
            if (selectedBase === id) {
                setSelectedBase(null);
            } else {
                setSelectedBase(id);
                setOpenSection('PROTEIN');
            }
        } else if (category === 'PROTEIN') {
            setSelectedProteins(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        } else if (category === 'TOPPING') {
            setSelectedToppings(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        } else if (category === 'SAUCE') {
            setSelectedSauces(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        }
    };

    const toggleSection = (category: string) => {
        setOpenSection(prev => {
            if (prev === category) {
                const currentIndex = SECTION_ORDER.indexOf(category);
                const nextIndex = currentIndex + 1;

                return nextIndex < SECTION_ORDER.length ? SECTION_ORDER[nextIndex] : null;
            }

            return category;
        });
    };

    const handleAddToCart = () => {
        const getName = (id: string) => ingredients.find(i => i.id === id)?.name || '';
        const getNames = (ids: string[]) => ids.map(getName).join(', ');

        const baseName = selectedBase ? getName(selectedBase) : '';
        const proteins = getNames(selectedProteins);
        const toppings = getNames(selectedToppings);
        const sauces = getNames(selectedSauces);

        const descriptionParts = [];
        if (baseName) descriptionParts.push(`- Base: ${baseName}`);
        if (proteins) descriptionParts.push(`- Prot: ${proteins}`);
        if (toppings) descriptionParts.push(`- Top: ${toppings}`);
        if (sauces) descriptionParts.push(`- Salsas: ${sauces}`);

        const melonaDescription = descriptionParts.join('\n');

        const uniqueConfigId = `melona-${selectedBase}-${[...selectedProteins].sort().join('-')}-${[...selectedToppings].sort().join('-')}-${[...selectedSauces].sort().join('-')}`;

        addToCart({
            cartItemId: uniqueConfigId,
            name: "Melona Personalizada",
            price: calculateTotal(),
            quantity: 1,
            description: melonaDescription,
            image: getBaseIcon(baseName)
        });

        showToast('Tu Melona — añadida al pedido');

        setSelectedBase(null);
        setSelectedProteins([]);
        setSelectedToppings([]);
        setSelectedSauces([]);
        setOpenSection('BASE');
    };

    const canAdd = Boolean(selectedBase && selectedProteins.length > 0);

    const handleAddClick = () => {
        if (!selectedBase) {
            setOpenSection('BASE');
            showToast('Tu Melona — elige una base', 'remove');
            return;
        }
        if (selectedProteins.length === 0) {
            setOpenSection('PROTEIN');
            showToast('Tu Melona — elige al menos una proteína', 'remove');
            return;
        }
        handleAddToCart();
    };

    if (loading) return <div className="p-10 text-center font-black text-brand-primary">Cargando ingredientes...</div>;

    const selectedBaseName = selectedBase ? ingredients.find(i => i.id === selectedBase)?.name : null;

    const renderSection = (title: string, category: string, step: number) => {
        const sectionIngredients = ingredients.filter(i => i.category === category);
        const isOpen = openSection === category;

        const hasSelection =
            category === 'BASE' ? selectedBase !== null :
                category === 'PROTEIN' ? selectedProteins.length > 0 :
                    category === 'TOPPING' ? selectedToppings.length > 0 :
                        selectedSauces.length > 0;

        const isRequired = REQUIRED_SECTIONS.has(category);
        const isPendingRequired = isRequired && !hasSelection;

        const getSummaryText = () => {
            if (category === 'BASE') {
                const baseName = ingredients.find(i => i.id === selectedBase)?.name;
                return baseName || (isRequired ? 'Elige una opción' : 'Pendiente');
            }
            const count = category === 'PROTEIN' ? selectedProteins.length :
                category === 'TOPPING' ? selectedToppings.length :
                    selectedSauces.length;
            if (count > 0) {
                return category === 'PROTEIN'
                    ? `${count} seleccionada${count > 1 ? 's' : ''}`
                    : `${count} seleccionados`;
            }
            if (isRequired) return 'Elige al menos una';
            return 'Opcional';
        };

        return (
            <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isPendingRequired ? 'builder-section--required-pending' :
                isOpen ? 'bg-white border-gray-100 shadow-inner' :
                    hasSelection ? 'bg-orange-50/30 border-orange-200 shadow-sm' :
                        'bg-white border-gray-100'
                }`}>
                <button
                    onClick={() => toggleSection(category)}
                    className={`w-full flex items-center justify-between p-4 transition-colors duration-300 ${isOpen ? 'bg-orange-50/50 border-b border-orange-100' : ''
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm transition-colors duration-300 ${isOpen || hasSelection ? 'bg-brand-primary text-white' : 'bg-gray-100 text-brand-text/50'
                            }`}>
                            {step}
                        </span>
                        <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className={`font-black uppercase tracking-tight text-sm transition-colors duration-300 ${isOpen || hasSelection ? 'text-brand-primary' : 'text-brand-text'
                                    }`}>{title}</h3>
                                {hasSelection ? (
                                    <span className="builder-section-badge builder-section-badge--required-done">Listo</span>
                                ) : isRequired ? (
                                    <span className="builder-section-badge builder-section-badge--required">Obligatorio</span>
                                ) : (
                                    <span className="builder-section-badge builder-section-badge--optional">Opcional</span>
                                )}
                            </div>
                            <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-0 opacity-0' : 'max-h-4 opacity-100'
                                }`}>
                                <span className={`text-[11px] font-bold -mt-0.5 block transition-colors duration-300 ${
                                    hasSelection ? 'text-brand-primary/80' :
                                    isPendingRequired ? 'text-brand-primary' :
                                    'text-brand-text/50'
                                    }`}>
                                    {getSummaryText()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        {hasSelection && !isOpen ? (
                            <Check size={20} className="text-brand-primary" strokeWidth={3} />
                        ) : (
                            <ChevronDown size={20} className={isOpen ? 'text-brand-primary' : 'text-gray-400'} strokeWidth={isOpen ? 3 : 2} />
                        )}
                    </div>
                </button>

                <div
                    className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                >
                    <div className="overflow-hidden">
                        <div className="p-3 grid grid-cols-1 gap-2 bg-gray-50/20">
                            {sectionIngredients.map((ing) => {
                                const isSelected = category === 'BASE'
                                    ? selectedBase === ing.id
                                    : selectedProteins.includes(ing.id) ||
                                    selectedToppings.includes(ing.id) ||
                                    selectedSauces.includes(ing.id);

                                let showPrice = false;
                                if (ing.extraPrice > 0) {
                                    if (category === 'BASE') {
                                        showPrice = false;
                                    } else if (category === 'PROTEIN') {
                                        showPrice = isSelected
                                            ? selectedProteins.indexOf(ing.id) >= FREE_LIMITS.PROTEIN
                                            : selectedProteins.length >= FREE_LIMITS.PROTEIN;
                                    } else if (category === 'TOPPING') {
                                        showPrice = isSelected
                                            ? selectedToppings.indexOf(ing.id) >= FREE_LIMITS.TOPPING
                                            : selectedToppings.length >= FREE_LIMITS.TOPPING;
                                    } else if (category === 'SAUCE') {
                                        showPrice = isSelected
                                            ? selectedSauces.indexOf(ing.id) >= FREE_LIMITS.SAUCE
                                            : selectedSauces.length >= FREE_LIMITS.SAUCE;
                                    }
                                }

                                return (
                                    <button
                                        key={ing.id}
                                        onClick={() => toggleSelection(ing.id, category)}
                                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${isSelected
                                                ? 'border-brand-primary bg-orange-50 shadow-sm'
                                                : 'border-gray-100 bg-white hover:border-orange-200'
                                            }`}
                                    >
                                        <div className="flex flex-col items-start text-left">
                                            <span className={`font-bold text-sm transition-colors duration-200 ${isSelected ? 'text-brand-primary' : 'text-brand-text'}`}>
                                                {ing.name}
                                            </span>
                                            {showPrice && (
                                                <span className="text-[10px] font-black text-brand-text/40">
                                                    {category === 'BASE' ? '' : '+'}
                                                    ${ing.extraPrice.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${isSelected ? 'bg-brand-primary border-brand-primary text-white' : 'border-gray-200'
                                            }`}>
                                            {isSelected ? <Check size={14} strokeWidth={4} /> : <Plus size={14} className="text-gray-300" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const getBaseIcon = (baseName: string | null | undefined) => {
        if (!baseName) return "";
        
        const nameNormalized = baseName.toLowerCase();
        
        if (nameNormalized.includes('papas') || nameNormalized.includes('papas')) {
            return "/base-melona/papas.png";
        }
        if (nameNormalized.includes('arepa')) {
            return "/base-melona/arepa.png";
        }
        if (nameNormalized.includes('perro')) {
            return "/base-melona/perro.png";
        }
        if (nameNormalized.includes('hamburguesa')) {
            return "/base-melona/hamburguesa.png";
        }
        if (nameNormalized.includes('patacón') || nameNormalized.includes('patacon')) {
            return "/base-melona/patacon.png";
        }

        return import.meta.env.VITE_BASE_ICON_FALLBACK;
    };

    return (
        <div className="page-with-checkout">
            <div className="page-scroll p-4 pb-2">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-brand-text active:scale-90 transition-transform"
                >
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-black text-brand-text uppercase italic tracking-tight">Arma tu Melona</h2>
            </div>

            <div className="flex justify-center mb-6">
                <div 
                    className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                        selectedBase 
                        ? 'border-4 border-brand-primary bg-orange-50/40 shadow-sm' 
                        : 'border-4 border-dashed border-gray-200 bg-gray-50'
                    }`}
                >
                    {selectedBase ? (
                        <div className="flex flex-col items-center justify-center p-2 text-center">
                            <img 
                                src={getBaseIcon(selectedBaseName)} 
                                alt={selectedBaseName || "Base"} 
                                className="w-25 h-25 object-contain mb-1" 
                            />
                        </div>
                    ) : (
                        <span className="text-gray-400 text-xs font-bold text-center px-4">
                            Selecciona una base
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {renderSection("Elige tu base", "BASE", 1)}
                {renderSection("Elige tu proteína", "PROTEIN", 2)}
                {renderSection("Añade toppings", "TOPPING", 3)}
                {renderSection("Las salsas", "SAUCE", 4)}
            </div>
            </div>

            <div className="checkout-bar">
                <button
                    type="button"
                    onClick={handleAddClick}
                    className={`btn-cta btn-cta--split${canAdd ? '' : ' btn-cta--incomplete'}`}
                    aria-disabled={!canAdd}
                >
                    <span>{canAdd ? 'Agregar al carrito' : 'Completa base y proteína'}</span>
                    <span className="btn-cta__price">${calculateTotal().toLocaleString()}</span>
                </button>
            </div>

        </div>
    );
}