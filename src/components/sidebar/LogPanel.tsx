import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useLogStore } from "../../stores/useLogStore";
import { LogEntryRow } from "./LogEntry";

export function LogPanel() {
  const entries = useLogStore((s) => s.entries);
  const clearEntries = useLogStore((s) => s.clearEntries);
  const [open, setOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [entries, open]);

  return (
    <div className="flex flex-col border-t border-gray-800">
      <div
        role="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-white/5 w-full cursor-default"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="flex-1 text-left">Logs</span>
        {open && (
          <button
            onClick={(e) => { e.stopPropagation(); clearEntries(); }}
            className="hover:text-red-400 p-0.5"
            title="Clear logs"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      {open && (
        <div className="overflow-y-auto max-h-48 flex flex-col">
          {entries.length === 0 && (
            <p className="text-xs text-gray-600 px-3 py-2">No logs yet</p>
          )}
          {entries.map((e) => <LogEntryRow key={e.id} entry={e} />)}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
