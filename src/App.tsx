import { useEffect } from "react";
import { useTabStore } from "./stores/useTabStore";
import { AppShell } from "./components/layout/AppShell";

function App() {
  useEffect(() => {
    useTabStore.setState({ tabs: [], activeTabId: null });
  }, []);

  return <AppShell />;
}

export default App;
