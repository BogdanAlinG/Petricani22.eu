import React from 'react';
import { Sparkles, Loader2, Languages } from 'lucide-react';

interface AIGenerateButtonProps {
  id: string;
  generating: string | null;
  onClick: () => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'generate' | 'translate';
}

const AIGenerateButton: React.FC<AIGenerateButtonProps> = ({
  id,
  generating,
  onClick,
  label,
  className = '',
  size = 'sm',
  variant = 'generate',
}) => {
  const isLoading = generating === id;
  const defaultLabel = variant === 'translate' ? 'Translate' : 'Generate';
  const displayLabel = label ?? defaultLabel;

  const base =
    size === 'sm'
      ? 'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md'
      : 'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg';

  const colors =
    variant === 'translate'
      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
      : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!generating}
      title={variant === 'translate' ? 'Translate with AI' : 'Generate with AI'}
      className={`${base} ${colors} disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm ${className}`}
    >
      {isLoading ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : variant === 'translate' ? (
        <Languages className={iconSize} />
      ) : (
        <Sparkles className={iconSize} />
      )}
      {isLoading ? (variant === 'translate' ? 'Translating...' : 'Generating...') : displayLabel}
    </button>
  );
};

export default AIGenerateButton;
