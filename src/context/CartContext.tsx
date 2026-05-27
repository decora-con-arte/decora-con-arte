import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface CartItem {
    cartItemId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    description?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    updateQuantity: (cartItemId: string, amount: number) => void;
    removeFromCart: (cartItemId: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    const updateQuantity = (cartItemId: string, amount: number) => {
        setItems(prev => prev.map(item => 
            item.cartItemId === cartItemId 
                ? { ...item, quantity: Math.max(1, item.quantity + amount) } 
                : item
        ));
    };

    const addToCart = (newItem: CartItem) => {
        setItems((prevItems) => {
            const itemExists = prevItems.some(item => item.cartItemId === newItem.cartItemId);

            if (itemExists) {
                return prevItems.map(item =>
                    item.cartItemId === newItem.cartItemId
                        ? { ...item, quantity: item.quantity + newItem.quantity }
                        : item
                );
            }

            return [...prevItems, newItem];
        });
    };

    const removeFromCart = (cartItemId: string) => {
        setItems((prevItems) => prevItems.filter(item => item.cartItemId !== cartItemId));
    };

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart debe usarse dentro de un CartProvider');
    }
    return context;
}