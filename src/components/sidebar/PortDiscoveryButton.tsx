import { RefreshCw } from "lucide-react";
import { usePortStore } from "../../stores/usePortStore";

export function PortDiscoveryButton({ onRefresh }: { onRefresh: () => void }) {
  const isScanning = usePortStore((s) => s.isScanning);

  return (
    <button
      onClick={onRefresh}
      disabled={isScanning}
      title="Refresh ports"
      className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-50 transition-colors"
    >
      <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
    </button>
  );
}
