import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePortStore } from "../stores/usePortStore";
import { useLogStore } from "../stores/useLogStore";
import type { PortInfo } from "../types";

interface PortInfoResponse {
  path: string;
  product?: string;
  manufacturer?: string;
  serialNumber?: string;
}

export function usePortDiscovery() {
  const setAvailablePorts = usePortStore((s) => s.setAvailablePorts);
  const setIsScanning = usePortStore((s) => s.setIsScanning);
  const addEntry = useLogStore((s) => s.addEntry);

  const refresh = useCallback(async () => {
    setIsScanning(true);
    try {
      const result = await invoke<PortInfoResponse[]>("list_ports");
      const ports: PortInfo[] = result.map((p) => ({
        path: p.path,
        type: "USB",
        manufacturer: p.manufacturer,
        serialNumber: p.serialNumber,
        product: p.product,
      }));
      setAvailablePorts(ports);
    } catch (e) {
      addEntry({ level: "error", message: `Port scan failed: ${e}` });
    } finally {
      setIsScanning(false);
    }
  }, [setAvailablePorts, setIsScanning, addEntry]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { refresh };
}
