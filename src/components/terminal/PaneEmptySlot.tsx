import { MonitorPlay } from "lucide-react";

interface Props {
  onOpen: () => void;
}

export function PaneEmptySlot({ onOpen }: Props) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-800 rounded cursor-pointer hover:border-gray-600 hover:bg-white/[0.02] transition-colors"
      onClick={onOpen}
    >
      <MonitorPlay size={32} className="text-gray-700" />
      <span className="text-xs text-gray-600">Open Serial Port</span>
    </div>
  );
}
