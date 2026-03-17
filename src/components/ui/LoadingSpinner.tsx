interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizes = {
  sm: 'h-6 w-6 border-2',
  md: 'h-12 w-12 border-4',
  lg: 'h-16 w-16 border-4',
};

export default function LoadingSpinner({ size = 'md', className = '', label }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status">
      <div className={`animate-spin rounded-full border-primary border-t-transparent ${sizes[size]}`} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
