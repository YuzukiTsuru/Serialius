# Serialius — CLAUDE.md

Termius-style serial port terminal desktop app. Tauri v2 + React 19 + TypeScript.

## Stack

- Tailwind CSS v4 via `@tailwindcss/vite` (no config file, no postcss.config)
- xterm.js v6 (`@xterm/xterm`) — requires `convertEol: true`
- allotment — VSCode-style split panels, binary tree layout model
- Zustand v5 with selective `persist`
- lucide-react, clsx, nanoid

## Serial Backend

Custom Rust commands in `src-tauri/src/commands.rs` — do NOT use `tauri-plugin-serialplugin` JS API.

Commands: `list_ports`, `start_serial_read`, `stop_serial_read`, `write_serial`

`start_serial_read` takes a Tauri `Channel<SerialChunk>` for high-throughput reads. Two `spawn_blocking` threads: one reads → Channel, one drains mpsc → write port.

**Never hold `AppState.ports` Mutex during `serialport::open()`** — check, release, open, re-acquire with Entry API.

Port read timeout: 50ms.

## Frontend Patterns

- `SerialPort` instances live in `useRef` inside `useSerialPort`, never in Zustand
- `useLogStore` — NO persist (high-frequency writes during serial I/O)
- `usePortStore` — NO persist (runtime state)
- Inactive tabs rendered with `display: none` to preserve xterm state
- `TextEncoder` singleton at module scope in `useSerialPort.ts`
- Zustand selectors must return **values**, not functions — use `useCallback((s) => s.fn(arg), [arg])`
- `PortListItem` uses scoped selector returning `ConnectionState | undefined` — not the full connections map

## UX Rules

- **Fullscreen, no scrollbars**: `html/body/#root { overflow: hidden; overscroll-behavior: none; touch-action: none }` — see `globals.css`
- **No two-finger pan**: `document.addEventListener("wheel", e.preventDefault, { passive: false })` in `main.tsx`
- Max 8 panes per tab
- Custom connection labels: stored in `ConnectionState.label`, shown in PaneHeader + PortListItem

## Capabilities

`src-tauri/capabilities/default.json`: `core:default`, `opener:default` only.
