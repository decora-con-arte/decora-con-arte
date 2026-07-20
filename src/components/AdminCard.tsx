import type { LucideIcon } from 'lucide-react';

interface AdminCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

export function AdminCard({ icon: Icon, title, description, onClick }: AdminCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-[0.98] hover:shadow-md transition-all text-left"
    >
      <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon size={24} className="text-brand-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-extrabold text-brand-text text-base">{title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}
