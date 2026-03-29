import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { usePortStore } from "../../stores/usePortStore";
import { buttonAnimations } from "../../lib/animations";

export function PortDiscoveryButton({ onRefresh }: { onRefresh: () => void }) {
  const isScanning = usePortStore((s) => s.isScanning);

  return (
    <motion.button
      onClick={onRefresh}
      disabled={isScanning}
      title="Refresh ports"
      className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-50"
      {...buttonAnimations.icon}
    >
      <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
    </motion.button>
  );
}
