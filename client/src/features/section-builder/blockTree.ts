import type {
  BlockNode,
  BlockType,
  FieldBlock,
  FieldDef,
  FieldType,
  LayoutTree,
  Multilingual,
  TypographyBlock,
} from '@shared/types';
import { LAYOUT_VERSION } from '@shared/types';

export function emptyLayout(): LayoutTree {
  return { version: LAYOUT_VERSION, root: [] };
}

/**
 * Normalize layout coming from the API or from old seed data — guarantees
 * `version` and an array `root` so the UI never has to defend against
 * malformed inputs.
 */
export function normalizeLayout(input: unknown): LayoutTree {
  if (!input || typeof input !== 'object') return emptyLayout();
  const obj = input as { version?: unknown; root?: unknown };
  const root = Array.isArray(obj.root) ? (obj.root as BlockNode[]) : [];
  return { version: LAYOUT_VERSION, root };
}

export function findById(nodes: BlockNode[], id: string): BlockNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.type === 'container') {
      const found = findById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function indexOfId(nodes: BlockNode[], id: string): number {
  return nodes.findIndex((n) => n.id === id);
}

export function insertAt(
  nodes: BlockNode[],
  index: number,
  node: BlockNode,
): BlockNode[] {
  const clamped = Math.max(0, Math.min(index, nodes.length));
  return [...nodes.slice(0, clamped), node, ...nodes.slice(clamped)];
}

export function removeById(nodes: BlockNode[], id: string): BlockNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.type === 'container' ? { ...n, children: removeById(n.children, id) } : n,
    );
}

export function updateById(
  nodes: BlockNode[],
  id: string,
  patch: (node: BlockNode) => BlockNode,
): BlockNode[] {
  return nodes.map((n) => {
    if (n.id === id) return patch(n);
    if (n.type === 'container') {
      return { ...n, children: updateById(n.children, id, patch) };
    }
    return n;
  });
}

export function moveById(
  nodes: BlockNode[],
  fromId: string,
  toId: string,
): BlockNode[] {
  const fromIdx = indexOfId(nodes, fromId);
  const toIdx = indexOfId(nodes, toId);
  if (fromIdx === -1 || toIdx === -1) return nodes;
  const copy = [...nodes];
  const [moved] = copy.splice(fromIdx, 1);
  copy.splice(toIdx, 0, moved);
  return copy;
}

// ---------------------------------------------------------------------------
// Multilingual text migration — toggling `multilingual` should preserve the
// admin's existing text rather than blanking the field.
// ---------------------------------------------------------------------------

export function toMultilingual(value: string | Multilingual<string>): Multilingual<string> {
  if (typeof value === 'string') return { hy: value, ru: '', en: '' };
  return value;
}

export function toPlainText(value: string | Multilingual<string>): string {
  if (typeof value === 'string') return value;
  return value.hy || value.ru || value.en || '';
}

// ---------------------------------------------------------------------------
// Block factories
// ---------------------------------------------------------------------------

const DEFAULT_TYPOGRAPHY_VARIANT = 'h2' as const;

export function makeTypographyBlock(): TypographyBlock {
  return {
    id: crypto.randomUUID(),
    type: 'typography',
    props: {
      variant: DEFAULT_TYPOGRAPHY_VARIANT,
      text: 'Heading',
      multilingual: false,
    },
  };
}

export function makeFieldBlock(fieldType: FieldType = 'text'): FieldBlock {
  const id = crypto.randomUUID();
  const field: FieldDef = {
    id,
    type: fieldType,
    name: `${fieldType}_field`,
    label: `${fieldType.charAt(0).toUpperCase()}${fieldType.slice(1)} field`,
    placeholder: '',
    required: false,
    multilingual: false,
    options:
      fieldType === 'select' ? [{ value: 'opt1', label: 'Option 1' }] : undefined,
    buttonAction: fieldType === 'button' ? 'submit' : undefined,
    buttonVariant: fieldType === 'button' ? 'primary' : undefined,
  };
  return { id, type: 'field', props: { field } };
}

export function makeContainerBlock(): BlockNode {
  return {
    id: crypto.randomUUID(),
    type: 'container',
    props: {},
    children: [],
  };
}

export function makeSliderBlock(): BlockNode {
  return {
    id: crypto.randomUUID(),
    type: 'slider',
    props: { slides: [] },
  };
}

export function makeBlock(type: BlockType): BlockNode {
  switch (type) {
    case 'typography':
      return makeTypographyBlock();
    case 'field':
      return makeFieldBlock();
    case 'container':
      return makeContainerBlock();
    case 'slider':
      return makeSliderBlock();
  }
}
