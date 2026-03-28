import type { SerialPortConfig } from "./serial";

export interface PaneConfig {
  id: string;
  label: string;
  portPath: string | null;
  serialConfig: Partial<SerialPortConfig>;
}

export interface LeafNode {
  type: "leaf";
  paneId: string;
}

export interface SplitNode {
  type: "split";
  direction: "h" | "v";
  sizes: number[];
  children: [LayoutNode, LayoutNode];
}

export type LayoutNode = LeafNode | SplitNode;
