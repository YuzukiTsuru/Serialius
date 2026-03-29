import { useState } from "react";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import { PortList } from "./PortList";
import { SettingsModal } from "./SettingsModal";
import { buttonAnimations } from "../../lib/animations";
import type { PortInfo } from "../../types";

interface Props {
  onConnectPort: (port: PortInfo, paneId?: string) => void;
}

export function Sidebar({ onConnectPort }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      className="flex flex-col h-full bg-gray-900 border-r border-gray-800 overflow-hidden"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-500 tracking-wider">Serialium</span>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={() => setSettingsOpen(true)}
            className="text-gray-600 hover:text-gray-300"
            title="Settings"
            {...buttonAnimations.icon}
          >
            <Settings size={13} />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <PortList onConnect={onConnectPort} onNeedLogDir={() => setSettingsOpen(true)} />
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
