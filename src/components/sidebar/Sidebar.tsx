import { usePortDiscovery } from "../../hooks/usePortDiscovery";
import { PortList } from "./PortList";
import { LogPanel } from "./LogPanel";
import { PortDiscoveryButton } from "./PortDiscoveryButton";
import type { PortInfo } from "../../types";

interface Props {
  onConnectPort: (port: PortInfo, paneId?: string) => void;
}

export function Sidebar({ onConnectPort }: Props) {
  const { refresh } = usePortDiscovery();

  return (
    <div
      className="flex flex-col h-full bg-gray-900 border-r border-gray-800 overflow-hidden"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ports</span>
        <PortDiscoveryButton onRefresh={refresh} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <PortList onConnect={onConnectPort} />
      </div>

      <LogPanel />
    </div>
  );
}
