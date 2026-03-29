import { clsx } from "clsx";
import { motion } from "framer-motion";
import { X, SplitSquareHorizontal, SplitSquareVertical, Settings, Circle } from "lucide-react";
import type { ConnectionStatus } from "../../types";

interface Props {
  portPath: string | null;
  label?: string;
  status: ConnectionStatus;
  baudRate?: number;
  onDisconnect: () => void;
  onSplitH: () => void;
  onSplitV: () => void;
  onClose: () => void;
  canSplit: boolean;
}

const statusDot: Record<ConnectionStatus, string> = {
  disconnected: "fill-gray-600 text-gray-600",
  connecting: "fill-yellow-400 text-yellow-400",
  connected: "fill-green-400 text-green-400",
  error: "fill-red-400 text-red-400",
};

export function PaneHeader({ portPath, label, status, baudRate, onDisconnect, onSplitH, onSplitV, onClose, canSplit }: Props) {
  const displayName = label ?? portPath ?? "Not connected";
  const subtitle = label && portPath ? portPath : null;

  return (
    <div className="flex items-center h-8 px-2 gap-1.5 bg-gray-850 border-b border-gray-800 shrink-0 select-none">
      <motion.div
        animate={
          status === "connecting"
            ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
            : status === "error"
              ? { scale: [1, 1.2, 1] }
              : {}
        }
        transition={{ repeat: status === "connecting" || status === "error" ? Infinity : 0, duration: 1 }}
      >
        <Circle size={8} className={clsx("shrink-0", statusDot[status])} />
      </motion.div>
      <span className="flex-1 text-xs font-mono text-gray-300 truncate">
        {displayName}
        {subtitle && <span className="text-gray-600 ml-1">{subtitle}</span>}
        {baudRate && status === "connected" && <span className="text-gray-600 ml-1">{baudRate}</span>}
      </span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
        {canSplit && (
          <>
            <motion.button
              onClick={onSplitH}
              title="Split horizontal"
              className="p-1 text-gray-600 hover:text-gray-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <SplitSquareHorizontal size={13} />
            </motion.button>
            <motion.button
              onClick={onSplitV}
              title="Split vertical"
              className="p-1 text-gray-600 hover:text-gray-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <SplitSquareVertical size={13} />
            </motion.button>
          </>
        )}
        {status === "connected" && (
          <motion.button
            onClick={onDisconnect}
            title="Disconnect"
            className="p-1 text-gray-600 hover:text-yellow-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings size={13} />
          </motion.button>
        )}
        <motion.button
          onClick={onClose}
          title="Close pane"
          className="p-1 text-gray-600 hover:text-red-400"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={13} />
        </motion.button>
      </div>
    </div>
  );
}
