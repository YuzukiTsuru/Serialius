import { useState } from "react";
import { Settings } from "lucide-react";
import { usePortDiscovery } from "../../hooks/usePortDiscovery";
import { PortList } from "./PortList";
import { PortDiscoveryButton } from "./PortDiscoveryButton";
import { LogSettingsModal } from "./LogSettingsModal";
import type { PortInfo } from "../../types";

interface Props {
  onConnectPort: (port: PortInfo, paneId?: string) => void;
}

export function Sidebar({ onConnectPort }: Props) {
  const { refresh } = usePortDiscovery();
  const [logSettingsOpen, setLogSettingsOpen] = useState(false);

  return (
    <div
      className="flex flex-col h-full bg-gray-900 border-r border-gray-800 overflow-hidden"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ports</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLogSettingsOpen(true)}
            className="text-gray-600 hover:text-gray-300"
            title="Log settings"
          >
            <Settings size={13} />
          </button>
          <PortDiscoveryButton onRefresh={refresh} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <PortList onConnect={onConnectPort} onNeedLogDir={() => setLogSettingsOpen(true)} />
      </div>

      <LogSettingsModal open={logSettingsOpen} onClose={() => setLogSettingsOpen(false)} />
    </div>
  );
}
