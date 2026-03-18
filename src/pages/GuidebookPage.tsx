import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Wifi, Phone, MapPin, ChevronDown, BookOpen,
  ExternalLink, Globe, Copy, Check, Navigation,
  Lock, Eye, EyeOff, KeyRound,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import GuidebookIcon from './admin/guidebook/GuidebookIcon';
import type { GuidebookCategory, GuidebookItem } from './admin/guidebook/guidebook.types';

interface AccommodationInfo {
  id: string;
  title_en: string;
  title_ro: string;
  slug: string;
  address: string | null;
  phone: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  latitude: number | null;
  longitude: number | null;
  thumbnail_url: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  guidebook_pin: string | null;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-stone-100 text-stone-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-base mt-3 mb-1 text-stone-900">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-4 mb-1 text-stone-900">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-2 text-stone-900">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-stone-600">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-stone-600">$2</li>')
    .replace(/(<li[^>]*>.*<\/li>)/s, '<ul class="space-y-1 my-2">$1</ul>')
    .replace(/\n\n/g, '<br class="my-2" />')
    .replace(/\n/g, '<br />');
}

interface ItemCardProps {
  item: GuidebookItem;
  lang: 'en' | 'ro';
  isGlobal: boolean;
  pinUnlocked: boolean;
  onUnlockRequest: () => void;
}

function ItemCard({ item, lang, isGlobal, pinUnlocked, onUnlockRequest }: ItemCardProps) {
  const title = lang === 'en' ? item.title_en : item.title_ro;
  const content = lang === 'en' ? item.content_en : item.content_ro;
  const locked = item.requires_pin && !pinUnlocked;

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-shadow ${
      locked ? 'border-stone-200' : 'border-stone-100 hover:shadow-md'
    }`}>
      {item.image_url && !locked && (
        <img
          src={item.image_url}
          alt={title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
      )}
      {item.image_url && locked && (
        <div className="w-full h-48 bg-stone-100 flex items-center justify-center">
          <Lock className="w-8 h-8 text-stone-300" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-stone-900 text-base leading-tight">{title}</h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {item.requires_pin && (
              <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium border ${
                pinUnlocked
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {pinUnlocked
                  ? (lang === 'en' ? 'Unlocked' : 'Deblocat')
                  : (lang === 'en' ? 'Protected' : 'Protejat')}
              </span>
            )}
            {!isGlobal && !item.requires_pin && (
              <span className="px-2 py-0.5 text-[10px] bg-primary/5 text-primary border border-primary/20 rounded-full font-medium">
                {lang === 'en' ? 'This rental' : 'Această unitate'}
              </span>
            )}
          </div>
        </div>
        {locked ? (
          <button
            onClick={onUnlockRequest}
            className="w-full mt-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-stone-400 text-sm hover:bg-stone-100 hover:text-stone-600 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            {lang === 'en' ? 'Enter PIN to view' : 'Introduceți PIN-ul pentru a vedea'}
          </button>
        ) : (
          content && (
            <div
              className="text-sm text-stone-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          )
        )}
      </div>
    </div>
  );
}

interface AccordionSectionProps {
  category: GuidebookCategory;
  items: GuidebookItem[];
  lang: 'en' | 'ro';
  isInitiallyOpen?: boolean;
  pinUnlocked: boolean;
  onUnlockRequest: () => void;
}

function AccordionSection({ category, items, lang, isInitiallyOpen = false, pinUnlocked, onUnlockRequest }: AccordionSectionProps) {
  const [open, setOpen] = useState(isInitiallyOpen);
  const title = lang === 'en' ? category.title_en : category.title_ro;
  const isUnitSpecific = !!category.accommodation_id;
  const categoryLocked = category.requires_pin && !pinUnlocked;

  return (
    <div className={`rounded-2xl overflow-hidden border transition-shadow ${
      open ? 'shadow-md border-stone-200' : 'shadow-sm border-stone-100 hover:shadow-md'
    } bg-white`}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left group"
      >
        <div className="flex items-center gap-3.5">
          <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${
            categoryLocked
              ? 'bg-amber-50 text-amber-500'
              : isUnitSpecific
              ? 'bg-primary/8 text-primary'
              : 'bg-stone-100 text-stone-500'
          }`}>
            {categoryLocked
              ? <Lock className="w-5 h-5" />
              : <GuidebookIcon name={category.icon} className="w-5 h-5" />
            }
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 text-[15px] leading-tight">{title}</span>
              {category.requires_pin && (
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium border ${
                  pinUnlocked
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {pinUnlocked
                    ? (lang === 'en' ? 'Unlocked' : 'Deblocat')
                    : (lang === 'en' ? 'Protected' : 'Protejat')}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {items.length} {items.length === 1
                ? (lang === 'en' ? 'item' : 'element')
                : (lang === 'en' ? 'items' : 'elemente')}
            </p>
          </div>
        </div>
        <div className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
          open ? 'bg-stone-100' : 'bg-transparent group-hover:bg-stone-50'
        }`}>
          <ChevronDown
            className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-stone-50 pt-4">
          {categoryLocked ? (
            <button
              onClick={onUnlockRequest}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-amber-50 border border-dashed border-amber-200 text-amber-600 text-sm hover:bg-amber-100 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              {lang === 'en' ? 'Enter PIN to unlock this section' : 'Introduceți PIN-ul pentru a debloca această secțiune'}
            </button>
          ) : (
            items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                lang={lang}
                isGlobal={item.accommodation_id === null}
                pinUnlocked={pinUnlocked}
                onUnlockRequest={onUnlockRequest}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface PinModalProps {
  lang: 'en' | 'ro';
  onSubmit: (pin: string) => void;
  onClose: () => void;
  error: boolean;
}

function PinModal({ lang, onSubmit, onClose, error }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim()) onSubmit(pin.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center w-14 h-14 bg-amber-50 rounded-2xl mx-auto mb-4">
            <Lock className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 text-center mb-1">
            {lang === 'en' ? 'Protected Content' : 'Conținut Protejat'}
          </h2>
          <p className="text-sm text-stone-500 text-center mb-5">
            {lang === 'en'
              ? 'Enter the PIN provided by your host to access this content.'
              : 'Introduceți PIN-ul furnizat de gazda dvs. pentru a accesa acest conținut.'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={lang === 'en' ? 'Enter PIN' : 'Introduceți PIN'}
                className={`w-full px-4 py-3.5 pr-12 border rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 transition-colors ${
                  error
                    ? 'border-red-300 bg-red-50 focus:ring-red-200 text-red-700'
                    : 'border-stone-200 focus:ring-primary/20 focus:border-primary'
                }`}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPin((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center font-medium">
                {lang === 'en' ? 'Incorrect PIN. Please try again.' : 'PIN incorect. Încercați din nou.'}
              </p>
            )}
            <button
              type="submit"
              disabled={!pin.trim()}
              className="w-full py-3.5 bg-stone-900 text-white rounded-xl font-semibold text-sm hover:bg-stone-800 transition-colors disabled:opacity-40"
            >
              {lang === 'en' ? 'Unlock' : 'Deblochează'}
            </button>
          </form>
        </div>
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 text-stone-400 text-sm hover:text-stone-600 transition-colors"
          >
            {lang === 'en' ? 'Cancel' : 'Anulează'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuidebookPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lang, setLang] = useState<'en' | 'ro'>('en');
  const [accommodation, setAccommodation] = useState<AccommodationInfo | null>(null);
  const [categories, setCategories] = useState<GuidebookCategory[]>([]);
  const [items, setItems] = useState<GuidebookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);

  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('petricani22_language');
    if (stored === 'RO') setLang('ro');
    else setLang('en');
  }, []);

  useEffect(() => {
    if (!slug) return;

    async function load() {
      setLoading(true);
      try {
        const { data: accData, error: accError } = await supabase
          .from('accommodations')
          .select('id, title_en, title_ro, slug, address, phone, wifi_name, wifi_password, latitude, longitude, thumbnail_url, check_in_time, check_out_time, guidebook_pin')
          .eq('slug', slug)
          .maybeSingle();

        if (accError) throw accError;
        if (!accData) {
          setNotFound(true);
          return;
        }

        setAccommodation({
          id: accData.id,
          title_en: accData.title_en,
          title_ro: accData.title_ro,
          slug: accData.slug,
          address: accData.address || null,
          phone: accData.phone || null,
          wifi_name: accData.wifi_name || null,
          wifi_password: accData.wifi_password || null,
          latitude: accData.latitude || null,
          longitude: accData.longitude || null,
          thumbnail_url: accData.thumbnail_url || null,
          check_in_time: accData.check_in_time || null,
          check_out_time: accData.check_out_time || null,
          guidebook_pin: accData.guidebook_pin || null,
        });

        const sessionKey = `guidebook_pin_unlocked_${accData.id}`;
        if (sessionStorage.getItem(sessionKey) === 'true') {
          setPinUnlocked(true);
        }

        const [catRes, itemRes] = await Promise.all([
          supabase
            .from('guidebook_categories')
            .select('*')
            .or(`accommodation_id.is.null,accommodation_id.eq.${accData.id}`)
            .order('display_order', { ascending: true }),
          supabase
            .from('guidebook_items')
            .select('*')
            .or(`accommodation_id.is.null,accommodation_id.eq.${accData.id}`)
            .order('display_order', { ascending: true }),
        ]);

        if (catRes.error) throw catRes.error;
        if (itemRes.error) throw itemRes.error;

        setCategories(catRes.data || []);
        setItems(itemRes.data || []);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  const handlePinSubmit = (enteredPin: string) => {
    if (!accommodation?.guidebook_pin) return;
    if (enteredPin === accommodation.guidebook_pin) {
      setPinUnlocked(true);
      setPinError(false);
      setShowPinModal(false);
      const sessionKey = `guidebook_pin_unlocked_${accommodation.id}`;
      sessionStorage.setItem(sessionKey, 'true');
    } else {
      setPinError(true);
    }
  };

  const handlePinClose = () => {
    setShowPinModal(false);
    setPinError(false);
  };

  const openPinModal = () => {
    setPinError(false);
    setShowPinModal(true);
  };

  const copyWifiPassword = async () => {
    if (!accommodation?.wifi_password) return;
    await navigator.clipboard.writeText(accommodation.wifi_password);
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  const getItemsForCategory = (catId: string) =>
    items
      .filter((i) => i.category_id === catId)
      .sort((a, b) => a.display_order - b.display_order);

  const categoriesWithItems = categories.filter(
    (cat) => getItemsForCategory(cat.id).length > 0
  );

  const wifiCategory = categories.find((c) =>
    c.icon === 'Wifi' || c.title_en.toLowerCase().includes('wi-fi') || c.title_en.toLowerCase().includes('wifi')
  );

  const hasProtectedContent =
    accommodation?.guidebook_pin &&
    (categories.some((c) => c.requires_pin) || items.some((i) => i.requires_pin));

  const mapsUrl = accommodation?.latitude && accommodation?.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${accommodation.latitude},${accommodation.longitude}`
    : accommodation?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(accommodation.address)}`
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-400 text-sm tracking-wide">Loading your guide...</p>
        </div>
      </div>
    );
  }

  if (notFound || !accommodation) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-stone-300" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">Guide not found</h1>
          <p className="text-stone-500 text-sm mb-6">
            We couldn't find a guidebook for this property. Please check your URL or contact your host.
          </p>
          <a href="/ro" className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline">
            Return to homepage
          </a>
        </div>
      </div>
    );
  }

  const accName = lang === 'en' ? accommodation.title_en : accommodation.title_ro;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-semibold text-stone-900 text-sm truncate">{accName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasProtectedContent && !pinUnlocked && (
              <button
                onClick={openPinModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors border border-amber-200"
              >
                <Lock className="w-3.5 h-3.5" />
                {lang === 'en' ? 'Enter PIN' : 'PIN'}
              </button>
            )}
            {pinUnlocked && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                <Check className="w-3.5 h-3.5" />
                {lang === 'en' ? 'Unlocked' : 'Deblocat'}
              </div>
            )}
            <button
              onClick={() => setLang(lang === 'en' ? 'ro' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 text-xs font-semibold hover:bg-stone-200 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? 'RO' : 'EN'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="relative">
          {accommodation.thumbnail_url ? (
            <div className="relative h-52 overflow-hidden">
              <img
                src={accommodation.thumbnail_url}
                alt={accName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
                  {lang === 'en' ? 'Guest Guide' : 'Ghid Oaspeți'}
                </p>
                <h1 className="text-white text-2xl font-bold leading-tight">{accName}</h1>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary to-primary-dark px-6 pt-8 pb-6">
              <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">
                {lang === 'en' ? 'Guest Guide' : 'Ghid Oaspeți'}
              </p>
              <h1 className="text-white text-2xl font-bold leading-tight">{accName}</h1>
            </div>
          )}
        </div>

        <div className="px-4 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {accommodation.phone && (
              <a
                href={`tel:${accommodation.phone}`}
                className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all group"
              >
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">
                    {lang === 'en' ? 'Host' : 'Gazdă'}
                  </p>
                  <p className="text-sm font-semibold text-stone-900 truncate">
                    {lang === 'en' ? 'Call Host' : 'Sună Gazda'}
                  </p>
                </div>
              </a>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all group"
              >
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">
                    {lang === 'en' ? 'Navigate' : 'Navigare'}
                  </p>
                  <p className="text-sm font-semibold text-stone-900 truncate">
                    {lang === 'en' ? 'Directions' : 'Direcții'}
                  </p>
                </div>
              </a>
            )}
            {(accommodation.check_in_time || accommodation.check_out_time) && (
              <div className="col-span-2 flex gap-3">
                {accommodation.check_in_time && (
                  <div className="flex-1 p-3.5 bg-white rounded-2xl border border-stone-100 shadow-sm">
                    <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide mb-0.5">
                      {lang === 'en' ? 'Check-in' : 'Check-in'}
                    </p>
                    <p className="text-base font-bold text-stone-900">{accommodation.check_in_time}</p>
                  </div>
                )}
                {accommodation.check_out_time && (
                  <div className="flex-1 p-3.5 bg-white rounded-2xl border border-stone-100 shadow-sm">
                    <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide mb-0.5">
                      {lang === 'en' ? 'Check-out' : 'Check-out'}
                    </p>
                    <p className="text-base font-bold text-stone-900">{accommodation.check_out_time}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {accommodation.wifi_password && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                  <Wifi className="w-5 h-5 text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide mb-0.5">Wi-Fi</p>
                  {accommodation.wifi_name && (
                    <p className="text-sm font-semibold text-stone-900 truncate">{accommodation.wifi_name}</p>
                  )}
                  <p className="text-sm text-stone-500 font-mono truncate">{accommodation.wifi_password}</p>
                </div>
                <button
                  onClick={copyWifiPassword}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    copiedWifi
                      ? 'bg-green-500 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {copiedWifi ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {lang === 'en' ? 'Copied' : 'Copiat'}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      {lang === 'en' ? 'Copy' : 'Copiază'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {accommodation.address && (
            <div className="flex items-start gap-3 px-1">
              <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <p className="text-sm text-stone-500">{accommodation.address}</p>
            </div>
          )}

          {categoriesWithItems.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-stone-100">
              <BookOpen className="w-10 h-10 text-stone-200 mx-auto mb-3" />
              <p className="text-stone-400 text-sm">
                {lang === 'en' ? 'No guide content yet.' : 'Niciun conținut de ghid deocamdată.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {categoriesWithItems.map((cat, idx) => (
                <AccordionSection
                  key={cat.id}
                  category={cat}
                  items={getItemsForCategory(cat.id)}
                  lang={lang}
                  isInitiallyOpen={idx === 0 || cat.id === wifiCategory?.id}
                  pinUnlocked={pinUnlocked}
                  onUnlockRequest={openPinModal}
                />
              ))}
            </div>
          )}

          <div className="text-center pb-8 pt-2">
            <a
              href="/ro"
              className="inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-stone-500 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {lang === 'en' ? 'Visit our website' : 'Vizitați site-ul nostru'}
            </a>
          </div>
        </div>
      </div>

      {showPinModal && (
        <PinModal
          lang={lang}
          onSubmit={handlePinSubmit}
          onClose={handlePinClose}
          error={pinError}
        />
      )}
    </div>
  );
}
