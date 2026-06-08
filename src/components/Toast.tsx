import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Minus } from 'lucide-react';

export type ToastVariant = 'success' | 'remove' | 'warning';

const EXIT_MS = 280;

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration: number;
  elevated?: boolean;
  onClose: () => void;
}

function parseMessage(message: string) {
  const parts = message.split(' — ');
  if (parts.length >= 2) {
    return { title: parts[0], detail: parts.slice(1).join(' — ') };
  }
  return { title: message, detail: null as string | null };
}

export function Toast({ message, variant = 'success', duration, elevated = false, onClose }: ToastProps) {
  const isRemove = variant === 'remove';
  const isWarning = variant === 'warning';
  const { title, detail } = parseMessage(message);
  const [visible, setVisible] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 16);
    const autoDismissTimer = setTimeout(dismiss, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(autoDismissTimer);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [duration, dismiss]);

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-none transition-all duration-300 ease-out
        ${elevated ? 'bottom-36' : 'bottom-20'}`}
      role="status"
    >
      <button
        type="button"
        onClick={dismiss}
        className={`relative w-full flex items-start gap-3 p-3.5 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-lg pointer-events-auto overflow-hidden transition-all duration-300
          ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${isRemove ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'}`} />

        <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5
          ${isRemove ? 'bg-red-50 text-red-500' : isWarning ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'}`}
        >
          {isRemove ? <Minus size={14} strokeWidth={3} /> : isWarning ? <span className="text-lg font-black leading-none">!</span> : <Check size={14} strokeWidth={3} />}
        </div>

        <div className="flex-1 min-w-0 text-left pr-2">
          <span className={`block text-[10px] font-bold uppercase tracking-wider mb-0.5
            ${isRemove ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-green-500'}`}
          >
            {isRemove ? 'Eliminado' : isWarning ? 'Atención' : 'Listo'}
          </span>
          <p className="text-sm font-bold text-brand-text leading-tight m-0">{title}</p>
          {detail && <p className="text-xs font-medium text-gray-500 mt-1 line-clamp-2 m-0">{detail}</p>}
        </div>

        <div className="absolute left-0 right-0 bottom-0 h-1 bg-gray-100">
          <div
            className={`h-full origin-left ${isRemove ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ 
              animation: `toast-progress ${duration}ms linear forwards`,
              animationPlayState: visible ? 'running' : 'paused'
            }}
          />
        </div>
      </button>

      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}