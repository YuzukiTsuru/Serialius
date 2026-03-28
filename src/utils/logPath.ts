export function buildLogPath(dir: string, portPath: string): string {
  const portName = portPath.split("/").pop()?.replace(/\\/g, "") ?? portPath;
  const date = new Date().toISOString().slice(0, 10);
  const sep = dir.endsWith("/") || dir.endsWith("\\") ? "" : "/";
  return `${dir}${sep}${portName}_${date}.log`;
}
