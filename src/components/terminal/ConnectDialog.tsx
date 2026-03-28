import { useState } from "react";
import { X } from "lucide-react";
import { usePortStore } from "../../stores/usePortStore";
import type { SerialPortConfig } from "../../types";

interface Props {
  defaultPath?: string;
  onConnect: (config: SerialPortConfig, label?: string) => void;
  onClose: () => void;
}

const BAUD_RATES = [110, 300, 600, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];

const SEL = "bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-blue-500";
const SEL_SM = "bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 outline-none focus:border-blue-500";
const INPUT = `${SEL} font-mono`;

export function ConnectDialog({ defaultPath, onConnect, onClose }: Props) {
  const availablePorts = usePortStore((s) => s.availablePorts);
  const [label, setLabel] = useState("");
  const [path, setPath] = useState(defaultPath ?? (availablePorts[0]?.path ?? ""));
  const [baudRate, setBaudRate] = useState(115200);
  const [dataBits, setDataBits] = useState<5 | 6 | 7 | 8>(8);
  const [stopBits, setStopBits] = useState<1 | 2>(1);
  const [parity, setParity] = useState<"none" | "odd" | "even">("none");
  const [flowControl, setFlowControl] = useState<"none" | "software" | "hardware">("none");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!path.trim()) return;
    onConnect(
      { path: path.trim(), baudRate, dataBits, stopBits, parity, flowControl, timeout: 50 },
      label.trim() || undefined
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-80 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-200">Open Serial Port</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Name (optional)</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Arduino, GPS Module..."
              className={INPUT}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Port</span>
            {availablePorts.length > 0 ? (
              <select value={path} onChange={(e) => setPath(e.target.value)} className={SEL}>
                {availablePorts.map((p) => <option key={p.path} value={p.path}>{p.path}</option>)}
                <option value="">Custom...</option>
              </select>
            ) : (
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/dev/ttyUSB0 or COM3"
                className={INPUT}
              />
            )}
            {availablePorts.length > 0 && path === "" && (
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/dev/ttyUSB0"
                className={`${INPUT} mt-1`}
              />
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Baud Rate</span>
            <select value={baudRate} onChange={(e) => setBaudRate(Number(e.target.value))} className={SEL}>
              {BAUD_RATES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Data Bits</span>
              <select value={dataBits} onChange={(e) => setDataBits(Number(e.target.value) as 5 | 6 | 7 | 8)} className={SEL_SM}>
                {[5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Stop Bits</span>
              <select value={stopBits} onChange={(e) => setStopBits(Number(e.target.value) as 1 | 2)} className={SEL_SM}>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Parity</span>
              <select value={parity} onChange={(e) => setParity(e.target.value as "none" | "odd" | "even")} className={SEL_SM}>
                <option value="none">None</option>
                <option value="odd">Odd</option>
                <option value="even">Even</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Flow Control</span>
            <select value={flowControl} onChange={(e) => setFlowControl(e.target.value as "none" | "software" | "hardware")} className={SEL}>
              <option value="none">None</option>
              <option value="software">XON/XOFF (Software)</option>
              <option value="hardware">RTS/CTS (Hardware)</option>
            </select>
          </label>

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-1.5 text-sm text-gray-400 border border-gray-700 rounded hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50"
              disabled={!path.trim()}
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
