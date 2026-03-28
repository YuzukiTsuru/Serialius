import { create } from "zustand";
import type { PortInfo, ConnectionState, ConnectionStatus, SerialPortConfig } from "../types";

interface PendingConnect {
  tabId: string;
  port: PortInfo;
  config: SerialPortConfig;
  label?: string;
}

interface PortStore {
  availablePorts: PortInfo[];
  connections: Record<string, ConnectionState>;
  isScanning: boolean;
  pendingConnect: PendingConnect | null;
  setAvailablePorts: (ports: PortInfo[]) => void;
  setIsScanning: (v: boolean) => void;
  setConnectionStatus: (paneId: string, status: ConnectionStatus, errorMessage?: string) => void;
  setConnection: (paneId: string, state: ConnectionState) => void;
  removeConnection: (paneId: string) => void;
  setPendingConnect: (v: PendingConnect) => void;
  clearPendingConnect: () => void;
}

export const usePortStore = create<PortStore>()((set) => ({
  availablePorts: [],
  connections: {},
  isScanning: false,
  pendingConnect: null,
  setAvailablePorts: (ports) => set({ availablePorts: ports }),
  setIsScanning: (v) => set({ isScanning: v }),
  setConnectionStatus: (paneId, status, errorMessage) =>
    set((s) => {
      if (!s.connections[paneId]) return s;
      return {
        connections: {
          ...s.connections,
          [paneId]: { ...s.connections[paneId], status, errorMessage },
        },
      };
    }),
  setConnection: (paneId, state) =>
    set((s) => ({ connections: { ...s.connections, [paneId]: state } })),
  removeConnection: (paneId) =>
    set((s) => {
      const { [paneId]: _removed, ...rest } = s.connections;
      return { connections: rest };
    }),
  setPendingConnect: (v) => set({ pendingConnect: v }),
  clearPendingConnect: () => set({ pendingConnect: null }),
}));
