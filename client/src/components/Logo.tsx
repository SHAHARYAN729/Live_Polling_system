import { Sparkles } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1',
    md: 'text-sm px-4 py-2 gap-1.5',
    lg: 'text-base px-5 py-2.5 gap-2',
  };

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 18,
  };

  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} bg-[#6C3FE4] text-white rounded-full font-semibold`}
    >
      <Sparkles size={iconSize[size]} fill="white" />
      <span>Intervue Poll</span>
    </div>
  );
}
