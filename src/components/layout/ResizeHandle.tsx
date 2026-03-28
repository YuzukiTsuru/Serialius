import { useRef, useCallback } from "react";

export function ResizeHandle() {
  const isDragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const width = Math.max(160, Math.min(400, e.clientX));
      document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
    };

    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  return (
    <div
      onMouseDown={onMouseDown}
      className="w-1 bg-gray-800 hover:bg-blue-500/50 cursor-col-resize shrink-0 transition-colors"
    />
  );
}
