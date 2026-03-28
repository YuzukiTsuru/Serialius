import { useEffect } from "react";
import { useTabStore } from "./stores/useTabStore";
import { usePaneStore } from "./stores/usePaneStore";
import { AppShell } from "./components/layout/AppShell";

function App() {
  const tabs = useTabStore((s) => s.tabs);
  const addTab = useTabStore((s) => s.addTab);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const initTab = usePaneStore((s) => s.initTab);

  useEffect(() => {
    if (tabs.length === 0) {
      const id = addTab();
      initTab(id);
    } else {
      // Ensure all persisted tabs have initialized pane state
      tabs.forEach((t) => initTab(t.id));
      if (!activeTabId || !tabs.find((t) => t.id === activeTabId)) {
        setActiveTab(tabs[0].id);
      }
    }
  }, []);

  return <AppShell />;
}

export default App;
