import { usePortStore } from "../../stores/usePortStore";
import { PortListItem } from "./PortListItem";
import type { PortInfo } from "../../types";

interface Props {
  onConnect: (port: PortInfo) => void;
  onNeedLogDir: () => void;
}

export function PortList({ onConnect, onNeedLogDir }: Props) {
  const availablePorts = usePortStore((s) => s.availablePorts);

  if (availablePorts.length === 0) {
    return <p className="text-xs text-gray-600 px-3 py-2">No ports found</p>;
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {availablePorts.map((port) => (
        <PortListItem key={port.path} port={port} onConnect={onConnect} onNeedLogDir={onNeedLogDir} />
      ))}
    </div>
  );
}
