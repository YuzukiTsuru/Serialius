import { Sidebar } from "../sidebar/Sidebar";
import { MainArea } from "./MainArea";
import { ResizeHandle } from "./ResizeHandle";

export function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-gray-100">
      <Sidebar onConnectPort={() => {}} />
      <ResizeHandle />
      <MainArea />
    </div>
  );
}
