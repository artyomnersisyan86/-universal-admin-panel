import type {
  BlockNode,
  BlockType,
  FieldBlock,
  FieldDef,
  FieldType,
  LayoutTree,
  Multilingual,
  Slide,
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

/**
 * Location of a node inside the tree: the sibling array that holds it, the
 * id of its parent container (`null` = the root array), and its index.
 */
export interface NodeLocation {
  siblings: BlockNode[];
  parentId: string | null;
  index: number;
}

/** Find where `id` lives. Returns `null` if not present anywhere in the tree. */
export function findParent(
  root: BlockNode[],
  id: string,
  parentId: string | null = null,
): NodeLocation | null {
  const index = root.findIndex((n) => n.id === id);
  if (index !== -1) return { siblings: root, parentId, index };
  for (const node of root) {
    if (node.type === 'container') {
      const found = findParent(node.children, id, node.id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * True when `ancestorId` is `nodeId` itself or one of its descendants — used to
 * forbid dropping a container into its own subtree (which would orphan it).
 */
export function isSelfOrDescendant(
  root: BlockNode[],
  nodeId: string,
  ancestorId: string,
): boolean {
  if (nodeId === ancestorId) return true;
  const node = findById(root, nodeId);
  if (!node || node.type !== 'container') return false;
  return Boolean(findById(node.children, ancestorId));
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

/**
 * Insert `node` as a child of the container identified by `containerId`.
 * `index = undefined` appends. No-op (returns input) if the container is not
 * found. Immutable.
 */
export function insertIntoContainer(
  root: BlockNode[],
  containerId: string,
  node: BlockNode,
  index?: number,
): BlockNode[] {
  return root.map((n) => {
    if (n.id === containerId && n.type === 'container') {
      const at = index ?? n.children.length;
      return { ...n, children: insertAt(n.children, at, node) };
    }
    if (n.type === 'container') {
      return { ...n, children: insertIntoContainer(n.children, containerId, node, index) };
    }
    return n;
  });
}

export interface DropTarget {
  parentId: string | null;
  index: number;
}

/**
 * Resolve a drag-and-drop `over` target into a parent (`null` = root) and an
 * insert index.
 *
 * - the canvas droppable → end of root
 * - a container's droppable slot (`<prefix><id>`) → end of that container
 * - a container block itself → nest at the end of it (so dropping an existing
 *   block anywhere on a container nests it, since dnd-kit resolves `over` to
 *   the container's sortable rather than its inner slot)
 * - any other block → that block's position (insert before it)
 *
 * Returns `null` when the target can't be resolved (the drop is ignored).
 */
export function resolveDropTarget(
  root: BlockNode[],
  overId: string,
  activeId: string,
  opts: { canvasId: string; containerPrefix: string },
): DropTarget | null {
  if (overId === opts.canvasId) {
    return { parentId: null, index: root.length };
  }
  if (overId.startsWith(opts.containerPrefix)) {
    const containerId = overId.slice(opts.containerPrefix.length);
    const node = findById(root, containerId);
    const len = node && node.type === 'container' ? node.children.length : 0;
    return { parentId: containerId, index: len };
  }
  const overNode = findById(root, overId);
  if (overNode?.type === 'container' && overId !== activeId) {
    return { parentId: overId, index: overNode.children.length };
  }
  const loc = findParent(root, overId);
  if (!loc) return null;
  return { parentId: loc.parentId, index: loc.index };
}

/**
 * Move an existing node to a new parent (or the root) at a given index.
 * `toParentId = null` targets the root array. Guards against moving a
 * container into its own subtree (returns the tree unchanged in that case).
 * Immutable.
 */
export function moveAcrossParents(
  root: BlockNode[],
  fromId: string,
  toParentId: string | null,
  toIndex: number,
): BlockNode[] {
  if (toParentId !== null && isSelfOrDescendant(root, fromId, toParentId)) {
    return root;
  }
  const node = findById(root, fromId);
  if (!node) return root;

  const detached = removeById(root, fromId);
  if (toParentId === null) {
    return insertAt(detached, toIndex, node);
  }
  return insertIntoContainer(detached, toParentId, node, toIndex);
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
    props: { layout: { direction: 'column' } },
    children: [],
  };
}

export function makeSlide(): Slide {
  return {
    id: crypto.randomUUID(),
    image: { desktop: '' },
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
