# Shared UI components

Every component under `client/src/shared/ui/<Name>/` is self-contained:

```
Name/
├── Name.tsx
├── Name.css        # only this component's styles
└── index.ts        # named exports
```

No external state, no API client imports inside `shared/ui/*` — only `react`, `react-i18next` (optional), and CSS variables. This makes them **copy-portable** to other projects: drop the folder in, import the CSS variables (`tokens.css`), and you're done.

---

## Typography

```tsx
import { Typography } from '@shared/ui/Typography';

<Typography variant="h1">Page title</Typography>
<Typography variant="body">Plain paragraph.</Typography>
<Typography variant="caption" as="span">Subtle text</Typography>
```

| Prop      | Type                                                         | Default | Notes                            |
|-----------|--------------------------------------------------------------|---------|----------------------------------|
| `variant` | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6' \| 'body' \| 'caption'` | `'body'` | Fluid size via `clamp()`         |
| `as`      | `ElementType`                                                | tag for variant | Override rendered HTML tag      |
| `className` | `string`                                                   | `''`    | Concatenated after the `.t-*` class |

CSS classes (`.t-h1` … `.t-caption`) live in `src/styles/typography.css`.

---

## Button

```tsx
import { Button } from '@shared/ui/Button';

<Button>Save</Button>
<Button variant="outlined" size="small" loading>Loading…</Button>
<Button variant="text" startIcon={<Icon/>}>Cancel</Button>
```

| Prop        | Type                                  | Default     |
|-------------|---------------------------------------|-------------|
| `variant`   | `'primary' \| 'outlined' \| 'text'`   | `'primary'` |
| `size`      | `'small' \| 'medium' \| 'large'`      | `'medium'`  |
| `loading`   | `boolean`                             | `false`     |
| `fullWidth` | `boolean`                             | `false`     |
| `disabled`  | `boolean`                             | `false`     |
| `startIcon` / `endIcon` | `ReactNode`               | `undefined` |

Colors come from CSS custom properties (`--color-primary`, etc.), so theme switching is automatic.

---

## FormGroup

Schema-driven form using React Hook Form + Zod. Renders fields from a `FieldDef[]` (produced by the Form Builder).

```tsx
import { FormGroup } from '@shared/ui/FormGroup';
import { apiClient } from '@shared/lib/apiClient';

<FormGroup
  schema={fieldsFromBuilder}
  onSubmit={async (values) => { await apiClient.post('/things', values); }}
  serverErrors={serverErrorsState}       // { name: 'msg' } or { name: { hy: '...' } }
  uploadFn={async (file) => {
    const fd = new FormData(); fd.append('file', file);
    return (await apiClient.post('/uploads', fd)).data.url;
  }}
/>
```

`serverErrors` flows through `applyServerErrors()` and is shown under matching fields (per-tab for multilingual).

### Multilingual fields

A field with `multilingual: true` is wrapped by `<LanguageTabs>`. Its value shape becomes:

```ts
{ fieldName: { hy: '...', ru: '...', en: '...' } }
```

If `required && multilingual`, all three languages must be filled.

---

## LanguageTabs

```tsx
import { LanguageTabs } from '@shared/ui/LanguageTabs';

<LanguageTabs render={(lang) => <input value={state[lang]} onChange={…} />} />
```

| Prop        | Type                                              | Notes                                 |
|-------------|---------------------------------------------------|---------------------------------------|
| `render`    | `(lang: 'hy'\|'ru'\|'en') => ReactNode`           | Required                              |
| `hasContent` | `(lang) => boolean`                              | Green dot indicator                   |
| `hasError`  | `(lang) => boolean`                               | Red dot indicator                     |
| `initialLang` | `'hy' \| 'ru' \| 'en'`                          | Default `'hy'`                        |

---

## TextInput

Bare themed input. Use inside `FieldShell` or `FormGroup`.

```tsx
<TextInput value={v} onChange={(e) => setV(e.target.value)} invalid={!!err} placeholder="..." />
```

---

## Select

```tsx
<Select
  options={[{ value: 'a', label: 'A' }]}
  value={v}
  onChange={(e) => setV(e.target.value)}
  placeholder="Pick one"
/>
```

---

## TinyMCEEditor

Wrapper around `@tinymce/tinymce-react`. Needs `VITE_TINYMCE_API_KEY`.

```tsx
<TinyMCEEditor value={html} onChange={setHtml} height={400} />
```

Dark theme is auto-detected from `<body data-theme="dark">`.

---

## ImageUpload / FileUpload

```tsx
<ImageUpload
  value={url}
  onChange={setUrl}
  uploadFn={async (file) => {
    const fd = new FormData(); fd.append('file', file);
    return (await apiClient.post('/uploads', fd)).data.url;
  }}
/>
```

`uploadFn` is optional; without it the control returns `undefined` and you handle upload elsewhere.

---

## Theming

Define overrides in `client/src/styles/tokens.css`:

```css
:root {
  --color-primary: #2610cc;
  --color-primary-hover: #1f0db0;
  --color-secondary: #3a1de0;
  --color-success: #2e7d32;
  --color-warning: #ed6c02;
  --color-error: #d32f2f;
  --color-neutral: #9e9e9e;
}
[data-theme='dark'] { /* …surface colors flip */ }
```

Toggle via `useTheme()`:

```tsx
const { theme, toggleTheme } = useTheme();
<Button onClick={toggleTheme}>{theme === 'dark' ? 'Light' : 'Dark'}</Button>
```

---

## Copy-portable checklist

To reuse a `shared/ui/*` component in another project:

1. Copy the folder.
2. Copy `src/styles/tokens.css` (or merge custom properties into your own theme).
3. Make sure `react`, `react-i18next` (if used), and the component's specific deps (e.g., `@tinymce/tinymce-react`) are installed.
