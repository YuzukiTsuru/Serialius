import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { usePortStore } from "../../stores/usePortStore";

export function PortDiscoveryButton({ onRefresh }: { onRefresh: () => void }) {
  const isScanning = usePortStore((s) => s.isScanning);

  return (
    <motion.button
      onClick={onRefresh}
      disabled={isScanning}
      title="Refresh ports"
      className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        animate={isScanning ? { rotate: 360 } : { rotate: 0 }}
        transition={isScanning ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0 }}
      >
        <RefreshCw size={14} />
      </motion.div>
    </motion.button>
  );
}
