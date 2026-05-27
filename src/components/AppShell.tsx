import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  const { pathname } = useLocation();
  const isSubmit = pathname.startsWith("/submit");

  return (
    <div className="flex h-dvh min-h-dvh w-full max-w-full flex-col bg-bg text-text">
      <main
        className={`flex min-h-0 flex-1 flex-col ${
          isSubmit ? "overflow-hidden" : "overflow-y-auto"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
