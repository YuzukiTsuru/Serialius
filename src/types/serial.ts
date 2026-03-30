export const BAUD_RATES = [110, 300, 600, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600, 1000000, 1500000];

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface SerialPortConfig {
  path: string;
  baudRate: number;
  dataBits: 5 | 6 | 7 | 8;
  stopBits: 1 | 2;
  parity: "none" | "odd" | "even";
  flowControl: "none" | "software" | "hardware";
  timeout: number;
}

export interface ConnectionState {
  portPath: string;
  paneId: string;
  status: ConnectionStatus;
  config: SerialPortConfig;
  label?: string;
  errorMessage?: string;
}

export interface PortInfo {
  path: string;
  type: string;
  manufacturer?: string;
  serialNumber?: string;
  product?: string;
}

// History config (subset of SerialPortConfig without path/timeout)
export interface HistoryConfig {
  baudRate: number;
  dataBits: 5 | 6 | 7 | 8;
  stopBits: 1 | 2;
  parity: "none" | "odd" | "even";
  flowControl: "none" | "software" | "hardware";
}

export interface PortHistoryEntry {
  portPath: string;
  config: HistoryConfig;
  label?: string;
  lastUsed: number;
}

export interface LogFileEntry {
  path: string;
  name: string;
  size: number;
  modified: number;
}
