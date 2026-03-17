import { Plus, Trash2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { supabase } from '../../../lib/supabase';

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text_en: string;
  alt_text_ro: string;
  display_order: number;
}

interface GalleryTabProps {
  images: GalleryImage[];
  isCreating: boolean;
  accommodationId: string;
  thumbnailUrl: string | null;
  onAddImage: () => void;
  onReorder: (images: GalleryImage[]) => void;
  onRemove: (imageId: string) => void;
}

export default function GalleryTab({
  images,
  isCreating,
  accommodationId,
  thumbnailUrl,
  onAddImage,
  onReorder,
  onRemove,
}: GalleryTabProps) {
  const confirm = useConfirm();

  const handleMoveUp = async (index: number) => {
    const newOrder = images.map((g, i) => {
      if (i === index) return { ...g, display_order: images[index - 1].display_order };
      if (i === index - 1) return { ...g, display_order: images[index].display_order };
      return g;
    }).sort((a, b) => a.display_order - b.display_order);
    onReorder(newOrder);
    await supabase.from('accommodation_images').upsert(
      newOrder.map((g) => ({ id: g.id, display_order: g.display_order, accommodation_id: accommodationId, image_url: g.image_url }))
    );
  };

  const handleMoveDown = async (index: number) => {
    const newOrder = images.map((g, i) => {
      if (i === index) return { ...g, display_order: images[index + 1].display_order };
      if (i === index + 1) return { ...g, display_order: images[index].display_order };
      return g;
    }).sort((a, b) => a.display_order - b.display_order);
    onReorder(newOrder);
    await supabase.from('accommodation_images').upsert(
      newOrder.map((g) => ({ id: g.id, display_order: g.display_order, accommodation_id: accommodationId, image_url: g.image_url }))
    );
  };

  const handleRemove = async (imageId: string) => {
    const confirmed = await confirm({
      title: 'Remove Gallery Image',
      message: 'Remove this image from the gallery?',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    await supabase.from('accommodation_images').delete().eq('id', imageId);
    onRemove(imageId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">Gallery Images</h3>
          <p className="text-sm text-gray-500 mt-1">
            Add images that will be shown in the accommodation gallery. The <strong>Thumbnail image</strong> set in Basic tab will always be shown first.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddImage}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Image
        </button>
      </div>

      {isCreating && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            Please save the accommodation first before adding gallery images.
          </p>
        </div>
      )}

      {images.length === 0 && !isCreating ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No gallery images yet</p>
          <p className="text-sm text-gray-400 mt-1">Add images to create a gallery for this accommodation</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div key={img.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={img.image_url} alt={img.alt_text_en || ''} className="w-full h-full object-cover" />
              </div>
              {thumbnailUrl === img.image_url && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs rounded-full shadow-sm">
                  Main Thumbnail
                </span>
              )}
              {index === 0 && thumbnailUrl !== img.image_url && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-gray-600 text-white text-xs rounded-full shadow-sm">
                  First Gallery Image
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                    title="Move up"
                  >
                    <ChevronLeft className="w-4 h-4 rotate-90" />
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                    title="Move down"
                  >
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(img.id)}
                  className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
