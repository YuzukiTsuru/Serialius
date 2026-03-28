import { useRef } from "react";
import { useXTerm } from "../../hooks/useXTerm";

interface Props {
  onReady: (write: (data: Uint8Array) => void) => void;
  onInput: (data: string) => void;
}

export function TerminalView({ onReady, onInput }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  useXTerm(containerRef, { onReady, onInput });

  return <div ref={containerRef} className="w-full h-full" />;
}
