import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Circle, X } from "lucide-react";
import { clsx } from "clsx";
import { usePortDiscovery } from "../../hooks/usePortDiscovery";
import { usePortStore } from "../../stores/usePortStore";
import type { PortInfo, SerialPortConfig } from "../../types";

interface Props {
  open: boolean;
  initialPort?: PortInfo;
  onClose: () => void;
  onConnect: (port: PortInfo, config: SerialPortConfig, label?: string) => void;
}

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];

const SEL = "w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500";

export function SerialManagerModal({ open, initialPort, onClose, onConnect }: Props) {
  const { refresh } = usePortDiscovery();
  const ports = usePortStore((s) => s.availablePorts);
  const isScanning = usePortStore((s) => s.isScanning);
  const connections = usePortStore((s) => s.connections);

  const [portPath, setPortPath] = useState("");
  const [name, setName] = useState("");
  const [baudRate, setBaudRate] = useState(115200);
  const [dataBits, setDataBits] = useState<5 | 6 | 7 | 8>(8);
  const [stopBits, setStopBits] = useState<1 | 2>(1);
  const [parity, setParity] = useState<"none" | "odd" | "even">("none");
  const [flowControl, setFlowControl] = useState<"none" | "software" | "hardware">("none");

  useEffect(() => {
    if (open) {
      setPortPath(initialPort?.path ?? "");
      setName("");
      setBaudRate(115200);
      setDataBits(8);
      setStopBits(1);
      setParity("none");
      setFlowControl("none");
    }
  }, [open, initialPort]);

  const connectedPaths = new Set(
    Object.values(connections).filter((c) => c.status === "connected").map((c) => c.portPath)
  );

  const handleConnect = () => {
    const path = portPath.trim();
    if (!path) return;
    const port = ports.find((p) => p.path === path) ?? { path, type: "Unknown" };
    const config: SerialPortConfig = { path, baudRate, dataBits, stopBits, parity, flowControl, timeout: 50 };
    onConnect(port, config, name.trim() || undefined);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-gray-900 rounded-lg w-[700px] flex flex-col overflow-hidden border border-gray-700 max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-sm font-semibold text-gray-200">New Serial Connection</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-52 border-r border-gray-800 flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ports</span>
              <button
                onClick={refresh}
                disabled={isScanning}
                className="text-gray-500 hover:text-gray-300 disabled:opacity-40"
                title="Refresh"
              >
                <RefreshCw size={12} className={isScanning ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {ports.length === 0 ? (
                <p className="text-xs text-gray-600 px-3 py-4 text-center">No ports found</p>
              ) : (
                ports.map((port) => (
                  <button
                    key={port.path}
                    onClick={() => setPortPath(port.path)}
                    className={clsx(
                      "w-full text-left px-3 py-2 flex items-start gap-2",
                      portPath === port.path
                        ? "bg-blue-600/20 ring-1 ring-inset ring-blue-500/50"
                        : "hover:bg-white/5"
                    )}
                  >
                    <Circle
                      size={7}
                      className={clsx(
                        "mt-1 shrink-0",
                        connectedPaths.has(port.path)
                          ? "fill-green-400 text-green-400"
                          : "fill-gray-600 text-gray-600"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-gray-200 truncate">{port.path}</p>
                      {port.product && (
                        <p className="text-[10px] text-gray-500 truncate">{port.product}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-500 uppercase tracking-wider">Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Connection label"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-500 uppercase tracking-wider">Port Path</label>
              <input
                value={portPath}
                onChange={(e) => setPortPath(e.target.value)}
                placeholder="/dev/tty.usbserial-0001"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 uppercase tracking-wider">Baud Rate</label>
                <select value={baudRate} onChange={(e) => setBaudRate(Number(e.target.value))} className={SEL}>
                  {BAUD_RATES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 uppercase tracking-wider">Data Bits</label>
                <select value={dataBits} onChange={(e) => setDataBits(Number(e.target.value) as 5 | 6 | 7 | 8)} className={SEL}>
                  {[5, 6, 7, 8].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 uppercase tracking-wider">Stop Bits</label>
                <select value={stopBits} onChange={(e) => setStopBits(Number(e.target.value) as 1 | 2)} className={SEL}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 uppercase tracking-wider">Parity</label>
                <select value={parity} onChange={(e) => setParity(e.target.value as "none" | "odd" | "even")} className={SEL}>
                  <option value="none">None</option>
                  <option value="odd">Odd</option>
                  <option value="even">Even</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[11px] text-gray-500 uppercase tracking-wider">Flow Control</label>
                <select value={flowControl} onChange={(e) => setFlowControl(e.target.value as "none" | "software" | "hardware")} className={SEL}>
                  <option value="none">None</option>
                  <option value="software">Software (XON/XOFF)</option>
                  <option value="hardware">Hardware (RTS/CTS)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 rounded border border-gray-700 hover:border-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={!portPath.trim()}
            className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
