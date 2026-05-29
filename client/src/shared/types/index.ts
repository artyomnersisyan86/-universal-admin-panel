export type SupportedLanguage = 'hy' | 'ru' | 'en';
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['hy', 'ru', 'en'];

export type Multilingual<T = string> = Record<SupportedLanguage, T>;

export type UserRole = 'superadmin' | 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type FieldType =
  | 'text'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'richtext'
  | 'image'
  | 'file'
  | 'button';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldDef {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multilingual?: boolean;
  options?: SelectOption[];           // for select
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;                  // regex string
  };
  /** Button-only props */
  buttonAction?: 'submit' | 'reset';
  buttonVariant?: 'primary' | 'outlined' | 'text';
}

export interface FormSchema {
  id: string;
  name: string;
  fields: FieldDef[];
  createdAt: string;
  updatedAt: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface DynamicEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  mode: 'static' | 'db';
  responseTemplate?: unknown;
  dbQueryConfig?: unknown;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type TableColumnType = 'text' | 'number' | 'boolean' | 'image' | 'richtext';

export interface TableColumnDef {
  key: string;
  label: string;
  type: TableColumnType;
  multilingual?: boolean;
  hidden?: boolean;
  searchable?: boolean;
}

export interface TableDefinition {
  id: string;
  name: string;
  columns: TableColumnDef[];
  createdAt: string;
  updatedAt: string;
}

export interface TableRow {
  id: string;
  order: number;
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Section / block-builder types (Stage 2)
// ---------------------------------------------------------------------------

export const LAYOUT_VERSION = 1 as const;

export type BlockType = 'typography' | 'field' | 'container' | 'slider';

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'caption';

/**
 * Text payload that can be either a plain string (multilingual=false)
 * or per-locale strings (multilingual=true).
 */
export type LocalizedText = string | Multilingual<string>;

export interface TypographyBlock {
  id: string;
  type: 'typography';
  props: {
    variant: TypographyVariant;
    text: LocalizedText;
    multilingual: boolean;
  };
}

export interface FieldBlock {
  id: string;
  type: 'field';
  props: { field: FieldDef };
}

export interface ContainerBlock {
  id: string;
  type: 'container';
  props: Record<string, never>;
  children: BlockNode[];
}

export interface SliderBlock {
  id: string;
  type: 'slider';
  props: { slides: [] };
}

export type BlockNode = TypographyBlock | FieldBlock | ContainerBlock | SliderBlock;

export interface LayoutTree {
  version: typeof LAYOUT_VERSION;
  root: BlockNode[];
}

export interface Section {
  id: string;
  slug: string;
  name: Multilingual<string>;
  layout: LayoutTree;
  isPublic: boolean;
  displayOrder: number;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
}
