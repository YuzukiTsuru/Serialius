import type { LogEntry } from "../../types";
import { clsx } from "clsx";

const levelColors: Record<string, string> = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  debug: "text-gray-500",
};

export function LogEntryRow({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString("en", { hour12: false });
  return (
    <div className="flex gap-1 text-xs leading-5 font-mono px-2 hover:bg-white/5">
      <span className="text-gray-600 shrink-0">{time}</span>
      <span className={clsx("shrink-0 uppercase", levelColors[entry.level])}>[{entry.level[0]}]</span>
      <span className="text-gray-400 truncate">{entry.message}</span>
    </div>
  );
}
