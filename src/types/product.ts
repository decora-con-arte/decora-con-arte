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

export interface SpecialMeal {
  name: string;
  description: string;
  price: number;
  image: string;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
}

export interface StoreSchedule {
  dia: string;
  horaInicio: string;
  horaFin: string;
  cerrado: string;
}