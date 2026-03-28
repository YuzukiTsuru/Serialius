import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Settings {
  defaultBaudRate: number;
  fontSize: number;
  fontFamily: string;
}

interface SettingsStore extends Settings {
  update: (settings: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      defaultBaudRate: 115200,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
      update: (settings) => set(settings),
    }),
    { name: "serialius-settings" }
  )
);
