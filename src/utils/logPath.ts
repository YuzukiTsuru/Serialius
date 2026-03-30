export function getPortName(portPath: string): string {
  return portPath.split("/").pop()?.replace(/\\/g, "") ?? portPath;
}

export function buildLogPath(dir: string, portPath: string): string {
  const portName = getPortName(portPath);
  const date = new Date().toISOString().slice(0, 10);
  const sep = dir.endsWith("/") || dir.endsWith("\\") ? "" : "/";
  return `${dir}${sep}${portName}_${date}.log`;
}
