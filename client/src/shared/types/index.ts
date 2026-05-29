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

// ---------------------------------------------------------------------------
// Style / layout / responsive primitives (Stage 3)
//
// All of these are OPTIONAL on block props so layouts authored in Stage 2
// (where blocks had `props: {}` / `props: { slides: [] }`) keep validating and
// rendering unchanged. No layout migration is required — `LAYOUT_VERSION`
// stays at 1.
// ---------------------------------------------------------------------------

/**
 * Visual styling applied to a block wrapper. Values are CSS strings — either a
 * token reference (`var(--space-3)`, `var(--color-primary)`) or a literal
 * (`#ff0000`, `12px`). `undefined` means "inherit / no override".
 */
export interface BlockStyle {
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
}

export type FlexDirection = 'row' | 'column';
export type FlexWrap = 'nowrap' | 'wrap';
export type JustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
export type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';

/** Flex container settings (applies to container blocks, and field rows). */
export interface FlexLayout {
  direction?: FlexDirection;
  gap?: string;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  wrap?: FlexWrap;
}

/** Width of a child block when its parent lays children out in a flex row. */
export type FieldWidth = '100%' | '50%' | '33%' | 'auto';

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

/**
 * Per-breakpoint overrides. `desktop` is the base (stored on the block props
 * directly), so only `tablet` and `mobile` carry overrides here. Any subset of
 * style/layout/width may be overridden.
 */
export type BreakpointOverride = Partial<BlockStyle & FlexLayout> & {
  width?: FieldWidth;
};

export interface ResponsiveOverrides {
  tablet?: BreakpointOverride;
  mobile?: BreakpointOverride;
}

export interface TypographyBlock {
  id: string;
  type: 'typography';
  props: {
    variant: TypographyVariant;
    text: LocalizedText;
    multilingual: boolean;
    style?: BlockStyle;
    width?: FieldWidth;
    responsive?: ResponsiveOverrides;
  };
}

export interface FieldBlock {
  id: string;
  type: 'field';
  props: {
    field: FieldDef;
    style?: BlockStyle;
    width?: FieldWidth;
    responsive?: ResponsiveOverrides;
  };
}

export interface ContainerBlock {
  id: string;
  type: 'container';
  props: {
    style?: BlockStyle;
    layout?: FlexLayout;
    width?: FieldWidth;
    responsive?: ResponsiveOverrides;
  };
  children: BlockNode[];
}

export interface Slide {
  id: string;
  title?: LocalizedText;
  multilingualTitle?: boolean;
  text?: LocalizedText;
  multilingualText?: boolean;
  buttonLabel?: LocalizedText;
  multilingualButton?: boolean;
  buttonUrl?: string;
  /** Desktop image is required; mobile is an optional override. URLs from /api/uploads. */
  image: { desktop: string; mobile?: string };
}

export interface SliderBlock {
  id: string;
  type: 'slider';
  props: {
    slides: Slide[];
    style?: BlockStyle;
    responsive?: ResponsiveOverrides;
  };
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
