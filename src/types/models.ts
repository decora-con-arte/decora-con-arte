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