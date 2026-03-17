import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  RefreshCw,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  AlertCircle,
  X,
  Loader,
  Ban,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import type { Accommodation, Booking, BlockedDate, ICalFeed, ICalEvent } from '../../types/accommodation';

const PLATFORMS = [
  { value: 'airbnb', label: 'Airbnb', color: 'bg-rose-500' },
  { value: 'booking', label: 'Booking.com', color: 'bg-blue-600' },
  { value: 'vrbo', label: 'VRBO', color: 'bg-teal-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarEvent {
  id: string;
  start: string;
  end: string;
  title: string;
  type: 'booking' | 'blocked' | 'ical';
  source?: string;
  color: string;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never synced';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isStale(dateStr: string | null): boolean {
  if (!dateStr) return true;
  return Date.now() - new Date(dateStr).getTime() > 60 * 60 * 1000;
}

export default function AvailabilityCalendar() {
  const toast = useToast();
  const confirm = useConfirm();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [icalFeeds, setIcalFeeds] = useState<ICalFeed[]>([]);
  const [icalEvents, setIcalEvents] = useState<ICalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showFeedsPanel, setShowFeedsPanel] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newFeed, setNewFeed] = useState({ platform: 'airbnb', feed_name: '', feed_url: '' });
  const [newBlock, setNewBlock] = useState({ start_date: '', end_date: '', reason: '' });
  const [copied, setCopied] = useState(false);
  const [addingFeed, setAddingFeed] = useState(false);

  useEffect(() => {
    fetchAccommodations();
  }, []);

  useEffect(() => {
    if (selectedAccommodation) {
      fetchCalendarData();
    }
  }, [selectedAccommodation, currentMonth]);

  const fetchAccommodations = async () => {
    const { data } = await supabase.from('accommodations').select('*').order('title_en');
    setAccommodations(data || []);
    if (data && data.length > 0) {
      setSelectedAccommodation(data[0].id);
    }
    setLoading(false);
  };

  const fetchCalendarData = async () => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);
    const startStr = startOfMonth.toISOString().split('T')[0];
    const endStr = endOfMonth.toISOString().split('T')[0];

    const [bookingsRes, blockedRes, feedsRes, eventsRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .eq('accommodation_id', selectedAccommodation)
        .neq('booking_status', 'cancelled')
        .gte('check_out_date', startStr)
        .lte('check_in_date', endStr),
      supabase
        .from('blocked_dates')
        .select('*')
        .eq('accommodation_id', selectedAccommodation)
        .gte('end_date', startStr)
        .lte('start_date', endStr),
      supabase.from('ical_feeds').select('*').eq('accommodation_id', selectedAccommodation),
      supabase
        .from('ical_events')
        .select('*, ical_feed:ical_feeds!inner(*)')
        .eq('ical_feed.accommodation_id', selectedAccommodation)
        .gte('end_date', startStr)
        .lte('start_date', endStr),
    ]);

    setBookings(bookingsRes.data || []);
    setBlockedDates(blockedRes.data || []);
    setIcalFeeds(feedsRes.data || []);
    setIcalEvents(eventsRes.data || []);
  };

  const eventCountByFeed = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of icalEvents) {
      counts[e.ical_feed_id] = (counts[e.ical_feed_id] || 0) + 1;
    }
    return counts;
  }, [icalEvents]);

  const calendarEvents = useMemo((): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    bookings.forEach((b) => {
      events.push({
        id: b.id,
        start: b.check_in_date,
        end: b.check_out_date,
        title: `${b.guest_name} (${b.booking_number})`,
        type: 'booking',
        color: 'bg-green-500',
      });
    });

    blockedDates.forEach((b) => {
      events.push({
        id: b.id,
        start: b.start_date,
        end: b.end_date,
        title: b.reason || 'Blocked',
        type: 'blocked',
        color: 'bg-gray-500',
      });
    });

    icalEvents.forEach((e) => {
      const feed = icalFeeds.find((f) => f.id === e.ical_feed_id);
      const platform = PLATFORMS.find((p) => p.value === feed?.platform);
      events.push({
        id: e.id,
        start: e.start_date,
        end: e.end_date,
        title: e.summary || 'Reserved',
        type: 'ical',
        source: platform?.label,
        color: platform?.color || 'bg-gray-400',
      });
    });

    return events;
  }, [bookings, blockedDates, icalEvents, icalFeeds]);

  const syncFeed = async (feedId: string) => {
    setSyncing(feedId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-ical`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ feed_id: feedId }),
        }
      );

      if (!response.ok) throw new Error('Sync failed');

      const result = await response.json();
      const feedResult = result.results?.[0];
      if (feedResult?.success) {
        toast.success(`Synced ${feedResult.events_imported || 0} events`);
      } else if (feedResult?.error) {
        toast.error(`Sync error: ${feedResult.error}`);
      }

      await fetchCalendarData();
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Failed to sync calendar feed');
    } finally {
      setSyncing(null);
    }
  };

  const syncAllFeeds = async () => {
    setSyncing('all');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-ical`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) throw new Error('Sync failed');

      const result = await response.json();
      const successCount = result.results?.filter((r: { success: boolean }) => r.success).length || 0;
      const totalEvents = result.results?.reduce((sum: number, r: { events_imported?: number }) => sum + (r.events_imported || 0), 0) || 0;
      toast.success(`Synced ${successCount} feed(s), ${totalEvents} events total`);

      await fetchCalendarData();
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Failed to sync calendar feeds');
    } finally {
      setSyncing(null);
    }
  };

  const duplicateUrlWarning = useMemo(() => {
    if (!newFeed.feed_url) return '';
    const existing = icalFeeds.find((f) => f.feed_url.trim() === newFeed.feed_url.trim());
    if (existing) return `This URL is already added as "${existing.feed_name}"`;
    return '';
  }, [newFeed.feed_url, icalFeeds]);

  const addFeed = async () => {
    if (!newFeed.feed_name || !newFeed.feed_url || duplicateUrlWarning) return;

    setAddingFeed(true);
    try {
      const { data, error } = await supabase
        .from('ical_feeds')
        .insert({
          accommodation_id: selectedAccommodation,
          platform: newFeed.platform,
          feed_name: newFeed.feed_name,
          feed_url: newFeed.feed_url.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setNewFeed({ platform: 'airbnb', feed_name: '', feed_url: '' });
      await fetchCalendarData();

      if (data?.id) {
        await syncFeed(data.id);
      }
    } catch (err) {
      console.error('Error adding feed:', err);
      toast.error('Failed to add calendar feed');
    } finally {
      setAddingFeed(false);
    }
  };

  const deleteFeed = async (feedId: string) => {
    const confirmed = await confirm({
      title: 'Delete Calendar Feed',
      message: 'Delete this calendar feed and all its imported events?',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('ical_feeds').delete().eq('id', feedId);
      if (error) throw error;
      await fetchCalendarData();
    } catch (err) {
      console.error('Error deleting feed:', err);
    }
  };

  const addBlockedDate = async () => {
    if (!newBlock.start_date || !newBlock.end_date) return;

    try {
      const { error } = await supabase.from('blocked_dates').insert({
        accommodation_id: selectedAccommodation,
        start_date: newBlock.start_date,
        end_date: newBlock.end_date,
        reason: newBlock.reason || null,
      });

      if (error) throw error;

      setNewBlock({ start_date: '', end_date: '', reason: '' });
      setShowBlockModal(false);
      await fetchCalendarData();
    } catch (err) {
      console.error('Error blocking dates:', err);
      toast.error('Failed to block dates');
    }
  };

  const getDaysInMonth = () => {
    const days = [];
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startPadding = firstDay.getDay();

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter((e) => dateStr >= e.start && dateStr < e.end);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const copyExportUrl = () => {
    const selectedAcc = accommodations.find((a) => a.id === selectedAccommodation);
    if (!selectedAcc) return;

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-ical?slug=${selectedAcc.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedAcc = accommodations.find((a) => a.id === selectedAccommodation);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability Calendar</h1>
          <p className="text-gray-600 mt-1">Manage availability and sync external calendars</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBlockModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Ban className="w-5 h-5" />
            Block Dates
          </button>
          <button
            onClick={() => setShowFeedsPanel(!showFeedsPanel)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFeedsPanel
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <LinkIcon className="w-5 h-5" />
            iCal Feeds
            {icalFeeds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                {icalFeeds.length}
              </span>
            )}
          </button>
          <button
            onClick={syncAllFeeds}
            disabled={syncing !== null || icalFeeds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${syncing === 'all' ? 'animate-spin' : ''}`} />
            Sync All
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <select
          value={selectedAccommodation}
          onChange={(e) => setSelectedAccommodation(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        >
          {accommodations.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.title_en}
            </option>
          ))}
        </select>

        {selectedAcc && (
          <button
            onClick={copyExportUrl}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Export URL
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`${showFeedsPanel ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white rounded-xl shadow-sm border border-gray-100 p-6`}>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
              }
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
              }
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}

            {getDaysInMonth().map((day, index) => (
              <div
                key={index}
                className={`min-h-[100px] border border-gray-100 rounded-lg p-1 ${
                  day ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {day && (
                  <>
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday(day)
                          ? 'w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center'
                          : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {getEventsForDay(day)
                        .slice(0, 3)
                        .map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs px-1.5 py-0.5 rounded truncate text-white ${event.color}`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                      {getEventsForDay(day).length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{getEventsForDay(day).length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm text-gray-600">Direct Bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500" />
              <span className="text-sm text-gray-600">Manual Blocks</span>
            </div>
            {PLATFORMS.filter((p) => icalFeeds.some((f) => f.platform === p.value)).map(
              (platform) => (
                <div key={platform.value} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${platform.color}`} />
                  <span className="text-sm text-gray-600">{platform.label}</span>
                </div>
              )
            )}
          </div>
        </div>

        {showFeedsPanel && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">iCal Feeds</h3>
              <button
                onClick={() => setShowFeedsPanel(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {icalFeeds.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No calendar feeds</p>
                  <p className="text-xs mt-1">Add an Airbnb, Booking.com, or VRBO iCal URL below</p>
                </div>
              ) : (
                icalFeeds.map((feed) => {
                  const platform = PLATFORMS.find((p) => p.value === feed.platform);
                  const feedEventCount = eventCountByFeed[feed.id] || 0;
                  const stale = isStale(feed.last_synced_at);
                  const isSyncingThis = syncing === feed.id || syncing === 'all';

                  return (
                    <div
                      key={feed.id}
                      className={`p-3 border rounded-lg transition-colors ${
                        stale && feed.sync_status !== 'pending'
                          ? 'border-amber-200 bg-amber-50/50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${platform?.color || 'bg-gray-400'}`}
                            />
                            <span className="font-medium text-sm truncate">{feed.feed_name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{platform?.label}</span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs text-gray-500">{feedEventCount} events</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <button
                            onClick={() => syncFeed(feed.id)}
                            disabled={syncing !== null}
                            className="p-1 text-gray-500 hover:text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-40"
                            title="Sync this feed"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => deleteFeed(feed.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        {feed.sync_status === 'success' ? (
                          stale ? (
                            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          )
                        ) : feed.sync_status === 'error' ? (
                          <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
                        ) : (
                          <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={`${stale && feed.sync_status === 'success' ? 'text-amber-600' : 'text-gray-500'}`}>
                          {timeAgo(feed.last_synced_at)}
                        </span>
                      </div>
                      {feed.sync_error && (
                        <p className="text-xs text-red-600 mt-1.5 break-words">{feed.sync_error}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3">Add New Feed</h4>
              <div className="space-y-3">
                <select
                  value={newFeed.platform}
                  onChange={(e) => setNewFeed({ ...newFeed, platform: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Feed name (e.g. Airbnb Ground Floor)"
                  value={newFeed.feed_name}
                  onChange={(e) => setNewFeed({ ...newFeed, feed_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
                <div>
                  <input
                    type="url"
                    placeholder="iCal URL"
                    value={newFeed.feed_url}
                    onChange={(e) => setNewFeed({ ...newFeed, feed_url: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      duplicateUrlWarning ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                    }`}
                  />
                  {duplicateUrlWarning && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {duplicateUrlWarning}
                    </p>
                  )}
                </div>
                <button
                  onClick={addFeed}
                  disabled={!newFeed.feed_name || !newFeed.feed_url || !!duplicateUrlWarning || addingFeed}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {addingFeed ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {addingFeed ? 'Adding & Syncing...' : 'Add Feed'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Block Dates</h2>
              <button
                onClick={() => setShowBlockModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newBlock.start_date}
                    onChange={(e) => setNewBlock({ ...newBlock, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newBlock.end_date}
                    onChange={(e) => setNewBlock({ ...newBlock, end_date: e.target.value })}
                    min={newBlock.start_date}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                  placeholder="e.g., Maintenance, Personal use"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addBlockedDate}
                  disabled={!newBlock.start_date || !newBlock.end_date}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  Block Dates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
