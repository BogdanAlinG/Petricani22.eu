import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'EUR' | 'RON';

interface ExchangeRate {
  rate: number;
  source: 'stripe' | 'manual' | 'fallback';
  fetched_at: string;
  cached?: boolean;
  warning?: string;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number | null;
  isLoading: boolean;
  lastUpdated: string | null;
  source: string | null;
  warning: string | null;
  refreshRate: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'petricani22_currency';
const RATE_CACHE_KEY = 'petricani22_exchange_rate';
const RATE_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'EUR' || stored === 'RON') ? stored : 'EUR';
  });

  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const fetchExchangeRate = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase configuration missing');
        setExchangeRate(4.95);
        setSource('fallback');
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-exchange-rate`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data: ExchangeRate = await response.json();
        setExchangeRate(data.rate);
        setSource(data.source);
        setLastUpdated(data.fetched_at);
        setWarning(data.warning || null);

        localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({
          rate: data.rate,
          timestamp: Date.now(),
          source: data.source,
        }));
      } else {
        throw new Error('Failed to fetch exchange rate');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);

      const cachedData = localStorage.getItem(RATE_CACHE_KEY);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setExchangeRate(parsed.rate);
          setSource(parsed.source);
          setWarning('Using cached exchange rate');
        } catch {
          setExchangeRate(4.95);
          setSource('fallback');
        }
      } else {
        setExchangeRate(4.95);
        setSource('fallback');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRate = async () => {
    setIsLoading(true);
    await fetchExchangeRate();
  };

  useEffect(() => {
    const cachedData = localStorage.getItem(RATE_CACHE_KEY);

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const age = Date.now() - parsed.timestamp;

        if (age < RATE_CACHE_EXPIRY) {
          setExchangeRate(parsed.rate);
          setSource(parsed.source);
          setIsLoading(false);

          setTimeout(() => {
            fetchExchangeRate();
          }, 1000);

          return;
        }
      } catch (error) {
        console.error('Error parsing cached rate:', error);
      }
    }

    fetchExchangeRate();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchExchangeRate();
    }, RATE_CACHE_EXPIRY);

    return () => clearInterval(interval);
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(STORAGE_KEY, newCurrency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        exchangeRate,
        isLoading,
        lastUpdated,
        source,
        warning,
        refreshRate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
