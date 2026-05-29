import { useEffect, useState } from 'react';
import { CheckCircle2, Trash2, X } from 'lucide-react';

export type ToastVariant = 'success' | 'remove';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  variant?: ToastVariant;
}

export function Toast({ message, isVisible, onClose, variant = 'success' }: ToastProps) {
  const isRemove = variant === 'remove';

  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => setAnimate(true), 10);
      return () => clearTimeout(timer);
    }
    setAnimate(false);
    const timer = setTimeout(() => setShouldRender(false), 300);
    return () => clearTimeout(timer);
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed top-5 md:top-5 left-1/2 -translate-x-1/2 z-[200] px-4 w-full max-w-sm 
                  transition-all duration-300 ease-out transform
                  ${animate 
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 -translate-y-12 scale-95 pointer-events-none'
                  }`}
    >
      <div className={`${isRemove ? 'toast-remove border-red-200' : 'toast-success border-brand-accent/25'} bg-white/95 backdrop-blur-md text-brand-text px-4 py-3.5 rounded-2xl flex items-center justify-between gap-3 border`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${isRemove ? 'bg-red-50' : 'bg-brand-accent/15'}`}>
            {isRemove ? (
              <Trash2 size={18} className="text-red-500" strokeWidth={2.5} />
            ) : (
              <CheckCircle2 size={20} className="text-brand-accent" strokeWidth={2.5} />
            )}
          </div>
          <span className="text-sm font-bold leading-tight truncate">
            {message}
          </span>
        </div>
        <button 
          onClick={onClose}
          className={`text-brand-text/35 hover:text-brand-text/60 transition-colors active:scale-90 p-1.5 shrink-0 rounded-full ${isRemove ? 'bg-red-50 hover:bg-red-100' : 'bg-brand-accent/10 hover:bg-brand-accent/15'}`}
          aria-label="Cerrar notificación"
        >
          <X size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}