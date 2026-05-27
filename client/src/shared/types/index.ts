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

export type FieldType = 'text' | 'select' | 'richtext' | 'image' | 'file' | 'button';

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
