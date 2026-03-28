import { useTabStore } from "../../stores/useTabStore";
import { TabBar } from "./TabBar";
import { TabPage } from "./TabPage";

export function MainArea() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
      <TabBar />
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
