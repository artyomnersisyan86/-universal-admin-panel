import { useCallback, useMemo, useState } from 'react';
import type { BlockNode, LayoutTree } from '@shared/types';
import { LAYOUT_VERSION } from '@shared/types';
import {
  emptyLayout,
  findById,
  insertAt,
  moveById,
  removeById,
  updateById,
} from './blockTree';

export interface BlockTreeApi {
  layout: LayoutTree;
  reset: (next: LayoutTree) => void;
  append: (node: BlockNode) => void;
  remove: (id: string) => void;
  update: (id: string, patch: (node: BlockNode) => BlockNode) => void;
  reorder: (fromId: string, toId: string) => void;
  insertAtIndex: (index: number, node: BlockNode) => void;
  findNode: (id: string) => BlockNode | null;
}

export function useBlockTree(initial?: LayoutTree | null): BlockTreeApi {
  const [layout, setLayout] = useState<LayoutTree>(initial ?? emptyLayout());

  const reset = useCallback((next: LayoutTree) => setLayout(next), []);

  const append = useCallback((node: BlockNode) => {
    setLayout((l) => ({ version: LAYOUT_VERSION, root: [...l.root, node] }));
  }, []);

  const insertAtIndex = useCallback((index: number, node: BlockNode) => {
    setLayout((l) => ({
      version: LAYOUT_VERSION,
      root: insertAt(l.root, index, node),
    }));
  }, []);

  const remove = useCallback((id: string) => {
    setLayout((l) => ({ version: LAYOUT_VERSION, root: removeById(l.root, id) }));
  }, []);

  const update = useCallback(
    (id: string, patch: (node: BlockNode) => BlockNode) => {
      setLayout((l) => ({
        version: LAYOUT_VERSION,
        root: updateById(l.root, id, patch),
      }));
    },
    [],
  );

  const reorder = useCallback((fromId: string, toId: string) => {
    setLayout((l) => ({
      version: LAYOUT_VERSION,
      root: moveById(l.root, fromId, toId),
    }));
  }, []);

  const findNode = useCallback(
    (id: string) => findById(layout.root, id),
    [layout.root],
  );

  return useMemo(
    () => ({ layout, reset, append, remove, update, reorder, insertAtIndex, findNode }),
    [layout, reset, append, remove, update, reorder, insertAtIndex, findNode],
  );
}
