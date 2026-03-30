import { usePortHistoryStore } from "../../stores/usePortHistoryStore";
import { PortHistoryItem } from "./PortHistoryItem";
import type { PortInfo, SerialPortConfig } from "../../types";

interface Props {
  onConnect: (port: PortInfo, config: SerialPortConfig, label?: string) => void;
}

export function PortHistoryList({ onConnect }: Props) {
  const entries = usePortHistoryStore((s) => s.entries);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="px-3 py-1 border-t border-gray-800">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">History</span>
      </div>
      {entries.map((entry) => (
        <PortHistoryItem
          key={entry.portPath}
          entry={entry}
          onConnect={onConnect}
        />
      ))}
    </div>
  );
}