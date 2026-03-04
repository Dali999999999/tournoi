import { useState, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Trophy, Gamepad2, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useTournamentStore } from "@/src/store";
import { AdminPasscodeModal } from "./AdminPasscodeModal";
import { ToastContainer } from "./ui/ToastContainer";
import { ModalContainer } from "./ui/ModalContainer";

export function Layout() {
  const location = useLocation();
  const { currentBgImage } = useTournamentStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const logoClicks = useRef(0);
  const lastClickTime = useRef(0);

  const navItems = [
    { name: "Inscription", path: "/", icon: Gamepad2 },
  ];

  const handleLogoClick = () => {
    // Admin access disabled
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 bg-zinc-950 transition-opacity duration-700 ease-in-out">
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            currentBgImage ? "opacity-40" : "opacity-0",
          )}
        >
          {currentBgImage && (
            <img
              src={currentBgImage}
              alt="Background"
              className="h-full w-full object-cover blur-sm scale-105"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div
              className="flex items-center gap-2 cursor-pointer select-none group"
              onClick={handleLogoClick}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/20 group-active:scale-95 transition-transform">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Nexus<span className="text-violet-500">Tourney</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/" &&
                    location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-zinc-800/80 text-white shadow-sm"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-violet-500" : "text-zinc-500",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        {/* Mobile nav */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-md md:hidden">
          <nav className="flex items-center justify-around p-3">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors",
                    isActive
                      ? "text-violet-500"
                      : "text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <AdminPasscodeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ToastContainer />
      <ModalContainer />
    </div>
  );
}
