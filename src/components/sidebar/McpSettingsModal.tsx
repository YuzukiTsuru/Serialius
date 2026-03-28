import { useState, useEffect, useCallback } from "react";
import { X, Copy, RefreshCw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../stores/useSettingsStore";

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 rounded-lg w-96 border border-gray-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-sm font-semibold text-gray-200">MCP Server</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Status</span>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${running ? "bg-green-500" : "bg-gray-600"}`} />
              <span className="text-xs text-gray-400">{running ? "Running" : "Stopped"}</span>
              <button
                onClick={handleToggle}
                className={`px-2.5 py-1 text-xs rounded ${
                  running
                    ? "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-800"
                    : "bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-800"
                }`}
              >
                {running ? "Stop" : "Start"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-red-400 bg-red-900/20 rounded px-2 py-1">{error}</p>
          )}

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
              <button
                onClick={() => setApiKey(generateApiKey())}
                disabled={running}
                className="px-1.5 text-gray-500 hover:text-gray-300 disabled:opacity-50"
                title="Generate key"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(apiKey)}
                className="px-1.5 text-gray-500 hover:text-gray-300"
                title="Copy key"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>

          {running && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-500 uppercase tracking-wider">Endpoint</label>
              <div className="flex items-center gap-1">
                <code className="flex-1 text-[11px] text-blue-400 bg-gray-800 rounded px-2 py-1.5 font-mono">
                  http://127.0.0.1:{port}/mcp
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`http://127.0.0.1:${port}/mcp`)}
                  className="px-1.5 text-gray-500 hover:text-gray-300"
                  title="Copy URL"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 rounded border border-gray-700 hover:border-gray-500"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
