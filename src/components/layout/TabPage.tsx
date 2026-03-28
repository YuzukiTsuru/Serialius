import { memo } from "react";
import { PaneLayout } from "../terminal/PaneLayout";

export const TabPage = memo(function TabPage({ tabId }: { tabId: string }) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <PaneLayout tabId={tabId} />
    </div>
  );
});
