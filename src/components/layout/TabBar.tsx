import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";
import { clsx } from "clsx";
import { useTabStore } from "../../stores/useTabStore";

interface Props {
  onAddTab: () => void;
}

export function TabBar({ onAddTab }: Props) {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const removeTab = useTabStore((s) => s.removeTab);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const renameTab = useTabStore((s) => s.renameTab);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (id: string, label: string) => {
    setEditingId(id);
    setEditValue(label);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) renameTab(editingId, editValue.trim());
    setEditingId(null);
  };

  return (
    <div className="flex items-center h-9 bg-gray-950 border-b border-gray-800 overflow-x-auto shrink-0">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={clsx(
            "flex items-center gap-1.5 h-full px-3 border-r border-gray-800 cursor-pointer shrink-0 group",
            activeTabId === tab.id
              ? "bg-gray-900 text-gray-200 border-t-2 border-t-blue-500"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-900/50"
          )}
        >
          {editingId === tab.id ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
              className="text-xs bg-transparent border-none outline-none w-20 text-gray-200"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="text-xs"
              onDoubleClick={(e) => { e.stopPropagation(); startEdit(tab.id, tab.label); }}
            >
              {tab.label}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-0.5"
          >
            <X size={11} />
          </button>
        </div>
      ))}
      <button
        onClick={onAddTab}
        className="px-2.5 h-full text-gray-600 hover:text-gray-300 border-r border-gray-800 shrink-0"
        title="New connection"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
