import { useState, useEffect, useCallback } from "react";
import { X, Copy, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { modalVariants, modalTransition, buttonAnimations } from "../../lib/animations";

interface Props {
  open: boolean;
  onClose: () => void;
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  const values = crypto.getRandomValues(new Uint8Array(32));
  for (const v of values) key += chars[v % chars.length];
  return key;
}

export function McpSettingsModal({ open, onClose }: Props) {
  const mcpPort = useSettingsStore((s) => s.mcpPort);
  const mcpApiKey = useSettingsStore((s) => s.mcpApiKey);
  const update = useSettingsStore((s) => s.update);

  const [port, setPort] = useState(9315);
  const [apiKey, setApiKey] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPort(mcpPort);
      setApiKey(mcpApiKey);
      setError("");
      invoke<boolean>("get_mcp_status").then(setRunning).catch(() => {});
    }
  }, [open, mcpPort, mcpApiKey]);

  const handleToggle = useCallback(async () => {
    setError("");
    if (running) {
      await invoke("stop_mcp_server");
      setRunning(false);
      update({ mcpEnabled: false });
    } else {
      try {
        await invoke("start_mcp_server", { port, apiKey });
        setRunning(true);
        update({ mcpPort: port, mcpApiKey: apiKey, mcpEnabled: true });
      } catch (e) {
        setError(String(e));
      }
    }
  }, [running, port, apiKey, update]);

  const handleSave = () => {
    update({ mcpPort: port, mcpApiKey: apiKey });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mcp-modal"
          variants={modalVariants.backdrop}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={modalTransition.backdrop}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            variants={modalVariants.content}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={modalTransition.content}
            className="bg-gray-900 rounded-lg w-96 border border-gray-700"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-sm font-semibold text-gray-200">MCP Server</span>
              <motion.button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300"
                {...buttonAnimations.icon}
              >
                <X size={16} />
              </motion.button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">Status</span>
                <div className="flex items-center gap-2">
                  <motion.span
                    className={`inline-block w-2 h-2 rounded-full ${running ? "bg-green-500" : "bg-gray-600"}`}
                    animate={{ scale: running ? [1, 1.2, 1] : 1 }}
                    transition={{ repeat: running ? Infinity : 0, duration: 1 }}
                  />
                  <span className="text-xs text-gray-400">{running ? "Running" : "Stopped"}</span>
                  <motion.button
                    onClick={handleToggle}
                    {...buttonAnimations.pill}
                    className={`px-2.5 py-1 text-xs rounded ${
                      running
                        ? "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-800"
                        : "bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-800"
                    }`}
                  >
                    {running ? "Stop" : "Start"}
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[11px] text-red-400 bg-red-900/20 rounded px-2 py-1"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 uppercase tracking-wider">Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  disabled={running}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 uppercase tracking-wider">API Key</label>
                <div className="flex gap-1">
                  <input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={running}
                    placeholder="Leave empty for no auth"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                  <motion.button
                    onClick={() => setApiKey(generateApiKey())}
                    disabled={running}
                    className="px-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-50"
                    title="Generate key"
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <RefreshCw size={13} />
                  </motion.button>
                  <motion.button
                    onClick={() => navigator.clipboard.writeText(apiKey)}
                    className="px-1.5 text-gray-500 hover:text-gray-300"
                    title="Copy key"
                    {...buttonAnimations.icon}
                  >
                    <Copy size={13} />
                  </motion.button>
                </div>
              </div>

              <AnimatePresence>
                {running && (
                  <motion.div
                    variants={modalVariants.slideDown}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={modalTransition.slideDown}
                    className="flex flex-col gap-1"
                  >
                    <label className="text-[11px] text-gray-500 uppercase tracking-wider">Endpoint</label>
                    <div className="flex items-center gap-1">
                      <code className="flex-1 text-[11px] text-blue-400 bg-gray-800 rounded px-2 py-1.5 font-mono">
                        http://127.0.0.1:{port}/mcp
                      </code>
                      <motion.button
                        onClick={() => navigator.clipboard.writeText(`http://127.0.0.1:${port}/mcp`)}
                        className="px-1.5 text-gray-500 hover:text-gray-300"
                        title="Copy URL"
                        {...buttonAnimations.icon}
                      >
                        <Copy size={13} />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-800">
              <motion.button
                onClick={onClose}
                {...buttonAnimations.pill}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 rounded border border-gray-700 hover:border-gray-500"
              >
                Close
              </motion.button>
              <motion.button
                onClick={handleSave}
                {...buttonAnimations.pill}
                className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
              >
                Save
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
