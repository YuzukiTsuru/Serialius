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
