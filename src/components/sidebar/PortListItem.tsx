import { useState, useCallback } from "react";
import { Plug, Circle, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import type { PortInfo } from "../../types";
import { usePortStore } from "../../stores/usePortStore";
import { PortLogPanel } from "./PortLogPanel";
import { modalVariants, modalTransition, buttonAnimations } from "../../lib/animations";

interface Props {
  port: PortInfo;
  onConnect: (port: PortInfo) => void;
  onNeedLogDir: () => void;
}

export function PortListItem({ port, onConnect, onNeedLogDir }: Props) {
  const connection = usePortStore(
    useCallback(
      (s) => Object.values(s.connections).find(
        (c) => c.portPath === port.path && (c.status === "connected" || c.status === "connecting")
      ),
      [port.path]
    )
  );
  const isConnected = connection?.status === "connected";
  const isConnecting = connection?.status === "connecting";
  const [logsOpen, setLogsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 group cursor-default"
        title={port.path}
      >
        <motion.div
          animate={
            isConnecting
              ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
              : {}
          }
          transition={{ repeat: isConnecting ? Infinity : 0, duration: 1 }}
        >
          <Circle
            size={8}
            className={clsx(
              "shrink-0",
              isConnecting
                ? "fill-yellow-400 text-yellow-400"
                : isConnected
                  ? "fill-green-400 text-green-400"
                  : "fill-gray-600 text-gray-600"
            )}
          />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-300 font-mono truncate">
            {connection?.label ?? port.path}
          </p>
          {connection?.label
            ? <p className="text-[10px] text-gray-600 truncate">{port.path}</p>
            : port.product && <p className="text-[10px] text-gray-600 truncate">{port.product}</p>
          }
        </div>
        {!isConnected && !isConnecting && (
          <motion.button
            onClick={() => onConnect(port)}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-400"
            title="Connect"
            {...buttonAnimations.icon}
          >
            <Plug size={13} />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isConnected && (
          <motion.div
            variants={modalVariants.slideDown}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={modalTransition.slideDown}
          >
            <motion.div
              role="button"
              onClick={() => setLogsOpen((v) => !v)}
              className="flex items-center gap-1 px-3 py-1 text-[10px] text-gray-600 hover:text-gray-400 hover:bg-white/5 cursor-default"
              whileHover={{ x: 2 }}
            >
              <motion.span
                animate={{ rotate: logsOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={10} />
              </motion.span>
              <span>Logs</span>
            </motion.div>
            <AnimatePresence>
              {logsOpen && (
                <motion.div
                  variants={modalVariants.slideDown}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={modalTransition.slideDown}
                >
                  <PortLogPanel portPath={port.path} onNeedLogDir={onNeedLogDir} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
