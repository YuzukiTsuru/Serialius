import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryConfig, PortHistoryEntry } from "../types";

const MAX_ENTRIES = 20;

interface PortHistoryStore {
  entries: PortHistoryEntry[];
  addEntry: (portPath: string, config: HistoryConfig, label?: string) => void;
  removeEntry: (portPath: string) => void;
}

export const usePortHistoryStore = create<PortHistoryStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (portPath, config, label) =>
        set((state) => {
          const filtered = state.entries.filter((e) => e.portPath !== portPath);
          const newEntry: PortHistoryEntry = {
            portPath,
            config,
            label,
            lastUsed: Date.now(),
          };
          const updated = [newEntry, ...filtered];
          return { entries: updated.slice(0, MAX_ENTRIES) };
        }),
      removeEntry: (portPath) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.portPath !== portPath),
        })),
    }),
    { name: "serialius-port-history" }
  )
);