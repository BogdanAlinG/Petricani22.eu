import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Bed,
  Bath,
  Users,
  Star,
  Image as ImageIcon,
  GripVertical,
} from 'lucide-react';
import type { Accommodation } from '../../../types/accommodation';

interface AccommodationTableProps {
  accommodations: Accommodation[];
  onEdit: (acc: Accommodation) => void;
  onDelete: (acc: Accommodation) => void;
  onToggleVisibility: (acc: Accommodation) => void;
  onCreate: () => void;
}

export default function AccommodationTable({
  accommodations,
  onEdit,
  onDelete,
  onToggleVisibility,
  onCreate,
}: AccommodationTableProps) {
  if (accommodations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Bed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No rentals yet</h3>
        <p className="text-gray-500 mb-6">Add your first rental to get started</p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Rental
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rental</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specs</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Night</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {accommodations.map((acc) => (
              <tr key={acc.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center text-gray-400">
                    <GripVertical className="w-4 h-4 mr-1" />
                    {acc.display_order + 1}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden">
                      {acc.thumbnail_url ? (
                        <img src={acc.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{acc.title_en}</p>
                      <p className="text-sm text-gray-500">{acc.title_ro}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 capitalize text-gray-600">{acc.unit_type}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {acc.beds}</span>
                    <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {acc.bathrooms}</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {acc.max_guests}</span>
                  </div>
                </td>
                <td className="px-4 py-4 font-medium text-gray-900">{acc.base_price_per_night} EUR</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${acc.is_visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {acc.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                    {acc.is_featured && <Star className="w-4 h-4 text-amber-500 fill-current" />}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onToggleVisibility(acc)}
                      className={`p-2 rounded-lg transition-colors ${acc.is_visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      {acc.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => onEdit(acc)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(acc)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
