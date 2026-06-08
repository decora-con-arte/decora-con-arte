import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Check, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { dataService } from '../services/dataService';
import type { Ingredient } from '../types/models';

interface CategoryGroup {
  category: string;
  ingredients: Ingredient[];
  isRequired: boolean;
  stepOrder: number;
  maxFree: number;
}

export function BuilderPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Record<string, string[]>>({});
  const advancingRef = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await dataService.getIngredients();
        setIngredients(data.filter(ing => ing.isAvailable));

        if (data.length > 0) {
          const firstCategory = [...new Set(data.map(i => i.category))][0];
          setOpenSection(firstCategory);
        }
      } catch (error) {
        console.error('Error cargando ingredientes:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categoryGroups = useMemo(() => {
    const groupsMap = new Map<string, CategoryGroup>();

    ingredients.forEach(ing => {
      if (!groupsMap.has(ing.category)) {
        groupsMap.set(ing.category, {
          category: ing.category,
          ingredients: [],
          isRequired: ing.isRequired || false,
          stepOrder: ing.stepOrder || 999,
          maxFree: ing.maxFree || 0
        });
      }
      groupsMap.get(ing.category)!.ingredients.push(ing);
    });

    return Array.from(groupsMap.values())
      .sort((a, b) => a.stepOrder - b.stepOrder);
  }, [ingredients]);

  const nextSection = useCallback((currentCategory: string) => {
    const currentIndex = categoryGroups.findIndex(g => g.category === currentCategory);
    const nextGroup = categoryGroups.slice(currentIndex + 1).find(g => {
      const selected = selectedIngredients[g.category] || [];
      return selected.length === 0;
    });
    return nextGroup?.category ?? null;
  }, [categoryGroups, selectedIngredients]);

  const openNextSection = useCallback((currentCategory: string) => {
    const next = nextSection(currentCategory);
    setOpenSection(next);
  }, [nextSection]);

  const getFirstPendingRequired = useCallback(() => {
    return categoryGroups.find(group => {
      if (!group.isRequired) return false;
      const selected = selectedIngredients[group.category] || [];
      return selected.length === 0;
    });
  }, [categoryGroups, selectedIngredients]);

  useEffect(() => {
    if (categoryGroups.length > 0 && !openSection) {
      const pending = getFirstPendingRequired();
      if (pending) {
        setOpenSection(pending.category);
      } else {
        setOpenSection(categoryGroups[0].category);
      }
    }
  }, [categoryGroups, getFirstPendingRequired, openSection]);

  const toggleSelection = useCallback((ingredientId: string, category: string) => {
    setSelectedIngredients(prev => {
      const currentSelections = prev[category] || [];

      const group = categoryGroups.find(g => g.category === category);
      const isSingle = group
        ? group.isRequired && group.maxFree === 0 && group.ingredients.length > 1
          ? false
          : group.ingredients.length === 1
        : false;

      if (isSingle) {
        if (currentSelections.includes(ingredientId)) {
          return { ...prev, [category]: [] };
        }
        advancingRef.current = true;
        setTimeout(() => {
          advancingRef.current = false;
          openNextSection(category);
        }, 0);
        return { ...prev, [category]: [ingredientId] };
      }

      const newSelections = currentSelections.includes(ingredientId)
        ? currentSelections.filter(id => id !== ingredientId)
        : [...currentSelections, ingredientId];

      if (!currentSelections.includes(ingredientId) && newSelections.length === 1 && group && group.ingredients.length === 1) {
        advancingRef.current = true;
        setTimeout(() => {
          advancingRef.current = false;
          openNextSection(category);
        }, 0);
      }

      return { ...prev, [category]: newSelections };
    });
  }, [categoryGroups, openNextSection]);

  const toggleSection = useCallback((category: string) => {
    setOpenSection(prev => {
      const next = prev === category ? null : category;
      if (prev === category && next === null) {
        setTimeout(() => openNextSection(category), 0);
      }
      return next;
    });
  }, [openNextSection]);

  const calculateTotal = useCallback(() => {
    let total = 0;

    categoryGroups.forEach(group => {
      const selected = selectedIngredients[group.category] || [];

      selected.forEach((id, index) => {
        const ing = ingredients.find(i => i.id === id);
        if (!ing) return;

        if (index >= group.maxFree) {
          total += ing.extraPrice || 0;
        }
      });
    });

    return total;
  }, [categoryGroups, selectedIngredients, ingredients]);

  const canAdd = useMemo(() => {
    return categoryGroups
      .filter(group => group.isRequired)
      .every(group => {
        const selected = selectedIngredients[group.category] || [];
        return selected.length > 0;
      });
  }, [categoryGroups, selectedIngredients]);

  const requiredCount = useMemo(() => {
    return categoryGroups.filter(g => g.isRequired).length;
  }, [categoryGroups]);

  const completedRequiredCount = useMemo(() => {
    return categoryGroups.filter(g => {
      if (!g.isRequired) return false;
      const selected = selectedIngredients[g.category] || [];
      return selected.length > 0;
    }).length;
  }, [categoryGroups, selectedIngredients]);

  const handleAddToCart = useCallback(() => {
    const parts: string[] = [];
    const descriptionParts: string[] = [];

    categoryGroups.forEach(group => {
      const selected = selectedIngredients[group.category] || [];
      if (selected.length > 0) {
        const names = selected
          .map(id => ingredients.find(i => i.id === id)?.name || '')
          .filter(Boolean)
          .join(', ');

        parts.push(`${group.category}: ${names}`);
        descriptionParts.push(`- ${group.category}: ${names}`);
      }
    });

    const productName = parts.length > 0 ? parts.join(' | ') : 'Custom Melona';
    const description = descriptionParts.join('\n');

    const configId = Object.entries(selectedIngredients)
      .map(([cat, ids]) => `${cat}:${[...ids].sort().join(',')}`)
      .join('|');

    addToCart({
      cartItemId: `custom-${configId}`,
      name: productName,
      price: calculateTotal(),
      quantity: 1,
      description: description,
      image: getBuilderImage()
    });

    showToast('Custom Melona added! 🎉');

    setSelectedIngredients({});
    if (categoryGroups.length > 0) {
      setOpenSection(categoryGroups[0].category);
    }
  }, [categoryGroups, selectedIngredients, ingredients, addToCart, calculateTotal, showToast]);

  const handleAddClick = useCallback(() => {
    const pendingRequired = getFirstPendingRequired();

    if (pendingRequired) {
      setOpenSection(pendingRequired.category);
      showToast(`Select at least one ingredient in "${pendingRequired.category}"`, 'warning');
      return;
    }

    handleAddToCart();
  }, [getFirstPendingRequired, handleAddToCart, showToast]);

  const getBuilderImage = useCallback(() => {
    const firstCategory = categoryGroups[0];
    if (firstCategory) {
      const selected = selectedIngredients[firstCategory.category] || [];
      if (selected.length > 0) {
        const firstIng = ingredients.find(i => i.id === selected[0]);
        if (firstIng) {
          return getBaseIcon(firstIng.name);
        }
      }
    }
    return '/default-builder.png';
  }, [categoryGroups, selectedIngredients, ingredients]);

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="animate-pulse font-black text-brand-primary">
          Loading ingredients...
        </div>
      </div>
    );
  }

  if (categoryGroups.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="font-bold text-gray-500">No ingredients available</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-brand-primary font-bold"
        >
          Back to menu
        </button>
      </div>
    );
  }

  return (
    <div className="page-with-checkout">
      <div className="page-scroll p-4 pb-2">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-brand-text active:scale-90 transition-transform"
            aria-label="Back to menu"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-black text-brand-text uppercase italic tracking-tight">
            Build Your Melona
          </h2>
        </div>

        <div className="flex justify-center mb-6">
          <div
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
              canAdd
                ? 'border-4 border-brand-primary bg-orange-50/40 shadow-sm'
                : 'border-4 border-dashed border-gray-200 bg-gray-50'
            }`}
          >
            {canAdd ? (
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <img
                  src={getBuilderImage()}
                  alt="Melona preview"
                  className="w-25 h-25 object-contain mb-1"
                />
              </div>
            ) : (
              <span className="text-gray-400 text-xs font-bold text-center px-4">
                {completedRequiredCount}/{requiredCount} required
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {categoryGroups.map((group, index) => {
            const isOpen = openSection === group.category;
            const selected = selectedIngredients[group.category] || [];
            const hasSelection = selected.length > 0;
            const isPendingRequired = group.isRequired && !hasSelection;

            return (
              <div
                key={group.category}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-white border-gray-200 shadow-sm'
                    : hasSelection
                      ? 'bg-white border-orange-200 shadow-sm'
                      : group.isRequired
                        ? 'bg-white border-amber-200'
                        : 'bg-white border-gray-100'
                }`}
              >
                <button
                  onClick={() => toggleSection(group.category)}
                  className={`w-full flex items-center justify-between p-4 transition-colors duration-300 ${
                    isOpen ? 'bg-orange-50/50 border-b border-orange-100' : ''
                  }`}
                  aria-expanded={isOpen}
                  aria-label={`${group.category}${group.isRequired ? ' (required)' : ' (optional)'}${hasSelection ? `, ${selected.length} selected` : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm transition-colors duration-300 shrink-0 ${
                      isOpen || hasSelection
                        ? 'bg-brand-primary text-white'
                        : isPendingRequired
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-gray-100 text-brand-text/50'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className={`font-black uppercase tracking-tight text-sm transition-colors duration-300 ${
                          isOpen || hasSelection ? 'text-brand-primary' : 'text-brand-text'
                        }`}>
                          {group.category}
                        </h3>
                        {hasSelection ? (
                          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Done
                          </span>
                        ) : group.isRequired ? (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            Optional
                          </span>
                        )}
                      </div>
                      {!isOpen && (
                        <span className={`text-[11px] font-bold mt-0.5 ${
                          hasSelection
                            ? 'text-brand-primary/80'
                            : isPendingRequired
                              ? 'text-amber-600'
                              : 'text-brand-text/50'
                        }`}>
                          {hasSelection
                            ? `${selected.length} selected`
                            : group.isRequired
                              ? 'Select at least one'
                              : 'Optional'
                          }
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}>
                    {hasSelection && !isOpen ? (
                      <Check size={20} className="text-brand-primary" strokeWidth={3} />
                    ) : (
                      <ChevronDown
                        size={20}
                        className={isOpen ? 'text-brand-primary' : 'text-gray-400'}
                        strokeWidth={isOpen ? 3 : 2}
                      />
                    )}
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-3 grid grid-cols-1 gap-2">
                      {group.ingredients.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-2 font-medium">
                          No ingredients available
                        </p>
                      )}
                      {group.ingredients.map((ing) => {
                        const isSelected = selected.includes(ing.id);

                        let showExtraPrice = false;
                        if (ing.extraPrice > 0) {
                          const selectedIndex = selected.indexOf(ing.id);
                          if (isSelected) {
                            showExtraPrice = selectedIndex >= group.maxFree;
                          } else {
                            showExtraPrice = selected.length >= group.maxFree;
                          }
                        }

                        return (
                          <button
                            key={ing.id}
                            onClick={() => toggleSelection(ing.id, group.category)}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${
                              isSelected
                                ? 'border-brand-primary bg-orange-50 shadow-sm'
                                : 'border-gray-100 bg-white hover:border-orange-200'
                            }`}
                            aria-label={`${ing.name}${isSelected ? ', selected' : ''}${ing.extraPrice > 0 ? `, +$${ing.extraPrice.toLocaleString()}` : ''}`}
                          >
                            <div className="flex flex-col items-start text-left">
                              <span className={`font-bold text-sm transition-colors duration-200 ${
                                isSelected ? 'text-brand-primary' : 'text-brand-text'
                              }`}>
                                {ing.name}
                              </span>
                              {showExtraPrice && (
                                <span className="text-[10px] font-black text-brand-text/40">
                                  +${ing.extraPrice.toLocaleString()}
                                </span>
                              )}
                              {group.maxFree > 0 && !showExtraPrice && ing.extraPrice > 0 && (
                                <span className="text-[10px] font-bold text-green-600">
                                  Free! (up to {group.maxFree})
                                </span>
                              )}
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                              isSelected
                                ? 'bg-brand-primary border-brand-primary text-white'
                                : 'border-gray-200'
                            }`}>
                              {isSelected ? (
                                <Check size={14} strokeWidth={4} />
                              ) : (
                                <Plus size={14} className="text-gray-300" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="checkout-bar">
        <button
          type="button"
          onClick={handleAddClick}
          className={`btn-cta btn-cta--split ${canAdd ? '' : 'btn-cta--incomplete'}`}
          disabled={!canAdd && categoryGroups.some(g => g.isRequired)}
        >
          <span>
            {canAdd
              ? 'Add to cart'
              : getFirstPendingRequired()
                ? `Missing: ${getFirstPendingRequired()?.category}`
                : 'Complete required sections'
            }
          </span>
          <span className="btn-cta__price">
            ${calculateTotal().toLocaleString()}
          </span>
        </button>
      </div>
    </div>
  );
}

function getBaseIcon(baseName: string) {
  const name = baseName.toLowerCase();
  if (name.includes('papas') || name.includes('fries')) return '/base-melona/papas.png';
  if (name.includes('arepa')) return '/base-melona/arepa.png';
  if (name.includes('perro')) return '/base-melona/perro.png';
  if (name.includes('hamburguesa') || name.includes('hamburger')) return '/base-melona/hamburguesa.png';
  if (name.includes('patacón') || name.includes('patacon') || name.includes('patacone')) return '/base-melona/patacon.png';
  return import.meta.env.VITE_BASE_ICON_FALLBACK || '';
}
