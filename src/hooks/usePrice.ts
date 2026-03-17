import { useCurrency } from '../contexts/CurrencyContext';

export const usePrice = () => {
  const { currency, exchangeRate } = useCurrency();

  const convertPrice = (euroAmount: number): number => {
    if (currency === 'EUR') {
      return euroAmount;
    }

    if (!exchangeRate) {
      return euroAmount * 4.95;
    }

    return euroAmount * exchangeRate;
  };

  const formatPrice = (euroAmount: number): string => {
    const convertedAmount = convertPrice(euroAmount);

    if (currency === 'EUR') {
      return new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedAmount);
    }

    return new Intl.NumberFormat('ro-RO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(convertedAmount) + ' lei';
  };

  const getCurrencySymbol = (): string => {
    return currency === 'EUR' ? '€' : 'lei';
  };

  return {
    convertPrice,
    formatPrice,
    getCurrencySymbol,
    currency,
    exchangeRate,
  };
};
