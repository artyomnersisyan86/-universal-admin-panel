import { useEffect } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '../Button';
import './RichTextEditor.css';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * RichTextEditor — TipTap-based HTML editor with a minimal toolbar built from
 * the app's own Button component. Replaces the previous TinyMCE wrapper to
 * avoid the third-party API key requirement and stay within pure CSS rules.
 *
 * Output is HTML (`editor.getHTML()`), stored as a string by callers and
 * rendered later via dangerouslySetInnerHTML in display contexts — that
 * responsibility is the consumer's, not this component.
 */
export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editable: !disabled,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rte__content',
        'aria-label': placeholder ?? 'Rich text editor',
      },
    },
  });

  // Keep editor content in sync if `value` changes externally (e.g. form reset).
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [value, editor]);

  // Reflect `disabled` changes after mount.
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  return (
    <div className={`rte${disabled ? ' rte--disabled' : ''}${editor.isEmpty ? ' rte--empty' : ''}`}>
      <Toolbar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
    </div>
  );
}

interface ToolbarProps {
  editor: Editor;
  disabled?: boolean;
}

function Toolbar({ editor, disabled }: ToolbarProps) {
  const can = editor.can();
  const is = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs);

  return (
    <div className="rte__toolbar" role="toolbar" aria-label="Formatting">
      <ToolbarButton
        active={is('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled || !can.chain().focus().toggleBold().run()}
        label="Bold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        active={is('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled || !can.chain().focus().toggleItalic().run()}
        label="Italic"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        active={is('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={disabled || !can.chain().focus().toggleStrike().run()}
        label="Strikethrough"
      >
        <s>S</s>
      </ToolbarButton>
      <span className="rte__sep" aria-hidden />
      <ToolbarButton
        active={is('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        disabled={disabled}
        label="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        active={is('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={disabled}
        label="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        active={is('paragraph')}
        onClick={() => editor.chain().focus().setParagraph().run()}
        disabled={disabled}
        label="Paragraph"
      >
        P
      </ToolbarButton>
      <span className="rte__sep" aria-hidden />
      <ToolbarButton
        active={is('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
        label="Bullet list"
      >
        •
      </ToolbarButton>
      <ToolbarButton
        active={is('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
        label="Ordered list"
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        active={is('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        disabled={disabled}
        label="Quote"
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        active={is('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        disabled={disabled}
        label="Code block"
      >
        {'</>'}
      </ToolbarButton>
      <span className="rte__sep" aria-hidden />
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !can.chain().focus().undo().run()}
        label="Undo"
      >
        ↶
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !can.chain().focus().redo().run()}
        label="Redo"
      >
        ↷
      </ToolbarButton>
    </div>
  );
}

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({ active, onClick, disabled, label, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? 'primary' : 'text'}
      size="small"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className="rte__btn"
    >
      {children}
    </Button>
  );
}
