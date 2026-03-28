import { useState, useCallback, useRef } from "react";
import { usePortStore } from "../../stores/usePortStore";
import { usePaneStore } from "../../stores/usePaneStore";
import { useSerialPort } from "../../hooks/useSerialPort";
import { PaneHeader } from "./PaneHeader";
import { TerminalView } from "./TerminalView";
import { PaneEmptySlot } from "./PaneEmptySlot";
import { ConnectDialog } from "./ConnectDialog";

interface Props {
  paneId: string;
  tabId: string;
  canSplit: boolean;
  onSplitH: () => void;
  onSplitV: () => void;
  onClose: () => void;
}

export function TerminalPane({ paneId, tabId, canSplit, onSplitH, onSplitV, onClose }: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const writeRef = useRef<((data: Uint8Array) => void) | null>(null);
  const paneConfig = usePaneStore((s) => s.tabPanes[tabId]?.panes[paneId]);
  const connection = usePortStore((s) => s.connections[paneId]);
  const status = connection?.status ?? "disconnected";

  const handleData = useCallback((data: Uint8Array) => {
    writeRef.current?.(data);
  }, []);

  const { connect, disconnect, sendData } = useSerialPort(paneId, handleData);

  return (
    <div className="flex flex-col h-full w-full bg-[#0d1117] group overflow-hidden">
      <PaneHeader
        portPath={connection?.portPath ?? null}
        label={connection?.label}
        status={status}
        baudRate={connection?.config.baudRate}
        onDisconnect={disconnect}
        onSplitH={onSplitH}
        onSplitV={onSplitV}
        onClose={onClose}
        canSplit={canSplit}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        {status === "connected" ? (
          <TerminalView
            onReady={(fn) => { writeRef.current = fn; }}
            onInput={sendData}
          />
        ) : (
          <PaneEmptySlot onOpen={() => setShowDialog(true)} />
        )}
      </div>

      {showDialog && (
        <ConnectDialog
          defaultPath={paneConfig?.portPath ?? undefined}
          onConnect={connect}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}
