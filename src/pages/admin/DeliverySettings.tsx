import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name_en: string;
}

interface TimeSlot {
  id: string;
  slot_name_en: string;
  slot_name_ro: string;
  start_time: string;
  end_time: string;
  max_orders_per_slot: number | null;
  category_id: string | null;
  is_active: boolean;
}

interface OrderDeadline {
  id: string;
  day_of_week: number;
  cutoff_time: string;
  applies_to_category_id: string | null;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function DeliverySettings() {
  const [activeTab, setActiveTab] = useState<'slots' | 'deadlines'>('slots');
  const [categories, setCategories] = useState<Category[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [deadlines, setDeadlines] = useState<OrderDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [editingDeadline, setEditingDeadline] = useState<OrderDeadline | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [slotForm, setSlotForm] = useState({
    slot_name_en: '',
    slot_name_ro: '',
    start_time: '',
    end_time: '',
    max_orders_per_slot: '',
    category_id: '',
    is_active: true,
  });

  const [deadlineForm, setDeadlineForm] = useState({
    day_of_week: 0,
    cutoff_time: '',
    applies_to_category_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [categoriesRes, slotsRes, deadlinesRes] = await Promise.all([
      supabase.from('categories').select('id, name_en').order('display_order'),
      supabase.from('delivery_time_slots').select('*').order('start_time'),
      supabase.from('order_deadlines').select('*').order('day_of_week'),
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (slotsRes.data) setTimeSlots(slotsRes.data);
    if (deadlinesRes.data) setDeadlines(deadlinesRes.data);
    setLoading(false);
  }

  function openSlotModal(slot?: TimeSlot) {
    if (slot) {
      setEditingSlot(slot);
      setSlotForm({
        slot_name_en: slot.slot_name_en,
        slot_name_ro: slot.slot_name_ro,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_orders_per_slot: slot.max_orders_per_slot?.toString() || '',
        category_id: slot.category_id || '',
        is_active: slot.is_active,
      });
    } else {
      setEditingSlot(null);
      setSlotForm({
        slot_name_en: '',
        slot_name_ro: '',
        start_time: '',
        end_time: '',
        max_orders_per_slot: '',
        category_id: '',
        is_active: true,
      });
    }
    setError('');
    setShowSlotModal(true);
  }

  function openDeadlineModal(deadline?: OrderDeadline) {
    if (deadline) {
      setEditingDeadline(deadline);
      setDeadlineForm({
        day_of_week: deadline.day_of_week,
        cutoff_time: deadline.cutoff_time,
        applies_to_category_id: deadline.applies_to_category_id || '',
      });
    } else {
      setEditingDeadline(null);
      setDeadlineForm({
        day_of_week: 0,
        cutoff_time: '',
        applies_to_category_id: '',
      });
    }
    setError('');
    setShowDeadlineModal(true);
  }

  async function handleSlotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const data = {
      slot_name_en: slotForm.slot_name_en,
      slot_name_ro: slotForm.slot_name_ro,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      max_orders_per_slot: slotForm.max_orders_per_slot
        ? parseInt(slotForm.max_orders_per_slot)
        : null,
      category_id: slotForm.category_id || null,
      is_active: slotForm.is_active,
    };

    if (editingSlot) {
      const { error: updateError } = await supabase
        .from('delivery_time_slots')
        .update(data)
        .eq('id', editingSlot.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('delivery_time_slots')
        .insert(data);

      if (insertError) {
        setError(insertError.message);
        return;
      }
    }

    setShowSlotModal(false);
    fetchData();
  }

  async function handleDeadlineSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const data = {
      day_of_week: deadlineForm.day_of_week,
      cutoff_time: deadlineForm.cutoff_time,
      applies_to_category_id: deadlineForm.applies_to_category_id || null,
    };

    if (editingDeadline) {
      const { error: updateError } = await supabase
        .from('order_deadlines')
        .update(data)
        .eq('id', editingDeadline.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('order_deadlines')
        .insert(data);

      if (insertError) {
        setError(insertError.message);
        return;
      }
    }

    setShowDeadlineModal(false);
    fetchData();
  }

  async function deleteSlot(id: string) {
    await supabase.from('delivery_time_slots').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchData();
  }

  async function deleteDeadline(id: string) {
    await supabase.from('order_deadlines').delete().eq('id', id);
    setDeleteConfirm(null);
    fetchData();
  }

  async function toggleSlotActive(id: string, currentStatus: boolean) {
    await supabase
      .from('delivery_time_slots')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    fetchData();
  }

  function getCategoryName(id: string | null) {
    if (!id) return 'All Categories';
    return categories.find((c) => c.id === id)?.name_en || 'Unknown';
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Delivery Settings</h1>
        <p className="text-gray-600">Manage time slots and order deadlines</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('slots')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'slots'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4 inline-block mr-2" />
          Time Slots
        </button>
        <button
          onClick={() => setActiveTab('deadlines')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'deadlines'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4 inline-block mr-2" />
          Order Deadlines
        </button>
      </div>

      {activeTab === 'slots' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => openSlotModal()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Time Slot
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Name (EN / RO)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Time Range
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Max Orders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timeSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{slot.slot_name_en}</div>
                      <div className="text-sm text-gray-500">{slot.slot_name_ro}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {slot.max_orders_per_slot || 'Unlimited'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {getCategoryName(slot.category_id)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSlotActive(slot.id, slot.is_active)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          slot.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {slot.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openSlotModal(slot)}
                          className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {deleteConfirm === slot.id ? (
                          <>
                            <button
                              onClick={() => deleteSlot(slot.id)}
                              className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(slot.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {timeSlots.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No time slots configured yet.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'deadlines' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => openDeadlineModal()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Deadline
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Day of Week
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Cutoff Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Applies To
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deadlines.map((deadline) => (
                  <tr key={deadline.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {DAYS_OF_WEEK[deadline.day_of_week]}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {deadline.cutoff_time.slice(0, 5)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {getCategoryName(deadline.applies_to_category_id)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDeadlineModal(deadline)}
                          className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {deleteConfirm === deadline.id ? (
                          <>
                            <button
                              onClick={() => deleteDeadline(deadline.id)}
                              className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(deadline.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {deadlines.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No order deadlines configured yet.
              </div>
            )}
          </div>
        </div>
      )}

      {showSlotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSlot ? 'Edit Time Slot' : 'Create Time Slot'}
              </h2>
              <button
                onClick={() => setShowSlotModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSlotSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    value={slotForm.slot_name_en}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, slot_name_en: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Romanian) *
                  </label>
                  <input
                    type="text"
                    value={slotForm.slot_name_ro}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, slot_name_ro: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={slotForm.start_time}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, start_time: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={slotForm.end_time}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, end_time: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Orders
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={slotForm.max_orders_per_slot}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, max_orders_per_slot: e.target.value })
                    }
                    placeholder="Unlimited"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={slotForm.category_id}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, category_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slotForm.is_active}
                  onChange={(e) =>
                    setSlotForm({ ...slotForm, is_active: e.target.checked })
                  }
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                />
                <span className="text-gray-700">Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowSlotModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  {editingSlot ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeadlineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingDeadline ? 'Edit Order Deadline' : 'Create Order Deadline'}
              </h2>
              <button
                onClick={() => setShowDeadlineModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeadlineSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week *
                </label>
                <select
                  value={deadlineForm.day_of_week}
                  onChange={(e) =>
                    setDeadlineForm({
                      ...deadlineForm,
                      day_of_week: parseInt(e.target.value),
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cutoff Time *
                </label>
                <input
                  type="time"
                  value={deadlineForm.cutoff_time}
                  onChange={(e) =>
                    setDeadlineForm({ ...deadlineForm, cutoff_time: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Applies To Category
                </label>
                <select
                  value={deadlineForm.applies_to_category_id}
                  onChange={(e) =>
                    setDeadlineForm({
                      ...deadlineForm,
                      applies_to_category_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowDeadlineModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  {editingDeadline ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
