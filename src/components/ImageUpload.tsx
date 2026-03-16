import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

interface CompressedImage {
  file: File;
  preview: string;
  originalSize: number;
  compressedSize: number;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 2,
  maxSizeMB = 5,
  disabled = false,
}: ImageUploadProps) {
  const [compressedImages, setCompressedImages] = useState<CompressedImage[]>([]);
  const [error, setError] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image on client side
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate dimensions (max 1920x1080)
          let width = img.width;
          let height = img.height;
          const maxWidth = 1920;
          const maxHeight = 1080;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Compress with quality 0.7
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not compress image'));
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              resolve(compressedFile);
            },
            'image/jpeg',
            0.7
          );
        };

        img.onerror = () => reject(new Error('Could not load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError('');

    if (files.length === 0) return;

    // Check if adding would exceed max
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(f => f.size > maxSizeMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed ${maxSizeMB}MB limit`);
      return;
    }

    // Validate file types
    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Only image files are allowed');
      return;
    }

    setIsCompressing(true);

    try {
      const compressed: CompressedImage[] = [];
      
      for (const file of files) {
        const compressedFile = await compressImage(file);
        const preview = URL.createObjectURL(compressedFile);
        
        compressed.push({
          file: compressedFile,
          preview,
          originalSize: file.size,
          compressedSize: compressedFile.size,
        });
      }

      setCompressedImages(prev => [...prev, ...compressed]);
      onImagesChange([...images, ...compressed.map(c => c.file)]);
    } catch (err) {
      setError('Failed to process images. Please try again.');
      console.error(err);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newCompressed = compressedImages.filter((_, i) => i !== index);
    const newImages = images.filter((_, i) => i !== index);
    
    // Revoke URL to prevent memory leak
    URL.revokeObjectURL(compressedImages[index].preview);
    
    setCompressedImages(newCompressed);
    onImagesChange(newImages);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Supporting Images
        </label>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${disabled 
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || isCompressing}
            className="hidden"
          />
          
          <Upload className={`mx-auto h-12 w-12 ${disabled ? 'text-gray-400' : 'text-gray-500'} mb-3`} />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isCompressing ? 'Compressing images...' : 'Click to upload images'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            JPG, PNG up to {maxSizeMB}MB each
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Image Previews */}
      {compressedImages.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {compressedImages.map((img, index) => (
            <div
              key={index}
              className="relative group bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden"
            >
              <img
                src={img.preview}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => !disabled && removeImage(index)}
                disabled={disabled}
                className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Size Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                <div className="flex justify-between items-center">
                  <span>Original: {formatSize(img.originalSize)}</span>
                  <span className="text-green-400">
                    {formatSize(img.compressedSize)}
                  </span>
                </div>
                {img.compressedSize < img.originalSize && (
                  <div className="text-green-300 text-xs">
                    Saved {((1 - img.compressedSize / img.originalSize) * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="flex items-center justify-center p-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No images selected
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
