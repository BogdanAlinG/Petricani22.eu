import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings2,
  Square,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  ArrowUpDown,
  SkipForward,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SyncConfiguration {
  id: string;
  source_name: string;
  source_url: string;
  category_mappings: Record<string, string>;
  items_per_category_limit: number | null;
  skip_if_synced_within_hours: number | null;
  is_active: boolean;
  last_sync_at: string | null;
}

interface SyncLog {
  id: string;
  configuration_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  products_synced: number;
  products_skipped: number;
  products_created: number;
  products_updated: number;
  products_failed: number;
  progress_current: number;
  progress_total: number;
  current_phase: string | null;
  cancellation_requested: boolean;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface SyncLogDetail {
  id: string;
  sync_log_id: string;
  source_product_id: string;
  product_title: string;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  skip_reason: string | null;
  error_message: string | null;
  processed_at: string;
}

interface Category {
  id: string;
  name_en: string;
  name_ro: string;
  slug: string;
}

type ActionFilter = 'all' | 'created' | 'updated' | 'skipped' | 'failed';

export default function ProductSync() {
  const [config, setConfig] = useState<SyncConfiguration | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [itemsLimit, setItemsLimit] = useState<number | null>(null);
  const [skipHours, setSkipHours] = useState<number | null>(24);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [logDetails, setLogDetails] = useState<SyncLogDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [runningLogId, setRunningLogId] = useState<string | null>(null);
  const [syncStarting, setSyncStarting] = useState(false);
  const runningLogIdRef = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [configResult, logsResult, categoriesResult] = await Promise.all([
        supabase
          .from('sync_configurations')
          .select('*')
          .eq('source_name', 'foodnation')
          .maybeSingle(),
        supabase
          .from('sync_logs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(10),
        supabase.from('categories').select('id, name_en, name_ro, slug'),
      ]);

      if (configResult.error) throw configResult.error;
      if (logsResult.error) throw logsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setConfig(configResult.data);
      setLogs(logsResult.data || []);
      setCategories(categoriesResult.data || []);
      setItemsLimit(configResult.data?.items_per_category_limit ?? null);
      setSkipHours(configResult.data?.skip_if_synced_within_hours ?? 24);

      const runningLog = (logsResult.data || []).find((l) => l.status === 'running');
      if (runningLog) {
        setRunningLogId(runningLog.id);
        runningLogIdRef.current = runningLog.id;
        setSyncing(true);
      } else {
        setRunningLogId(null);
        runningLogIdRef.current = null;
        setSyncing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('sync_logs_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_logs',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLog = payload.new as SyncLog;
            setLogs((prev) => [newLog, ...prev.slice(0, 9)]);
            if (newLog.status === 'running') {
              setRunningLogId(newLog.id);
              runningLogIdRef.current = newLog.id;
              setSyncing(true);
              setSyncStarting(false);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedLog = payload.new as SyncLog;
            setLogs((prev) =>
              prev.map((log) => (log.id === updatedLog.id ? updatedLog : log))
            );
            if (updatedLog.status !== 'running') {
              if (runningLogIdRef.current === updatedLog.id) {
                setRunningLogId(null);
                runningLogIdRef.current = null;
                setSyncing(false);
                setStopping(false);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const runSync = async () => {
    if (!config) return;

    setSyncStarting(true);
    setError(null);

    try {
      const { data: syncData, error: syncInvokeError } = await supabase.functions.invoke(
        'sync-foodnation'
      );

      if (syncInvokeError) {
        throw new Error(syncInvokeError.message || 'Sync failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
      setSyncStarting(false);
      console.error('Sync error:', err);
    }
  };

  const stopSync = async () => {
    if (!runningLogId) return;

    setStopping(true);

    try {
      const { error: updateError, data } = await supabase
        .from('sync_logs')
        .update({ cancellation_requested: true })
        .eq('id', runningLogId)
        .select('cancellation_requested')
        .single();

      if (updateError) throw updateError;

      if (!data?.cancellation_requested) {
        throw new Error('Failed to request cancellation - update may not have been applied');
      }

      setLogs((prev) =>
        prev.map((log) =>
          log.id === runningLogId ? { ...log, cancellation_requested: true } : log
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop sync');
      setStopping(false);
    }
  };

  const forceCancel = async () => {
    if (!runningLogId) return;

    try {
      const runningLog = logs.find((l) => l.id === runningLogId);

      const { error: updateError } = await supabase
        .from('sync_logs')
        .update({
          status: 'cancelled',
          cancellation_requested: true,
          current_phase: 'Force cancelled by user',
          completed_at: new Date().toISOString(),
          products_synced: (runningLog?.products_created || 0) + (runningLog?.products_updated || 0),
        })
        .eq('id', runningLogId);

      if (updateError) throw updateError;

      setLogs((prev) =>
        prev.map((log) =>
          log.id === runningLogId
            ? {
                ...log,
                status: 'cancelled' as const,
                cancellation_requested: true,
                current_phase: 'Force cancelled by user',
                completed_at: new Date().toISOString(),
              }
            : log
        )
      );

      setRunningLogId(null);
      runningLogIdRef.current = null;
      setSyncing(false);
      setStopping(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to force cancel');
    }
  };

  const updateConfig = async () => {
    if (!config) return;

    try {
      const { error: updateError } = await supabase
        .from('sync_configurations')
        .update({
          items_per_category_limit: itemsLimit,
          skip_if_synced_within_hours: skipHours,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (updateError) throw updateError;

      setConfig({
        ...config,
        items_per_category_limit: itemsLimit,
        skip_if_synced_within_hours: skipHours,
      });
      setShowSettings(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  const toggleActive = async () => {
    if (!config) return;

    try {
      const { error: updateError } = await supabase
        .from('sync_configurations')
        .update({
          is_active: !config.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (updateError) throw updateError;

      setConfig({ ...config, is_active: !config.is_active });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    }
  };

  const loadLogDetails = async (logId: string) => {
    if (expandedLogId === logId) {
      setExpandedLogId(null);
      setLogDetails([]);
      return;
    }

    setExpandedLogId(logId);
    setLoadingDetails(true);
    setActionFilter('all');

    try {
      const { data, error: fetchError } = await supabase
        .from('sync_log_details')
        .select('*')
        .eq('sync_log_id', logId)
        .order('processed_at', { ascending: true });

      if (fetchError) throw fetchError;

      setLogDetails(data || []);
    } catch (err) {
      console.error('Failed to load log details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <Square className="w-5 h-5 text-orange-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
            <Plus className="w-3 h-3" />
            Created
          </span>
        );
      case 'updated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
            <ArrowUpDown className="w-3 h-3" />
            Updated
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
            <SkipForward className="w-3 h-3" />
            Skipped
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const filteredDetails =
    actionFilter === 'all'
      ? logDetails
      : logDetails.filter((d) => d.action === actionFilter);

  const detailCounts = {
    created: logDetails.filter((d) => d.action === 'created').length,
    updated: logDetails.filter((d) => d.action === 'updated').length,
    skipped: logDetails.filter((d) => d.action === 'skipped').length,
    failed: logDetails.filter((d) => d.action === 'failed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const runningLog = logs.find((l) => l.status === 'running');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Sync</h1>
          <p className="text-gray-600 mt-1">
            Synchronize products from FoodNation.ro
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            Settings
          </button>
          {syncing ? (
            <button
              onClick={stopSync}
              disabled={stopping}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {stopping ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {stopping ? 'Stopping...' : 'Stop Sync'}
            </button>
          ) : (
            <button
              onClick={runSync}
              disabled={!config?.is_active || syncStarting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncStarting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {syncStarting ? 'Starting...' : 'Run Sync'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {syncStarting && !runningLog && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <div>
              <h3 className="font-semibold text-blue-900">Starting Sync</h3>
              <p className="text-sm text-blue-700">Initializing sync process, please wait...</p>
            </div>
          </div>
        </div>
      )}

      {runningLog && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              <div>
                <h3 className="font-semibold text-blue-900">Sync in Progress</h3>
                <p className="text-sm text-blue-700">{runningLog.current_phase || 'Processing...'}</p>
              </div>
            </div>
            {runningLog.cancellation_requested && (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  Cancellation requested...
                </span>
                <button
                  onClick={forceCancel}
                  className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Force Cancel
                </button>
              </div>
            )}
          </div>

          {runningLog.progress_total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-blue-700">
                <span>
                  Progress: {runningLog.progress_current} / {runningLog.progress_total} products
                </span>
                <span>
                  {Math.round((runningLog.progress_current / runningLog.progress_total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(runningLog.progress_current / runningLog.progress_total) * 100}%`,
                  }}
                />
              </div>
              <div className="flex gap-4 text-sm mt-3">
                <span className="text-green-600">
                  Created: {runningLog.products_created || 0}
                </span>
                <span className="text-blue-600">
                  Updated: {runningLog.products_updated || 0}
                </span>
                <span className="text-yellow-600">
                  Skipped: {runningLog.products_skipped || 0}
                </span>
                {(runningLog.products_failed || 0) > 0 && (
                  <span className="text-red-600">
                    Failed: {runningLog.products_failed}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showSettings && config && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Sync Settings</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source URL
              </label>
              <input
                type="text"
                value={config.source_url}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items per Category Limit
              </label>
              <input
                type="number"
                value={itemsLimit ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setItemsLimit(null);
                  } else {
                    const num = parseInt(value);
                    if (num > 0) {
                      setItemsLimit(num);
                    }
                  }
                }}
                min={1}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for unlimited syncing
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skip if Synced Within (hours)
              </label>
              <input
                type="number"
                value={skipHours ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setSkipHours(null);
                  } else {
                    const num = parseInt(value);
                    if (num >= 0) {
                      setSkipHours(num);
                    }
                  }
                }}
                min={0}
                placeholder="0 = Never skip"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Products synced within this time will be skipped (0 = always sync)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Sync Enabled
              </span>
              <button
                onClick={toggleActive}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.is_active ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={updateConfig}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sync Status
          </h2>

          {config ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Source</span>
                <span className="font-medium">{config.source_name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    config.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {config.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Items per Category</span>
                <span className="font-medium">
                  {config.items_per_category_limit ?? 'Unlimited'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Skip Threshold</span>
                <span className="font-medium">
                  {config.skip_if_synced_within_hours
                    ? `${config.skip_if_synced_within_hours}h`
                    : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Last Sync</span>
                <span className="font-medium">
                  {formatDate(config.last_sync_at)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No sync configuration found</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Categories
          </h2>

          {categories.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{cat.name_en}</span>
                  <span className="text-sm text-gray-500">{cat.slug}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              No categories found. Create categories first before syncing.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Sync History</h2>
        </div>

        {logs.length > 0 ? (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id}>
                <div
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => loadLogDetails(log.id)}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : log.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : log.status === 'cancelled'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(log.started_at)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {(log.status === 'completed' || log.status === 'cancelled') && (
                          <span>
                            Created: {log.products_created || 0}, Updated:{' '}
                            {log.products_updated || 0}, Skipped: {log.products_skipped || 0}
                            {(log.products_failed || 0) > 0 && (
                              <span className="text-red-600">, Failed: {log.products_failed}</span>
                            )}
                          </span>
                        )}
                        {log.status === 'failed' && log.error_message && (
                          <span className="text-red-600">{log.error_message}</span>
                        )}
                        {log.status === 'running' && (
                          <span>
                            {log.current_phase || 'Sync in progress...'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {log.completed_at && (
                        <span className="text-xs text-gray-400">
                          Duration:{' '}
                          {Math.round(
                            (new Date(log.completed_at).getTime() -
                              new Date(log.started_at).getTime()) /
                              1000
                          )}
                          s
                        </span>
                      )}
                      {expandedLogId === log.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedLogId === log.id && (
                  <div className="px-4 pb-4 bg-gray-50 border-t">
                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                          Product Details ({filteredDetails.length})
                        </h4>
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-gray-400" />
                          <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                          >
                            <option value="all">All ({logDetails.length})</option>
                            <option value="created">Created ({detailCounts.created})</option>
                            <option value="updated">Updated ({detailCounts.updated})</option>
                            <option value="skipped">Skipped ({detailCounts.skipped})</option>
                            <option value="failed">Failed ({detailCounts.failed})</option>
                          </select>
                        </div>
                      </div>

                      {loadingDetails ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      ) : filteredDetails.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 sticky top-0">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Product
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Action
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Details
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Time
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredDetails.map((detail) => (
                                <tr key={detail.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                                    {detail.product_title}
                                  </td>
                                  <td className="px-4 py-2">
                                    {getActionBadge(detail.action)}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate">
                                    {detail.skip_reason || detail.error_message || '-'}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-gray-400 whitespace-nowrap">
                                    {new Date(detail.processed_at).toLocaleTimeString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-8">
                          No details available for this sync
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No sync history yet. Run your first sync to see results here.
          </div>
        )}
      </div>
    </div>
  );
}
