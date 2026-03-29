import { usePortStore } from "../../stores/usePortStore";
import { PortListItem } from "./PortListItem";
import type { PortInfo } from "../../types";

interface Props {
  onConnect: (port: PortInfo) => void;
  onNeedLogDir: () => void;
}

export function PortList({ onConnect, onNeedLogDir }: Props) {
  const availablePorts = usePortStore((s) => s.availablePorts);
  const connections = usePortStore((s) => s.connections);

  // Filter out connected/connecting ports
  const disconnectedPorts = availablePorts.filter((port) => {
    const connection = Object.values(connections).find(
      (c) => c.portPath === port.path && (c.status === "connected" || c.status === "connecting")
    );
    return !connection;
  });

  if (disconnectedPorts.length === 0) {
    return <p className="text-xs text-gray-600 px-3 py-2">No ports available</p>;
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {disconnectedPorts.map((port) => (
        <PortListItem key={port.path} port={port} onConnect={onConnect} onNeedLogDir={onNeedLogDir} />
      ))}
    </div>
  );
}
