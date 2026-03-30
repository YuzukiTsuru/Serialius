import { useState, useEffect, useCallback, useMemo } from "react";
import { FileText, ExternalLink, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { usePortHistoryStore } from "../../stores/usePortHistoryStore";
import { getPortName } from "../../utils/logPath";
import type { LogFileEntry } from "../../types";
import { buttonAnimations } from "../../lib/animations";

interface Props {
  portPath: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function LogFileList({ portPath }: Props) {
  const logDirectory = useSettingsStore((s) => s.logDirectory);
  const removeEntry = usePortHistoryStore((s) => s.removeEntry);
  const [files, setFiles] = useState<LogFileEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const portName = useMemo(() => getPortName(portPath), [portPath]);

  const loadFiles = useCallback(async () => {
    if (!logDirectory) {
      setFiles([]);
      return;
    }
    setLoading(true);
    try {
      const result = await invoke<LogFileEntry[]>("list_log_files", {
        directory: logDirectory,
        portName,
      });
      setFiles(result);
    } catch {
      setFiles([]);
    }
    setLoading(false);
  }, [logDirectory, portName]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleOpen = async (path: string) => {
    try {
      await openUrl(`file://${path}`);
    } catch (e) {
      console.error("Could not open file:", e);
    }
  };

  const handleDeletePort = () => {
    removeEntry(portPath);
  };

  if (!logDirectory) {
    return (
      <p className="text-[10px] text-gray-600 px-3 py-2">
        Set log directory in settings to view logs
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-[10px] text-gray-500 px-3 py-2">Loading...</p>
    );
  }

  if (files.length === 0) {
    return (
      <p className="text-[10px] text-gray-600 px-3 py-2">No log files for this port</p>
    );
  }

  return (
    <div className="flex flex-col">
      {files.map((file) => (
        <div
          key={file.path}
          className="flex items-center gap-2 px-3 py-1 hover:bg-white/5 group"
        >
          <FileText size={11} className="text-gray-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 truncate">{file.name}</p>
          </div>
          <span className="text-[10px] text-gray-600 tabular-nums">{formatSize(file.size)}</span>
          <motion.button
            onClick={() => handleOpen(file.path)}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300"
            title="Open file"
            {...buttonAnimations.icon}
          >
            <ExternalLink size={11} />
          </motion.button>
        </div>
      ))}
      <div className="flex justify-end px-3 py-1 border-t border-gray-800/60">
        <motion.button
          onClick={handleDeletePort}
          className="text-[10px] text-gray-600 hover:text-red-400"
          title="Remove from history"
          {...buttonAnimations.icon}
        >
          <Trash2 size={11} />
        </motion.button>
      </div>
    </div>
  );
}