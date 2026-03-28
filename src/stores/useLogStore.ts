import { create } from "zustand";
import { nanoid } from "nanoid";
import type { LogEntry, LogLevel } from "../types";

const MAX_ENTRIES = 500;

interface LogStore {
  entries: LogEntry[];
  addEntry: (entry: { level: LogLevel; message: string; portPath?: string; paneId?: string }) => void;
  clearEntries: () => void;
}

export const useLogStore = create<LogStore>()((set) => ({
  entries: [],
  addEntry: (entry) =>
    set((state) => {
      const newEntry: LogEntry = { id: nanoid(), timestamp: Date.now(), ...entry };
      const entries = [...state.entries, newEntry];
      return { entries: entries.length > MAX_ENTRIES ? entries.slice(-MAX_ENTRIES) : entries };
    }),
  clearEntries: () => set({ entries: [] }),
}));
