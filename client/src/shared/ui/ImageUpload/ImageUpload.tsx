import { useRef, useState, useEffect } from 'react';
import { Button } from '../Button';
import './ImageUpload.css';

export interface ImageUploadProps {
  /** Current image URL (after upload) or undefined. */
  value?: string;
  onChange: (url: string | undefined) => void;
  /** Function that uploads a File and returns the resulting URL. */
  uploadFn?: (file: File) => Promise<string>;
  accept?: string;
  maxSizeMb?: number;
  disabled?: boolean;
}

/** ImageUpload — drag-or-click upload zone with preview. */
export function ImageUpload({
  value,
  onChange,
  uploadFn,
  accept = 'image/*',
  maxSizeMb = 5,
  disabled,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | undefined>(value);

  useEffect(() => setLocalPreview(value), [value]);

  async function handleFile(file: File | null) {
    setError(null);
    if (!file) return;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Max ${maxSizeMb} MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLocalPreview(reader.result as string);
    reader.readAsDataURL(file);

    if (uploadFn) {
      try {
        setBusy(true);
        const url = await uploadFn(file);
        onChange(url);
        setLocalPreview(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
        setLocalPreview(value);
      } finally {
        setBusy(false);
      }
    } else {
      onChange(undefined);
    }
  }

  return (
    <div className={`image-upload${disabled ? ' image-upload--disabled' : ''}`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        disabled={disabled || busy}
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      <div className="image-upload__preview" onClick={() => inputRef.current?.click()}>
        {localPreview ? (
          <img src={localPreview} alt="" className="image-upload__img" />
        ) : (
          <span className="image-upload__placeholder">+</span>
        )}
      </div>
      <div className="image-upload__actions">
        <Button
          variant="outlined"
          size="small"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
          loading={busy}
        >
          {value ? 'Replace' : 'Upload'}
        </Button>
        {value && (
          <Button
            variant="text"
            size="small"
            onClick={() => {
              onChange(undefined);
              setLocalPreview(undefined);
            }}
            disabled={disabled || busy}
          >
            Remove
          </Button>
        )}
      </div>
      {error && <p className="image-upload__error">{error}</p>}
    </div>
  );
}
