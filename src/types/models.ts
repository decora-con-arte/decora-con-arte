export interface Category {
  id: string;
  name: string;
  icon: string;
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

export interface StoreSchedule {
  day: string;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

export interface SpecialMeal {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  extraPrice: number;
  isAvailable: boolean;
  isRequired?: boolean;
  stepOrder?: number;
  maxFree?: number;
}