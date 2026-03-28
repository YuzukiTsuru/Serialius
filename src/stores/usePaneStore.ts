import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { PaneConfig, LayoutNode, LeafNode, SplitNode } from "../types";

const MAX_PANES = 8;

interface TabPaneState {
  panes: Record<string, PaneConfig>;
  layout: LayoutNode;
}

function countLeaves(node: LayoutNode): number {
  if (node.type === "leaf") return 1;
  return countLeaves(node.children[0]) + countLeaves(node.children[1]);
}

function getAllLeafIds(node: LayoutNode): string[] {
  if (node.type === "leaf") return [node.paneId];
  return [...getAllLeafIds(node.children[0]), ...getAllLeafIds(node.children[1])];
}

function splitLeaf(node: LayoutNode, targetId: string, direction: "h" | "v", newPaneId: string): LayoutNode {
  if (node.type === "leaf") {
    if (node.paneId === targetId) {
      const newNode: SplitNode = {
        type: "split",
        direction,
        sizes: [50, 50],
        children: [node, { type: "leaf", paneId: newPaneId }],
      };
      return newNode;
    }
    return node;
  }
  return {
    ...node,
    children: [
      splitLeaf(node.children[0], targetId, direction, newPaneId),
      splitLeaf(node.children[1], targetId, direction, newPaneId),
    ] as [LayoutNode, LayoutNode],
  };
}

function removeLeaf(node: LayoutNode, targetId: string): LayoutNode | null {
  if (node.type === "leaf") {
    return node.paneId === targetId ? null : node;
  }
  const left = removeLeaf(node.children[0], targetId);
  const right = removeLeaf(node.children[1], targetId);
  if (left === null) return right;
  if (right === null) return left;
  return { ...node, children: [left, right] };
}

interface PaneStore {
  tabPanes: Record<string, TabPaneState>;
  getPaneCount: (tabId: string) => number;
  splitPane: (tabId: string, paneId: string, direction: "h" | "v") => string | null;
  closePane: (tabId: string, paneId: string) => void;
  updateLayout: (tabId: string, layout: LayoutNode) => void;
  updatePaneConfig: (tabId: string, paneId: string, config: Partial<PaneConfig>) => void;
  initTab: (tabId: string) => void;
  mergePanesFromTab: (srcTabId: string, dstTabId: string) => void;
}

export const usePaneStore = create<PaneStore>()(
  persist(
    (set, get) => ({
      tabPanes: {},

      getPaneCount: (tabId) => {
        const state = get().tabPanes[tabId];
        if (!state) return 0;
        return countLeaves(state.layout);
      },

      initTab: (tabId) => {
        const state = get().tabPanes[tabId];
        if (state) return;
        const paneId = nanoid();
        const pane: PaneConfig = { id: paneId, label: "Serial Port", portPath: null, serialConfig: {} };
        set((s) => ({
          tabPanes: {
            ...s.tabPanes,
            [tabId]: {
              panes: { [paneId]: pane },
              layout: { type: "leaf", paneId } as LeafNode,
            },
          },
        }));
      },

      splitPane: (tabId, paneId, direction) => {
        const state = get().tabPanes[tabId];
        if (!state) return null;
        if (countLeaves(state.layout) >= MAX_PANES) return null;
        const newPaneId = nanoid();
        const newPane: PaneConfig = { id: newPaneId, label: "Serial Port", portPath: null, serialConfig: {} };
        set((s) => ({
          tabPanes: {
            ...s.tabPanes,
            [tabId]: {
              panes: { ...state.panes, [newPaneId]: newPane },
              layout: splitLeaf(state.layout, paneId, direction, newPaneId),
            },
          },
        }));
        return newPaneId;
      },

      closePane: (tabId, paneId) => {
        const state = get().tabPanes[tabId];
        if (!state) return;
        const newLayout = removeLeaf(state.layout, paneId);
        if (!newLayout) {
          // Last pane: reset to single empty pane
          const newPaneId = nanoid();
          const newPane: PaneConfig = { id: newPaneId, label: "Serial Port", portPath: null, serialConfig: {} };
          set((s) => ({
            tabPanes: {
              ...s.tabPanes,
              [tabId]: {
                panes: { [newPaneId]: newPane },
                layout: { type: "leaf", paneId: newPaneId } as LeafNode,
              },
            },
          }));
          return;
        }
        const { [paneId]: _removed, ...remainingPanes } = state.panes;
        set((s) => ({
          tabPanes: { ...s.tabPanes, [tabId]: { panes: remainingPanes, layout: newLayout } },
        }));
      },

      updateLayout: (tabId, layout) => {
        set((s) => ({
          tabPanes: { ...s.tabPanes, [tabId]: { ...s.tabPanes[tabId], layout } },
        }));
      },

      updatePaneConfig: (tabId, paneId, config) => {
        const state = get().tabPanes[tabId];
        if (!state || !state.panes[paneId]) return;
        set((s) => ({
          tabPanes: {
            ...s.tabPanes,
            [tabId]: {
              ...state,
              panes: { ...state.panes, [paneId]: { ...state.panes[paneId], ...config } },
            },
          },
        }));
      },

      mergePanesFromTab: (srcTabId, dstTabId) => {
        const src = get().tabPanes[srcTabId];
        const dst = get().tabPanes[dstTabId];
        if (!src || !dst) return;
        const srcLeafIds = getAllLeafIds(src.layout);
        const dstCount = countLeaves(dst.layout);
        if (dstCount + srcLeafIds.length > MAX_PANES) return;

        // Append src leaves as horizontal splits on the right of dst
        let newLayout: LayoutNode = dst.layout;
        for (const leafId of srcLeafIds) {
          newLayout = {
            type: "split",
            direction: "h",
            sizes: [50, 50],
            children: [newLayout, { type: "leaf", paneId: leafId }],
          };
        }
        set((s) => ({
          tabPanes: {
            ...s.tabPanes,
            [dstTabId]: {
              panes: { ...dst.panes, ...src.panes },
              layout: newLayout,
            },
            [srcTabId]: s.tabPanes[srcTabId], // keep for cleanup by tab store
          },
        }));
      },
    }),
    { name: "serialius-panes" }
  )
);
