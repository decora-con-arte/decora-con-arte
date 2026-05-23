export type IngredientCategory = 'BASE' | 'PROTEIN' | 'TOPPING' | 'SAUCE';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  extraPrice: number;
  isAvailable: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
}

export interface CartItem {
  cartId: string;
  product?: Product;
  melonaConfig?: {
    base: string;
    protein: string;
    toppings: string[];
    sauces: string[];
  };
  quantity: number;
  totalPrice: number;
}