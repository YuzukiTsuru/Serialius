import { useRef, useCallback } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import { usePortStore } from "../stores/usePortStore";
import { useLogStore } from "../stores/useLogStore";
import { usePortLogStore } from "../stores/usePortLogStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import type { SerialPortConfig } from "../types";

interface SerialChunk {
  data: number[];
}

const encoder = new TextEncoder();

function buildLogPath(dir: string, portPath: string): string {
  const portName = portPath.split("/").pop()?.replace(/\\/g, "") ?? portPath;
  const date = new Date().toISOString().slice(0, 10);
  const sep = dir.endsWith("/") || dir.endsWith("\\") ? "" : "/";
  return `${dir}${sep}${portName}_${date}.log`;
}

export function useSerialPort(paneId: string, onData: (data: Uint8Array) => void) {
  const channelRef = useRef<Channel<SerialChunk> | null>(null);
  const setConnection = usePortStore((s) => s.setConnection);
  const setConnectionStatus = usePortStore((s) => s.setConnectionStatus);
  const removeConnection = usePortStore((s) => s.removeConnection);
  const addEntry = useLogStore((s) => s.addEntry);

  const connect = useCallback(async (config: SerialPortConfig, label?: string) => {
    if (channelRef.current) return;

    setConnection(paneId, { portPath: config.path, paneId, status: "connecting", config, label });

    try {
      const channel = new Channel<SerialChunk>();
      channel.onmessage = ({ data }) => {
        const bytes = new Uint8Array(data);
        onData(bytes);
        const { addData, fileLogging } = usePortLogStore.getState();
        addData(config.path, bytes);
        const { logDirectory } = useSettingsStore.getState();
        if (fileLogging[config.path] && logDirectory) {
          invoke("append_log_file", { path: buildLogPath(logDirectory, config.path), data });
        }
      };

      await invoke("start_serial_read", {
        paneId,
        config: {
          path: config.path,
          baudRate: config.baudRate,
          dataBits: config.dataBits ?? 8,
          stopBits: config.stopBits ?? 1,
          parity: config.parity ?? "none",
          flowControl: config.flowControl ?? "none",
        },
        onData: channel,
      });

      channelRef.current = channel;
      setConnectionStatus(paneId, "connected");
      addEntry({ level: "info", portPath: config.path, paneId, message: `Connected at ${config.baudRate} baud` });
    } catch (e) {
      const msg = String(e);
      setConnectionStatus(paneId, "error", msg);
      addEntry({ level: "error", portPath: config.path, paneId, message: `Connect failed: ${msg}` });
    }
  }, [paneId, onData, setConnection, setConnectionStatus, addEntry]);

  const disconnect = useCallback(async () => {
    try {
      await invoke("stop_serial_read", { paneId });
      channelRef.current = null;
      addEntry({ level: "info", paneId, message: "Disconnected" });
    } catch (e) {
      addEntry({ level: "warn", paneId, message: `Disconnect error: ${e}` });
    } finally {
      removeConnection(paneId);
    }
  }, [paneId, addEntry, removeConnection]);

  const sendData = useCallback(async (text: string) => {
    if (!channelRef.current) return;
    try {
      const data = Array.from(encoder.encode(text));
      await invoke("write_serial", { paneId, data });
    } catch (e) {
      addEntry({ level: "error", paneId, message: `Write failed: ${e}` });
    }
  }, [paneId, addEntry]);

  return { connect, disconnect, sendData };
}
