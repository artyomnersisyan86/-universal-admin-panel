import { Typography } from '@shared/ui/Typography';
import { ImageUpload } from '@shared/ui/ImageUpload';
import { FileUpload } from '@shared/ui/FileUpload';
import type { FieldBlock } from '@shared/types';
import './FieldBlock.css';

interface Props {
  block: FieldBlock;
}

/**
 * Stage 2 renders a structural preview of the field — label, type, and
 * a disabled instance of the actual widget so the layout matches what the
 * editor will see when filling entry data (Stage 4).
 */
export function FieldBlockView({ block }: Props) {
  const { field } = block.props;
  const flags: string[] = [];
  if (field.required) flags.push('required');
  if (field.multilingual) flags.push('multilingual');

  return (
    <div className="sb-field">
      <div className="sb-field__head">
        <Typography variant="body">
          <strong>{field.label}</strong>
        </Typography>
        <span className="sb-field__type">{field.type}</span>
      </div>
      <FieldPreview field={field} />
      {flags.length > 0 && (
        <div className="sb-field__flags">
          {flags.map((f) => (
            <span key={f} className="sb-field__flag">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldPreview({ field }: { field: FieldBlock['props']['field'] }) {
  switch (field.type) {
    case 'text':
      return (
        <input
          className="sb-field__preview"
          disabled
          placeholder={field.placeholder || field.label}
        />
      );
    case 'select':
      return (
        <select className="sb-field__preview" disabled>
          <option>{field.placeholder || '— select —'}</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value}>{o.label}</option>
          ))}
        </select>
      );
    case 'checkbox':
      return (
        <label className="sb-field__inline">
          <input type="checkbox" disabled />
          <span>{field.label}</span>
        </label>
      );
    case 'switch':
      return (
        <label className="sb-field__switch">
          <input type="checkbox" disabled />
          <span className="sb-field__switch-track" aria-hidden />
          <span>{field.label}</span>
        </label>
      );
    case 'richtext':
      return (
        <div className="sb-field__preview sb-field__preview--rich">
          <span>Rich text editor (TipTap)</span>
        </div>
      );
    case 'image':
      return (
        <div className="sb-field__upload-preview">
          <ImageUpload value={undefined} onChange={() => undefined} disabled />
        </div>
      );
    case 'file':
      return (
        <div className="sb-field__upload-preview">
          <FileUpload value={undefined} onChange={() => undefined} disabled />
        </div>
      );
    case 'button':
      return (
        <button
          type="button"
          className="sb-field__preview sb-field__preview--button"
          disabled
        >
          {field.label}
        </button>
      );
    case 'repeater':
      return (
        <div className="sb-field__preview sb-field__preview--repeater">
          <span className="sb-field__repeater-icon">≡</span>
          <span>Repeater</span>
          {(field.subFields ?? []).length > 0 && (
            <div className="sb-field__subfields">
              {(field.subFields ?? []).map((sf) => (
                <span key={sf.id} className="sb-field__subflag">
                  {sf.name}: {sf.type}
                </span>
              ))}
            </div>
          )}
        </div>
      );
  }
}
