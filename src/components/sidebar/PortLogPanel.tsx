import { useEffect, useRef } from "react";
import { Circle, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { usePortLogStore } from "../../stores/usePortLogStore";
import { useSettingsStore } from "../../stores/useSettingsStore";

interface Props {
  portPath: string;
  onNeedLogDir: () => void;
}

export function PortLogPanel({ portPath, onNeedLogDir }: Props) {
  const entries = usePortLogStore((s) => s.logs[portPath] ?? []);
  const fileLogging = usePortLogStore((s) => !!s.fileLogging[portPath]);
  const toggleFileLogging = usePortLogStore((s) => s.toggleFileLogging);
  const clearLog = usePortLogStore((s) => s.clearLog);
  const logDirectory = useSettingsStore((s) => s.logDirectory);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [entries]);

  const handleToggleLogging = () => {
    if (!fileLogging && !logDirectory) {
      onNeedLogDir();
      return;
    }
    toggleFileLogging(portPath);
  };

  return (
    <div className="flex flex-col border-t border-gray-800/60">
      <div className="overflow-y-auto max-h-32">
        {entries.length === 0 ? (
          <p className="text-[10px] text-gray-600 px-3 py-2">No data yet</p>
        ) : (
          entries.map((e, i) => (
            <div key={i} className="flex gap-1.5 px-3 py-0.5 hover:bg-white/5">
              <span className="text-[10px] text-gray-600 shrink-0 tabular-nums">
                {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
              </span>
              <span className="text-[10px] font-mono text-gray-400 break-all">{e.text}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-1 px-2 py-1 border-t border-gray-800/60">
        <button
          onClick={handleToggleLogging}
          title={fileLogging ? "Stop recording to file" : "Record to file"}
          className={clsx(
            "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors",
            fileLogging
              ? "text-red-400 hover:text-red-300 bg-red-400/10"
              : "text-gray-500 hover:text-gray-300"
          )}
        >
          <Circle size={8} className={fileLogging ? "fill-red-400" : ""} />
          {fileLogging ? "Recording" : "Record"}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => clearLog(portPath)}
          className="text-gray-600 hover:text-gray-400 p-0.5"
          title="Clear log"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
