import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "../sidebar/Sidebar";
import { MainArea } from "./MainArea";
import { ResizeHandle } from "./ResizeHandle";
import { SerialManagerModal } from "../terminal/SerialManagerModal";
import { useTabStore } from "../../stores/useTabStore";
import { usePaneStore } from "../../stores/usePaneStore";
import { usePortStore } from "../../stores/usePortStore";
import type { PortInfo, SerialPortConfig } from "../../types";

export function AppShell() {
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerPort, setManagerPort] = useState<PortInfo | undefined>();
  const addTab = useTabStore((s) => s.addTab);
  const initTab = usePaneStore((s) => s.initTab);
  const setPendingConnect = usePortStore((s) => s.setPendingConnect);

  const openManager = (port?: PortInfo) => {
    setManagerPort(port);
    setManagerOpen(true);
  };

  const handleManagerConnect = (port: PortInfo, config: SerialPortConfig, label?: string) => {
    const tabId = addTab();
    initTab(tabId);
    setPendingConnect({ tabId, port, config, label });
    setManagerOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-gray-100">
      <Sidebar onConnectPort={openManager} />
      <ResizeHandle />
      <MainArea onAddTab={openManager} />
      <AnimatePresence>
        {managerOpen && (
          <SerialManagerModal
            open={managerOpen}
            initialPort={managerPort}
            onClose={() => setManagerOpen(false)}
            onConnect={handleManagerConnect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
