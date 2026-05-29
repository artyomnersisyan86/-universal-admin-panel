import { describe, expect, it } from 'vitest';
import type { BlockNode, ContainerBlock, TypographyBlock } from '@shared/types';
import {
  emptyLayout,
  findById,
  findParent,
  indexOfId,
  insertAt,
  insertIntoContainer,
  isSelfOrDescendant,
  makeContainerBlock,
  makeFieldBlock,
  makeTypographyBlock,
  moveAcrossParents,
  moveById,
  normalizeLayout,
  removeById,
  resolveDropTarget,
  toMultilingual,
  toPlainText,
  updateById,
} from './blockTree';

const DROP_OPTS = { canvasId: 'sb-canvas', containerPrefix: 'sb-droppable:' };

function typography(id: string, text = 'X'): TypographyBlock {
  return {
    id,
    type: 'typography',
    props: { variant: 'h2', text, multilingual: false },
  };
}

function container(id: string, children: BlockNode[] = []): ContainerBlock {
  return { id, type: 'container', props: {}, children };
}

describe('blockTree', () => {
  it('emptyLayout returns versioned empty tree', () => {
    expect(emptyLayout()).toEqual({ version: 1, root: [] });
  });

  describe('normalizeLayout', () => {
    it('falls back to empty layout for null/undefined', () => {
      expect(normalizeLayout(null)).toEqual({ version: 1, root: [] });
      expect(normalizeLayout(undefined)).toEqual({ version: 1, root: [] });
    });

    it('keeps a valid layout', () => {
      const t = typography('a');
      expect(normalizeLayout({ version: 1, root: [t] })).toEqual({
        version: 1,
        root: [t],
      });
    });

    it('forces version=1 even if missing', () => {
      const t = typography('a');
      expect(normalizeLayout({ root: [t] })).toEqual({ version: 1, root: [t] });
    });

    it('coerces non-array root to []', () => {
      expect(normalizeLayout({ version: 1, root: 'oops' })).toEqual({
        version: 1,
        root: [],
      });
    });
  });

  describe('findById / indexOfId', () => {
    it('finds top-level nodes', () => {
      const a = typography('a');
      const b = typography('b');
      expect(findById([a, b], 'b')).toBe(b);
      expect(indexOfId([a, b], 'b')).toBe(1);
    });

    it('recurses into containers', () => {
      const inner = typography('inner');
      const root = container('root', [inner]);
      expect(findById([root], 'inner')).toBe(inner);
    });

    it('returns null when missing', () => {
      expect(findById([typography('a')], 'missing')).toBeNull();
      expect(indexOfId([typography('a')], 'missing')).toBe(-1);
    });
  });

  describe('insertAt', () => {
    it('inserts at given index', () => {
      const a = typography('a');
      const b = typography('b');
      const c = typography('c');
      expect(insertAt([a, c], 1, b)).toEqual([a, b, c]);
    });

    it('clamps negative index to start and overflow to end', () => {
      const a = typography('a');
      const b = typography('b');
      expect(insertAt([a], -5, b)).toEqual([b, a]);
      expect(insertAt([a], 99, b)).toEqual([a, b]);
    });
  });

  describe('removeById', () => {
    it('removes top-level node', () => {
      const a = typography('a');
      const b = typography('b');
      expect(removeById([a, b], 'a')).toEqual([b]);
    });

    it('removes nested node', () => {
      const inner = typography('inner');
      const root = container('root', [inner]);
      expect(removeById([root], 'inner')).toEqual([container('root', [])]);
    });

    it('no-op when id missing', () => {
      const a = typography('a');
      expect(removeById([a], 'nope')).toEqual([a]);
    });
  });

  describe('updateById', () => {
    it('patches a top-level node', () => {
      const a = typography('a', 'old');
      const updated = updateById([a], 'a', (n) =>
        n.type === 'typography' ? { ...n, props: { ...n.props, text: 'new' } } : n,
      );
      expect((updated[0] as TypographyBlock).props.text).toBe('new');
    });

    it('patches nested node inside container', () => {
      const inner = typography('inner', 'old');
      const root = container('root', [inner]);
      const updated = updateById([root], 'inner', (n) =>
        n.type === 'typography' ? { ...n, props: { ...n.props, text: 'new' } } : n,
      );
      expect(
        ((updated[0] as ContainerBlock).children[0] as TypographyBlock).props.text,
      ).toBe('new');
    });
  });

  describe('moveById', () => {
    it('reorders two top-level nodes', () => {
      const a = typography('a');
      const b = typography('b');
      const c = typography('c');
      expect(moveById([a, b, c], 'a', 'c')).toEqual([b, c, a]);
    });

    it('returns the same array when ids are absent', () => {
      const a = typography('a');
      const b = typography('b');
      expect(moveById([a, b], 'a', 'missing')).toEqual([a, b]);
    });
  });

  describe('findParent', () => {
    it('locates a top-level node with parentId null', () => {
      const a = typography('a');
      const b = typography('b');
      expect(findParent([a, b], 'b')).toEqual({
        siblings: [a, b],
        parentId: null,
        index: 1,
      });
    });

    it('locates a nested node with its container id', () => {
      const inner = typography('inner');
      const root = container('root', [inner]);
      const loc = findParent([root], 'inner');
      expect(loc?.parentId).toBe('root');
      expect(loc?.index).toBe(0);
      expect(loc?.siblings).toBe(root.children);
    });

    it('returns null when the node is absent', () => {
      expect(findParent([typography('a')], 'missing')).toBeNull();
    });
  });

  describe('isSelfOrDescendant', () => {
    it('is true for the node itself', () => {
      const root = container('root', []);
      expect(isSelfOrDescendant([root], 'root', 'root')).toBe(true);
    });

    it('is true for a descendant', () => {
      const inner = container('inner', []);
      const root = container('root', [inner]);
      expect(isSelfOrDescendant([root], 'root', 'inner')).toBe(true);
    });

    it('is false for an unrelated node', () => {
      const root = container('root', []);
      const other = typography('other');
      expect(isSelfOrDescendant([root, other], 'root', 'other')).toBe(false);
    });
  });

  describe('insertIntoContainer', () => {
    it('appends to a container by default', () => {
      const root = container('root', [typography('a')]);
      const next = insertIntoContainer([root], 'root', typography('b'));
      const c = next[0] as ContainerBlock;
      expect(c.children.map((n) => n.id)).toEqual(['a', 'b']);
    });

    it('inserts at a given index', () => {
      const root = container('root', [typography('a'), typography('c')]);
      const next = insertIntoContainer([root], 'root', typography('b'), 1);
      const c = next[0] as ContainerBlock;
      expect(c.children.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    });

    it('targets nested containers', () => {
      const inner = container('inner', []);
      const root = container('root', [inner]);
      const next = insertIntoContainer([root], 'inner', typography('x'));
      const innerAfter = (next[0] as ContainerBlock).children[0] as ContainerBlock;
      expect(innerAfter.children.map((n) => n.id)).toEqual(['x']);
    });

    it('is a no-op when the container is absent', () => {
      const a = typography('a');
      expect(insertIntoContainer([a], 'nope', typography('b'))).toEqual([a]);
    });
  });

  describe('moveAcrossParents', () => {
    it('moves a node from root into a container', () => {
      const moved = typography('m');
      const box = container('box', []);
      const next = moveAcrossParents([moved, box], 'm', 'box', 0);
      expect(next.map((n) => n.id)).toEqual(['box']);
      expect((next[0] as ContainerBlock).children.map((n) => n.id)).toEqual(['m']);
    });

    it('moves a node out of a container to the root', () => {
      const inner = typography('inner');
      const box = container('box', [inner]);
      const next = moveAcrossParents([box], 'inner', null, 0);
      expect(next.map((n) => n.id)).toEqual(['inner', 'box']);
      expect((next[1] as ContainerBlock).children).toEqual([]);
    });

    it('moves between two containers', () => {
      const item = typography('item');
      const a = container('a', [item]);
      const b = container('b', []);
      const next = moveAcrossParents([a, b], 'item', 'b', 0);
      expect((next[0] as ContainerBlock).children).toEqual([]);
      expect((next[1] as ContainerBlock).children.map((n) => n.id)).toEqual(['item']);
    });

    it('refuses to move a container into its own subtree', () => {
      const inner = container('inner', []);
      const root = container('root', [inner]);
      const before = [root];
      expect(moveAcrossParents(before, 'root', 'inner', 0)).toBe(before);
    });

    it('is a no-op when the source is absent', () => {
      const a = typography('a');
      const box = container('box', []);
      const before = [a, box];
      expect(moveAcrossParents(before, 'missing', 'box', 0)).toBe(before);
    });
  });

  describe('resolveDropTarget', () => {
    const box = container('box', [typography('c1'), typography('c2')]);
    const root = [typography('a'), box, typography('b')];

    it('targets the end of root when over the canvas', () => {
      expect(resolveDropTarget(root, 'sb-canvas', 'x', DROP_OPTS)).toEqual({
        parentId: null,
        index: 3,
      });
    });

    it('targets the end of a container when over its droppable slot', () => {
      expect(resolveDropTarget(root, 'sb-droppable:box', 'x', DROP_OPTS)).toEqual({
        parentId: 'box',
        index: 2,
      });
    });

    it('nests into a container when dropped on the container block itself', () => {
      expect(resolveDropTarget(root, 'box', 'a', DROP_OPTS)).toEqual({
        parentId: 'box',
        index: 2,
      });
    });

    it('does not nest a container into itself — falls back to reorder', () => {
      expect(resolveDropTarget(root, 'box', 'box', DROP_OPTS)).toEqual({
        parentId: null,
        index: 1,
      });
    });

    it('targets a sibling position when over a non-container block', () => {
      expect(resolveDropTarget(root, 'b', 'a', DROP_OPTS)).toEqual({
        parentId: null,
        index: 2,
      });
    });

    it('resolves a nested block to its container position', () => {
      expect(resolveDropTarget(root, 'c2', 'a', DROP_OPTS)).toEqual({
        parentId: 'box',
        index: 1,
      });
    });

    it('returns null for an unknown target', () => {
      expect(resolveDropTarget(root, 'ghost', 'a', DROP_OPTS)).toBeNull();
    });
  });

  describe('multilingual text helpers', () => {
    it('toMultilingual lifts string into { hy, ru, en }', () => {
      expect(toMultilingual('hi')).toEqual({ hy: 'hi', ru: '', en: '' });
    });

    it('toMultilingual is a no-op for objects', () => {
      const m = { hy: 'a', ru: 'b', en: 'c' };
      expect(toMultilingual(m)).toBe(m);
    });

    it('toPlainText prefers hy, then ru, then en', () => {
      expect(toPlainText('hi')).toBe('hi');
      expect(toPlainText({ hy: 'a', ru: 'b', en: 'c' })).toBe('a');
      expect(toPlainText({ hy: '', ru: 'b', en: 'c' })).toBe('b');
      expect(toPlainText({ hy: '', ru: '', en: 'c' })).toBe('c');
      expect(toPlainText({ hy: '', ru: '', en: '' })).toBe('');
    });
  });

  describe('block factories', () => {
    it('makeTypographyBlock has h2 default and plain text', () => {
      const b = makeTypographyBlock();
      expect(b.type).toBe('typography');
      expect(b.props.variant).toBe('h2');
      expect(b.props.multilingual).toBe(false);
      expect(typeof b.props.text).toBe('string');
    });

    it('makeFieldBlock embeds a FieldDef matching the block id', () => {
      const b = makeFieldBlock('text');
      expect(b.type).toBe('field');
      expect(b.props.field.id).toBe(b.id);
      expect(b.props.field.type).toBe('text');
    });

    it('makeContainerBlock starts empty', () => {
      const b = makeContainerBlock();
      if (b.type !== 'container') throw new Error('expected container');
      expect(b.children).toEqual([]);
    });
  });
});
