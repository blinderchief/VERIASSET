"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Rocket,
  Vote,
  Wallet,
  History,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Marketplace", href: "/marketplace", icon: Store },
  { name: "Launchpad", href: "/launchpad", icon: Rocket },
  { name: "Governance", href: "/governance", icon: Vote },
  { name: "Portfolio", href: "/portfolio", icon: Wallet },
  { name: "History", href: "/history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-background/80 backdrop-blur-xl border-r border-white/[0.08]">
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-white/[0.08]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-qubic to-emerald-500 flex items-center justify-center shadow-lg shadow-qubic/20 group-hover:shadow-qubic/40 transition-shadow">
            <Sparkles className="h-5 w-5 text-black" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <span className="text-lg font-bold">
            <span className="text-white">Veri</span>
            <span className="text-gradient">Assets</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-qubic/20 to-emerald-500/20 text-white border border-qubic/30 shadow-lg shadow-qubic/10"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-qubic")} />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-qubic" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Network status */}
      <div className="p-4 mx-3 mb-4 rounded-xl glass-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-white">Connected</span>
            </div>
            <span className="text-xs text-muted-foreground">Qubic Testnet</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
