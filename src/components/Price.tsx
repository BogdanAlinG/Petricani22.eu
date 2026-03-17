import React, { useState } from 'react';
import { usePrice } from '../hooks/usePrice';
import { useCurrency } from '../contexts/CurrencyContext';

interface PriceProps {
  amount: number;
  className?: string;
  showCurrency?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showConversionBadge?: boolean;
  showAlternativeCurrency?: boolean;
}

const Price: React.FC<PriceProps> = ({
  amount,
  className = '',
  showCurrency = true,
  size = 'md',
  showConversionBadge = false,
  showAlternativeCurrency = true
}) => {
  const { formatPrice, currency, exchangeRate, convertPrice } = usePrice();
  const { isLoading } = useCurrency();
  const [showTooltip, setShowTooltip] = useState(false);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  if (isLoading) {
    return (
      <span className={`inline-block bg-gray-200 animate-pulse rounded ${sizeClasses[size]} ${className}`}>
        <span className="invisible">{formatPrice(amount)}</span>
      </span>
    );
  }

  const isConverted = currency === 'RON';

  const getAlternativePrice = () => {
    if (currency === 'EUR') {
      const ronAmount = convertPrice(amount);
      return `${ronAmount.toLocaleString('ro-RO', { maximumFractionDigits: 0 })} lei`;
    } else {
      return `€${amount.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  return (
    <span className="relative inline-block">
      <span
        className={`inline-flex items-center gap-2 ${className}`}
        onMouseEnter={() => showAlternativeCurrency && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className={`font-semibold ${sizeClasses[size]}`}>
          {formatPrice(amount)}
        </span>
        {showConversionBadge && isConverted && exchangeRate && (
          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full whitespace-nowrap">
            Live Rate
          </span>
        )}
      </span>

      {showTooltip && showAlternativeCurrency && exchangeRate && (
        <span className="absolute left-1/2 -translate-x-1/2 -bottom-8 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap z-10">
          ≈ {getAlternativePrice()}
        </span>
      )}
    </span>
  );
};

export default Price;
