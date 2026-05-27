import { useRef, useState } from 'react';
import { Button } from '../Button';
import './FileUpload.css';

export interface FileUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  uploadFn?: (file: File) => Promise<string>;
  accept?: string;
  maxSizeMb?: number;
  disabled?: boolean;
}

/** FileUpload — generic single-file upload control. */
export function FileUpload({
  value,
  onChange,
  uploadFn,
  accept,
  maxSizeMb = 10,
  disabled,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [filename, setFilename] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    setError(null);
    if (!file) return;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Max ${maxSizeMb} MB`);
      return;
    }
    setFilename(file.name);
    if (!uploadFn) {
      onChange(undefined);
      return;
    }
    try {
      setBusy(true);
      const url = await uploadFn(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="file-upload">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        disabled={disabled || busy}
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      <div className="file-upload__row">
        <Button
          variant="outlined"
          size="small"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
          loading={busy}
        >
          {value ? 'Replace file' : 'Choose file'}
        </Button>
        {(filename || value) && (
          <span className="file-upload__name">{filename ?? value?.split('/').pop()}</span>
        )}
        {value && (
          <Button
            variant="text"
            size="small"
            onClick={() => {
              onChange(undefined);
              setFilename(undefined);
            }}
            disabled={disabled || busy}
          >
            Remove
          </Button>
        )}
      </div>
      {error && <p className="file-upload__error">{error}</p>}
    </div>
  );
}
