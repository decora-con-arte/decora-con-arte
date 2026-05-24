import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchIngredients } from '../services/googleSheets';
import type { Ingredient } from '../types/product';

const BASE_PRICE = 8000;

const FREE_LIMITS = {
  PROTEIN: 1,
  TOPPING: 1,
  SAUCE: 3
};

// 👈 Definimos el orden estricto de las secciones
const SECTION_ORDER = ['BASE', 'PROTEIN', 'TOPPING', 'SAUCE'];

export function BuilderPage() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const [openSection, setOpenSection] = useState<string | null>('BASE');

  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [selectedProteins, setSelectedProteins] = useState<string[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const data = await fetchIngredients();
      setIngredients(data);
      setLoading(false);
    }
    load();
  }, []);

  const calculateTotal = () => {
    let total = BASE_PRICE;

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
        // Esto ya hacía un auto-avance cuando elegías la base
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

  // 👈 NUEVA LÓGICA DE AUTO-AVANCE
  const toggleSection = (category: string) => {
    setOpenSection(prev => {
      // Si el usuario da clic en la sección que YA está abierta (intentando cerrarla)
      if (prev === category) {
        const currentIndex = SECTION_ORDER.indexOf(category);
        const nextIndex = currentIndex + 1;
        
        // Si existe una siguiente sección, la abrimos. Si es la última (Salsas), cerramos todo (null)
        return nextIndex < SECTION_ORDER.length ? SECTION_ORDER[nextIndex] : null;
      }
      
      // Si da clic en una sección diferente, simplemente abre esa
      return category;
    });
  };

  if (loading) return <div className="p-10 text-center font-black text-brand-primary">Cargando ingredientes...</div>;

  const renderSection = (title: string, category: string, step: number) => {
    const sectionIngredients = ingredients.filter(i => i.category === category);
    const isOpen = openSection === category;
    
    const hasSelection = 
      category === 'BASE' ? selectedBase !== null :
      category === 'PROTEIN' ? selectedProteins.length > 0 :
      category === 'TOPPING' ? selectedToppings.length > 0 :
      selectedSauces.length > 0;

    const getSummaryText = () => {
      if (category === 'BASE') {
        const baseName = ingredients.find(i => i.id === selectedBase)?.name;
        return baseName || "Pendiente";
      }
      const count = category === 'PROTEIN' ? selectedProteins.length : 
                    category === 'TOPPING' ? selectedToppings.length : 
                    selectedSauces.length;
      return count > 0 ? `${count} seleccionados` : "Pendiente";
    };

    return (
      <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isOpen ? 'bg-white border-gray-100 shadow-inner' : 
        hasSelection ? 'bg-orange-50/30 border-orange-200 shadow-sm' : 
        'bg-white border-gray-100'
      }`}>
        <button 
          onClick={() => toggleSection(category)}
          className={`w-full flex items-center justify-between p-4 transition-colors duration-300 ${
            isOpen ? 'bg-orange-50/50 border-b border-orange-100' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm transition-colors duration-300 ${
              isOpen || hasSelection ? 'bg-brand-primary text-white' : 'bg-gray-100 text-brand-text/50'
            }`}>
              {step}
            </span>
            <div className="flex flex-col items-start">
              <h3 className={`font-black uppercase tracking-tight text-sm transition-colors duration-300 ${
                isOpen || hasSelection ? 'text-brand-primary' : 'text-brand-text'
              }`}>{title}</h3>
              <div className={`transition-all duration-300 overflow-hidden ${
                isOpen ? 'max-h-0 opacity-0' : 'max-h-4 opacity-100'
              }`}>
                <span className={`text-[11px] font-bold -mt-0.5 block transition-colors duration-300 ${
                  hasSelection ? 'text-brand-primary/80' : 'text-brand-text/50'
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
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
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
                  if (category === 'PROTEIN') {
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
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${
                      isSelected 
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
                          +{ing.extraPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                      isSelected ? 'bg-brand-primary border-brand-primary text-white' : 'border-gray-200'
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

  return (
    <div className="pb-40">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/')}
          className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-brand-text active:scale-90 transition-transform"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-brand-text uppercase italic tracking-tight">Arma tu Melona</h2>
      </div>

      <div className="space-y-4">
        {renderSection("Elige tu base", "BASE", 1)}
        {renderSection("Elige tu proteína", "PROTEIN", 2)}
        {renderSection("Añade toppings", "TOPPING", 3)}
        {renderSection("Las salsas", "SAUCE", 4)}
      </div>

      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full md:max-w-md bg-white/95 backdrop-blur-sm border-t border-gray-100 p-4 z-[40] shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <button 
          disabled={!selectedBase || selectedProteins.length === 0}
          className="w-full bg-brand-primary disabled:bg-gray-300 text-white p-4 rounded-2xl font-black flex items-center justify-between shadow-lg shadow-orange-200 active:scale-[0.98] transition-all"
        >
          <span className="uppercase tracking-tight text-sm">Agregar al Carrito</span>
          <span className="text-xl font-black">${calculateTotal().toLocaleString()}</span>
        </button>
      </div>
    </div>
  );
}