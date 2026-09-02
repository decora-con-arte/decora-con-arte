import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from './CartContext';
import { Toast, type ToastVariant } from '../components/Toast';

const TOAST_DURATION_MS = 3200;

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { totalItems } = useCart();

  const elevated =
    pathname === '/builder' || (pathname === '/cart' && totalItems > 0);

  const [toast, setToast] = useState<{
    message: string;
    variant: ToastVariant;
    key: number;
  } | null>(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ message, variant, key: Date.now() });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          variant={toast.variant}
          duration={TOAST_DURATION_MS}
          elevated={elevated}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}
