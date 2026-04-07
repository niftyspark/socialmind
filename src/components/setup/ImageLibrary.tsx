import { useState, useEffect, useCallback } from "react";
import { FiUpload, FiTrash2, FiImage, FiLoader } from "react-icons/fi";
import type { ImageLibraryItem } from "../../types/agent";
import { uploadImage, listImages, deleteImage } from "../../utils/api";

interface Props {
  images: ImageLibraryItem[];
  onChange: (images: ImageLibraryItem[]) => void;
}

export function ImageLibrary({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing images from server on mount
  useEffect(() => {
    listImages()
      .then((data) => {
        if (data.images.length > 0 && images.length === 0) {
          onChange(data.images);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);
      setUploading(true);

      const newImages: ImageLibraryItem[] = [];
      for (const file of Array.from(files)) {
        // Validate
        if (!file.type.startsWith("image/")) {
          setError(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} is too large (max 5MB)`);
          continue;
        }

        try {
          const result = await uploadImage(file);
          newImages.push({
            id: result.id,
            url: result.url,
            name: result.name,
            uploadedAt: Date.now(),
          });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : `Failed to upload ${file.name}`
          );
        }
      }

      if (newImages.length > 0) {
        onChange([...newImages, ...images]);
      }
      setUploading(false);
    },
    [images, onChange]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteImage(id);
        onChange(images.filter((img) => img.id !== id));
      } catch {
        setError("Failed to delete image");
      }
    },
    [images, onChange]
  );

  return (
    <div className="wizard-form">
      <div className="form-section">
        <p className="form-section-desc">
          Upload images that your agent will use for Instagram posts. Each post
          will randomly pick an image from your library. The AI-generated caption
          goes with the image.
        </p>

        {error && (
          <div className="form-error">
            {error}
            <button
              onClick={() => setError(null)}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", marginLeft: 8 }}
            >
              dismiss
            </button>
          </div>
        )}

        {/* Upload area */}
        <label className="image-upload-zone">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
            hidden
          />
          <div className="image-upload-content">
            {uploading ? (
              <>
                <FiLoader className="spin" size={24} />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FiUpload size={24} />
                <span>Click to upload images</span>
                <span className="image-upload-hint">
                  JPG, PNG, WebP — max 5MB each — multiple files OK
                </span>
              </>
            )}
          </div>
        </label>

        {/* Image grid */}
        {loading ? (
          <div className="image-grid-loading">
            <FiLoader className="spin" />
            <span>Loading library...</span>
          </div>
        ) : images.length === 0 ? (
          <div className="empty-state-small">
            <FiImage size={32} style={{ opacity: 0.3 }} />
            <p>No images uploaded yet</p>
            <p className="muted">
              Upload at least a few images for Instagram posts. Without images,
              the agent will use stock photos.
            </p>
          </div>
        ) : (
          <>
            <div className="image-grid-header">
              <span>{images.length} image{images.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="image-grid">
              {images.map((img) => (
                <div key={img.id} className="image-grid-item">
                  <img src={img.url} alt={img.name} loading="lazy" />
                  <div className="image-grid-overlay">
                    <span className="image-grid-name">{img.name}</span>
                    <button
                      className="image-grid-delete"
                      onClick={() => handleDelete(img.id)}
                      title="Delete image"
                      type="button"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
