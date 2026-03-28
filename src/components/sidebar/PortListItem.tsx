import { useState, useCallback } from "react";
import { Plug, Circle, ChevronRight, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import type { PortInfo } from "../../types";
import { usePortStore } from "../../stores/usePortStore";
import { PortLogPanel } from "./PortLogPanel";

interface Props {
  port: PortInfo;
  onConnect: (port: PortInfo) => void;
  onNeedLogDir: () => void;
}

export function PortListItem({ port, onConnect, onNeedLogDir }: Props) {
  const connection = usePortStore(
    useCallback(
      (s) => Object.values(s.connections).find(
        (c) => c.portPath === port.path && c.status === "connected"
      ),
      [port.path]
    )
  );
  const isConnected = !!connection;
  const [logsOpen, setLogsOpen] = useState(false);

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 group cursor-default"
        title={port.path}
      >
        <Circle
          size={8}
          className={clsx("shrink-0", isConnected ? "fill-green-400 text-green-400" : "fill-gray-600 text-gray-600")}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-300 font-mono truncate">
            {connection?.label ?? port.path}
          </p>
          {connection?.label
            ? <p className="text-[10px] text-gray-600 truncate">{port.path}</p>
            : port.product && <p className="text-[10px] text-gray-600 truncate">{port.product}</p>
          }
        </div>
        {!isConnected && (
          <button
            onClick={() => onConnect(port)}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-400 transition-opacity"
            title="Connect"
          >
            <Plug size={13} />
          </button>
        )}
      </div>

      {isConnected && (
        <div>
          <div
            role="button"
            onClick={() => setLogsOpen((v) => !v)}
            className="flex items-center gap-1 px-3 py-1 text-[10px] text-gray-600 hover:text-gray-400 hover:bg-white/5 cursor-default"
          >
            {logsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <span>Logs</span>
          </div>
          {logsOpen && (
            <PortLogPanel portPath={port.path} onNeedLogDir={onNeedLogDir} />
          )}
        </div>
      )}
    </div>
  );
}
