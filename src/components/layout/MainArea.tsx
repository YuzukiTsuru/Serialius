import { Plus } from "lucide-react";
import { useTabStore } from "../../stores/useTabStore";
import { TabBar } from "./TabBar";
import { TabPage } from "./TabPage";

interface Props {
  onAddTab: () => void;
}

export function MainArea({ onAddTab }: Props) {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);

  if (tabs.length === 0) {
    return (
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden items-center justify-center bg-gray-950">
        <button
          onClick={onAddTab}
          className="flex flex-col items-center gap-3 text-gray-600 hover:text-gray-400 transition-colors group"
        >
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-700 group-hover:border-gray-500 flex items-center justify-center transition-colors">
            <Plus size={24} />
          </div>
          <span className="text-sm">New Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
      <TabBar onAddTab={onAddTab} />
      <div className="flex-1 min-h-0 relative">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{ display: tab.id === activeTabId ? "flex" : "none", flexDirection: "column" }}
          >
            <TabPage tabId={tab.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
