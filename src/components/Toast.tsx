import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, X, type LucideIcon } from 'lucide-react';

export type ToastVariant = 'success' | 'remove' | 'warning';

const EXIT_MS = 260;

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration: number;
  elevated?: boolean;
  onClose: () => void;
}

interface ToastTheme {
  container: string;
  shadow: string;
  iconWrap: string;
  label: string;
  progressTrack: string;
  progressFill: string;
}

const TOAST_THEME: Record<ToastVariant, ToastTheme> = {
  success: {
    container: 'bg-gradient-to-r from-[#0EA271] via-[#10B981] to-[#0EA271]',
    shadow: 'shadow-[0_18px_45px_-12px_rgba(16,185,129,0.75)]',
    iconWrap: 'bg-white/25 text-white',
    label: 'text-white/80',
    progressTrack: 'bg-white/25',
    progressFill: 'bg-white',
  },
  remove: {
    container: 'bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#DC2626]',
    shadow: 'shadow-[0_18px_45px_-12px_rgba(239,68,68,0.75)]',
    iconWrap: 'bg-white/25 text-white',
    label: 'text-white/80',
    progressTrack: 'bg-white/25',
    progressFill: 'bg-white',
  },
  warning: {
    container: 'bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#D97706]',
    shadow: 'shadow-[0_18px_45px_-12px_rgba(245,158,11,0.8)]',
    iconWrap: 'bg-white/30 text-white',
    label: 'text-white/90',
    progressTrack: 'bg-white/30',
    progressFill: 'bg-white',
  },
};

const TOAST_ICON: Record<ToastVariant, LucideIcon> = {
  success: Check,
  remove: X,
  warning: AlertTriangle,
};

const TOAST_LABEL: Record<ToastVariant, string> = {
  success: 'Listo',
  remove: 'Eliminado',
  warning: 'Atención',
};

function parseMessage(message: string) {
  const parts = message.split(' — ');
  if (parts.length >= 2) {
    return { title: parts[0], detail: parts.slice(1).join(' — ') };
  }
  return { title: message, detail: null as string | null };
}

export function Toast({ message, variant = 'success', duration, elevated = false, onClose }: ToastProps) {
  const theme = TOAST_THEME[variant];
  const Icon = TOAST_ICON[variant];
  const label = TOAST_LABEL[variant];
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
      className={`fixed inset-x-0 z-[200] w-full md:max-w-2xl lg:max-w-5xl mx-auto px-4 pointer-events-none
        ${elevated ? 'bottom-52' : 'bottom-24'}`}
      role="status"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar notificación"
        className={`relative w-full max-w-md mx-auto flex items-start gap-3 p-3.5 rounded-2xl text-white pointer-events-auto overflow-hidden transition-all duration-300 ease-out cursor-pointer active:scale-[0.98] ${theme.container} ${theme.shadow} ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${theme.iconWrap}`}>
          <Icon size={15} strokeWidth={3} />
        </span>

        <span className="flex-1 min-w-0 pr-1 text-left">
          <span className={`block text-[10px] font-black uppercase tracking-wider mb-0.5 ${theme.label}`}>
            {label}
          </span>
          <span className="block text-sm font-black leading-tight">{title}</span>
          {detail && (
            <span className={`block text-xs font-semibold mt-1 line-clamp-2 ${theme.label}`}>{detail}</span>
          )}
        </span>

        <span aria-hidden="true" className="shrink-0 opacity-60 mt-1">
          <X size={16} strokeWidth={2.5} />
        </span>

        <span className={`absolute left-0 right-0 bottom-0 h-1.5 ${theme.progressTrack}`}>
          <span
            className={`block h-full origin-left ${theme.progressFill}`}
            style={{
              animation: `toast-progress ${duration}ms linear forwards`,
              animationPlayState: visible ? 'running' : 'paused'
            }}
          />
        </span>
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
