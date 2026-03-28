import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { PortDataLogEntry } from "../types";
import { usePortStore } from "./usePortStore";
import { useSettingsStore } from "./useSettingsStore";
import { useLogStore } from "./useLogStore";
import { buildLogPath } from "../utils/logPath";

const MAX_ENTRIES = 200;
const decoder = new TextDecoder("utf-8", { fatal: false });

interface PortLogStore {
  logs: Record<string, PortDataLogEntry[]>;
  fileLogging: Record<string, boolean>;
  addData: (portPath: string, data: Uint8Array) => void;
  clearLog: (portPath: string) => void;
  toggleFileLogging: (portPath: string) => void;
}

export const usePortLogStore = create<PortLogStore>()((set, get) => ({
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

  toggleFileLogging: (portPath) => {
    const newEnabled = !get().fileLogging[portPath];
    set((s) => ({ fileLogging: { ...s.fileLogging, [portPath]: newEnabled } }));

    // Update backend log path for all panes connected to this port
    const { logDirectory } = useSettingsStore.getState();
    const logPath = newEnabled && logDirectory ? buildLogPath(logDirectory, portPath) : null;
    const connections = usePortStore.getState().connections;
    for (const [paneId, conn] of Object.entries(connections)) {
      if (conn.portPath === portPath && conn.status === "connected") {
        invoke("set_log_path", { paneId, logPath }).catch((e) => {
          useLogStore.getState().addEntry({ level: "warn", paneId, message: `Log path update failed: ${e}` });
        });
      }
    }
  },
}));
