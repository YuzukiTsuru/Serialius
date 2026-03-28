import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { TERMINAL_THEME } from "../styles/terminal-theme";
import { useSettingsStore } from "../stores/useSettingsStore";

interface Options {
  onReady?: (writeFn: (data: Uint8Array) => void) => void;
  onInput?: (data: string) => void;
}

export function useXTerm(containerRef: React.RefObject<HTMLDivElement | null>, options: Options = {}) {
  const initializedRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const { fontSize, fontFamily } = useSettingsStore();

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const terminal = new Terminal({
      theme: TERMINAL_THEME,
      fontFamily,
      fontSize,
      lineHeight: 1.2,
      cursorBlink: true,
      scrollback: 10000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());
    terminal.open(containerRef.current);

    requestAnimationFrame(() => fitAddon.fit());

    optionsRef.current.onReady?.((data) => terminal.write(data));

    const disposable = terminal.onData((data) => optionsRef.current.onInput?.(data));

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => fitAddon.fit());
    });
    observer.observe(containerRef.current!);

    return () => {
      observer.disconnect();
      disposable.dispose();
      terminal.dispose();
      initializedRef.current = false;
    };
  }, []);
}
