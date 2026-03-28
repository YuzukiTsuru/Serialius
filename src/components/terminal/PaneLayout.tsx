import { useCallback } from "react";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { usePaneStore } from "../../stores/usePaneStore";
import { TerminalPane } from "./TerminalPane";
import type { LayoutNode } from "../../types";

const MAX_PANES = 8;

interface LayoutRendererProps {
  node: LayoutNode;
  tabId: string;
  paneCount: number;
  onUpdateNode: (newNode: LayoutNode) => void;
  onSplit: (paneId: string, direction: "h" | "v") => void;
  onClose: (paneId: string) => void;
}

function LayoutRenderer({ node, tabId, paneCount, onUpdateNode, onSplit, onClose }: LayoutRendererProps) {
  if (node.type === "leaf") {
    return (
      <TerminalPane
        paneId={node.paneId}
        tabId={tabId}
        canSplit={paneCount < MAX_PANES}
        onSplitH={() => onSplit(node.paneId, "h")}
        onSplitV={() => onSplit(node.paneId, "v")}
        onClose={() => onClose(node.paneId)}
      />
    );
  }

  const isVertical = node.direction === "v";

  return (
    <Allotment
      vertical={isVertical}
      defaultSizes={node.sizes}
      onChange={(sizes) => {
        onUpdateNode({ ...node, sizes: sizes as number[] });
      }}
    >
      <Allotment.Pane>
        <LayoutRenderer
          node={node.children[0]}
          tabId={tabId}
          paneCount={paneCount}
          onUpdateNode={(newNode) =>
            onUpdateNode({ ...node, children: [newNode, node.children[1]] })
          }
          onSplit={onSplit}
          onClose={onClose}
        />
      </Allotment.Pane>
      <Allotment.Pane>
        <LayoutRenderer
          node={node.children[1]}
          tabId={tabId}
          paneCount={paneCount}
          onUpdateNode={(newNode) =>
            onUpdateNode({ ...node, children: [node.children[0], newNode] })
          }
          onSplit={onSplit}
          onClose={onClose}
        />
      </Allotment.Pane>
    </Allotment>
  );
}

interface Props {
  tabId: string;
}

export function PaneLayout({ tabId }: Props) {
  const tabState = usePaneStore((s) => s.tabPanes[tabId]);
  const updateLayout = usePaneStore((s) => s.updateLayout);
  const splitPane = usePaneStore((s) => s.splitPane);
  const closePane = usePaneStore((s) => s.closePane);
  // Inline selector so Zustand diffs a number, not a function reference
  const paneCount = usePaneStore(useCallback((s) => s.getPaneCount(tabId), [tabId]));

  if (!tabState) return null;

  return (
    <div className="w-full h-full overflow-hidden">
      <LayoutRenderer
        node={tabState.layout}
        tabId={tabId}
        paneCount={paneCount}
        onUpdateNode={(newNode) => updateLayout(tabId, newNode)}
        onSplit={(paneId, direction) => splitPane(tabId, paneId, direction)}
        onClose={(paneId) => closePane(tabId, paneId)}
      />
    </div>
  );
}
