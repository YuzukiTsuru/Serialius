import { create } from "zustand";
import type { PortDataLogEntry } from "../types";

const MAX_ENTRIES = 200;
const decoder = new TextDecoder("utf-8", { fatal: false });

interface PortLogStore {
  logs: Record<string, PortDataLogEntry[]>;
  fileLogging: Record<string, boolean>;
  addData: (portPath: string, data: Uint8Array) => void;
  clearLog: (portPath: string) => void;
  toggleFileLogging: (portPath: string) => void;
}

export const usePortLogStore = create<PortLogStore>()((set) => ({
  logs: {},
  fileLogging: {},

  addData: (portPath, data) => {
    const text = decoder.decode(data).replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ".");
    const entry: PortDataLogEntry = { timestamp: Date.now(), text };
    set((s) => {
      const prev = s.logs[portPath] ?? [];
      const next = prev.length >= MAX_ENTRIES ? [...prev.slice(-(MAX_ENTRIES - 1)), entry] : [...prev, entry];
      return { logs: { ...s.logs, [portPath]: next } };
    });
  },

  clearLog: (portPath) =>
    set((s) => ({ logs: { ...s.logs, [portPath]: [] } })),

  toggleFileLogging: (portPath) =>
    set((s) => ({ fileLogging: { ...s.fileLogging, [portPath]: !s.fileLogging[portPath] } })),
}));
