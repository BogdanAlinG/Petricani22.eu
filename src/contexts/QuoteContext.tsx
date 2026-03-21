import React, { createContext, useContext, useState, ReactNode } from 'react';

interface QuoteRequest {
  configuration: string;
  rentalPeriod: string;
}

interface QuoteContextType {
  quoteRequest: QuoteRequest | null;
  setQuoteRequest: (request: QuoteRequest | null) => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const QuoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(() => {
    try {
      const saved = localStorage.getItem('quoteRequest');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    try {
      if (quoteRequest) {
        localStorage.setItem('quoteRequest', JSON.stringify(quoteRequest));
      } else {
        localStorage.removeItem('quoteRequest');
      }
    } catch {
      // Ignore
    }
  }, [quoteRequest]);

  return (
    <QuoteContext.Provider value={{ quoteRequest, setQuoteRequest }}>
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuote = (): QuoteContextType => {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
};
