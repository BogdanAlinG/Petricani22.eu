import { useState } from 'react';
import { Image as ImageIcon, X, Upload } from 'lucide-react';
import ImagePicker from './ImagePicker';

interface ImageInputProps {
  value: string | null;
  onChange: (image: { id: string; url: string; alt?: string } | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  previewSize?: 'sm' | 'md' | 'lg';
}

export default function ImageInput({
  value,
  onChange,
  label,
  placeholder = 'Select an image',
  className = '',
  previewSize = 'md',
}: ImageInputProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const handleSelect = (image: { id: string; url: string; alt?: string } | null) => {
    if (image) {
      setImageUrl(image.url);
    } else {
      setImageUrl(null);
    }
    onChange(image);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageUrl(null);
    onChange(null);
  };

  const displayUrl = imageUrl || value;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className={`${sizeClasses[previewSize]} rounded-lg border-2 border-dashed border-gray-300 hover:border-primary transition-colors flex items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100 relative group`}
        >
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt="Selected"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="text-center p-2">
              <ImageIcon className="w-6 h-6 mx-auto text-gray-400" />
              <span className="text-xs text-gray-500 mt-1 block">Select</span>
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:border-primary transition-colors bg-white min-h-[48px]"
          >
            {displayUrl ? (
              <span className="text-gray-900 truncate block">Image selected</span>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </button>
          {displayUrl && (
            <button
              type="button"
              onClick={handleClear}
              className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Remove image
            </button>
          )}
        </div>
      </div>

      <ImagePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelect}
        selectedImageId={value || undefined}
      />
    </div>
  );
}
