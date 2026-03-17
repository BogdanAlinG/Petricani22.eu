import { useEffect, useState } from 'react';
import {
  RefreshCw,
  AlertCircle,
  Check,
  Euro,
  Sparkles,
  Save,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  source: string;
  fetched_at: string;
  is_active: boolean;
}

export default function AdminSettings() {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [aiPointersEn, setAiPointersEn] = useState('');
  const [aiPointersRo, setAiPointersRo] = useState('');
  const [savingPointers, setSavingPointers] = useState(false);
  const [pointersMessage, setPointersMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchExchangeRates();
    fetchAiPointers();
  }, []);

  async function fetchAiPointers() {
    const { data } = await supabase
      .from('site_settings')
      .select('value_en, value_ro')
      .eq('key', 'ai_pointers')
      .maybeSingle();
    if (data) {
      setAiPointersEn(data.value_en || '');
      setAiPointersRo(data.value_ro || '');
    }
  }

  async function saveAiPointers() {
    setSavingPointers(true);
    const { error } = await supabase
      .from('site_settings')
      .update({ value_en: aiPointersEn, value_ro: aiPointersRo, updated_at: new Date().toISOString() })
      .eq('key', 'ai_pointers');

    if (error) {
      setPointersMessage({ type: 'error', text: 'Failed to save pointers' });
    } else {
      setPointersMessage({ type: 'success', text: 'AI pointers saved successfully' });
    }
    setSavingPointers(false);
    setTimeout(() => setPointersMessage({ type: '', text: '' }), 3000);
  }

  async function fetchExchangeRates() {
    const { data } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setExchangeRates(data);
    }
    setLoading(false);
  }

  async function updateExchangeRate(id: string, rate: number) {
    setUpdating(true);
    const { error } = await supabase
      .from('exchange_rates')
      .update({
        rate,
        source: 'manual',
        fetched_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update rate' });
    } else {
      setMessage({ type: 'success', text: 'Rate updated successfully' });
      fetchExchangeRates();
    }
    setUpdating(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }

  async function toggleActiveRate(id: string, currentActive: boolean) {
    if (currentActive) return;

    const rate = exchangeRates.find((r) => r.id === id);
    if (!rate) return;

    await supabase
      .from('exchange_rates')
      .update({ is_active: false })
      .eq('base_currency', rate.base_currency)
      .eq('target_currency', rate.target_currency);

    await supabase.from('exchange_rates').update({ is_active: true }).eq('id', id);

    fetchExchangeRates();
  }

  async function refreshRateFromAPI() {
    setUpdating(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-exchange-rate`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }

      const data = await response.json();
      setMessage({
        type: 'success',
        text: `Rate refreshed: 1 EUR = ${data.rate} RON`,
      });
      fetchExchangeRates();
    } catch {
      setMessage({ type: 'error', text: 'Failed to refresh exchange rate' });
    }

    setUpdating(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure system settings and exchange rates</p>
      </div>

      {message.text && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Euro className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Exchange Rates</h2>
              <p className="text-sm text-gray-600">
                Manage currency conversion rates
              </p>
            </div>
          </div>
          <button
            onClick={refreshRateFromAPI}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            Refresh from API
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {exchangeRates.map((rate) => (
            <div key={rate.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <div className="font-semibold text-gray-900">
                    {rate.base_currency} to {rate.target_currency}
                  </div>
                  <div className="text-sm text-gray-600">
                    Source: {rate.source} | Last updated: {formatDate(rate.fetched_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">1 {rate.base_currency} =</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={rate.rate}
                    onChange={(e) => {
                      const newRates = exchangeRates.map((r) =>
                        r.id === rate.id
                          ? { ...r, rate: parseFloat(e.target.value) || 0 }
                          : r
                      );
                      setExchangeRates(newRates);
                    }}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-right font-mono focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <span className="text-gray-600">{rate.target_currency}</span>
                </div>

                <button
                  onClick={() => updateExchangeRate(rate.id, rate.rate)}
                  disabled={updating}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Save
                </button>

                <button
                  onClick={() => toggleActiveRate(rate.id, rate.is_active)}
                  disabled={rate.is_active}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    rate.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  {rate.is_active ? 'Active' : 'Set Active'}
                </button>
              </div>
            </div>
          ))}

          {exchangeRates.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No exchange rates configured. Click "Refresh from API" to fetch the latest rates.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">AI Writing Pointers</h2>
            <p className="text-sm text-gray-600">
              Facts and corrections injected into every AI generation prompt
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4 leading-relaxed">
            Use these fields to provide accurate facts about the property — location, features, tone, etc. The AI will follow these pointers when generating any text. Write one point per line (bullet points with <code className="font-mono bg-gray-100 px-1 rounded">-</code> are recommended).
          </p>

          {pointersMessage.text && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${pointersMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {pointersMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {pointersMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                English Pointers
              </label>
              <textarea
                value={aiPointersEn}
                onChange={(e) => setAiPointersEn(e.target.value)}
                rows={8}
                placeholder={"- The property is in the Lacul Tei / Pipera area, NOT city center.\n- The indoor area is 450 sqm.\n- The outdoor courtyard fits up to 200 guests."}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Romanian Pointers
              </label>
              <textarea
                value={aiPointersRo}
                onChange={(e) => setAiPointersRo(e.target.value)}
                rows={8}
                placeholder={"- Proprietatea se află în zona Lacul Tei / Pipera, NU în centrul orașului.\n- Suprafața interioară este de 450 mp."}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary resize-y"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveAiPointers}
              disabled={savingPointers}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingPointers ? 'Saving...' : 'Save Pointers'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Environment</div>
            <div className="font-medium text-gray-900">
              {import.meta.env.MODE === 'production' ? 'Production' : 'Development'}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Supabase Connected</div>
            <div className="font-medium text-green-600 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Yes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
