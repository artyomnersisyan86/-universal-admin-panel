import { Editor } from '@tinymce/tinymce-react';
import './TinyMCEEditor.css';

export interface TinyMCEEditorProps {
  value: string;
  onChange: (html: string) => void;
  height?: number;
  disabled?: boolean;
  /** Editor key from https://www.tiny.cloud/. Falls back to VITE_TINYMCE_API_KEY env. */
  apiKey?: string;
}

const DEFAULT_PLUGINS =
  'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount';

const DEFAULT_TOOLBAR =
  'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | link image | code';

/**
 * TinyMCEEditor — WYSIWYG HTML editor wrapper around @tinymce/tinymce-react.
 * Theme follows app's data-theme attribute on <body>.
 */
export function TinyMCEEditor({
  value,
  onChange,
  height = 320,
  disabled = false,
  apiKey,
}: TinyMCEEditorProps) {
  const resolvedKey = apiKey ?? import.meta.env.VITE_TINYMCE_API_KEY ?? 'no-api-key';
  const isDark = typeof document !== 'undefined' && document.body.dataset.theme === 'dark';

  return (
    <div className="tinymce-wrapper">
      <Editor
        apiKey={resolvedKey}
        value={value}
        disabled={disabled}
        onEditorChange={(content) => onChange(content)}
        init={{
          height,
          menubar: false,
          plugins: DEFAULT_PLUGINS,
          toolbar: DEFAULT_TOOLBAR,
          skin: isDark ? 'oxide-dark' : 'oxide',
          content_css: isDark ? 'dark' : 'default',
          branding: false,
        }}
      />
    </div>
  );
}
