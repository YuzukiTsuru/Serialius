import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "../../stores/useSettingsStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LogSettingsModal({ open, onClose }: Props) {
  const logDirectory = useSettingsStore((s) => s.logDirectory);
  const update = useSettingsStore((s) => s.update);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue(logDirectory);
  }, [open, logDirectory]);

  const handleSave = () => {
    update({ logDirectory: value.trim() });
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-gray-900 rounded-lg w-96 border border-gray-700"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-semibold text-gray-200">Log Settings</span>
            <motion.button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} />
            </motion.button>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-500 uppercase tracking-wider">Log Directory</label>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="/Users/me/serial-logs"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
              />
              <p className="text-[10px] text-gray-600">
                Log files are saved as <span className="font-mono">{"{portName}_{date}.log"}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-800">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 rounded border border-gray-700 hover:border-gray-500"
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleSave}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Save
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
