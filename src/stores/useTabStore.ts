import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Tab } from "../types";

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: () => string;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  renameTab: (id: string, label: string) => void;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      addTab: () => {
        const id = nanoid();
        const tab: Tab = { id, label: `Port ${get().tabs.length + 1}` };
        set((s) => ({ tabs: [...s.tabs, tab], activeTabId: id }));
        return id;
      },

      removeTab: (id) => {
        const { tabs, activeTabId } = get();
        if (tabs.length <= 1) return; // keep at least one tab
        const remaining = tabs.filter((t) => t.id !== id);
        const newActive =
          activeTabId === id
            ? remaining[Math.max(0, tabs.findIndex((t) => t.id === id) - 1)].id
            : activeTabId;
        set({ tabs: remaining, activeTabId: newActive });
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      renameTab: (id, label) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, label } : t)) })),
    }),
    { name: "serialius-tabs" }
  )
);
