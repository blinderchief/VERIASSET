"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Wallet, BarChart3, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";

const stats = [
  {
    title: "Portfolio Value",
    value: 125430,
    change: "+12.5%",
    changePositive: true,
    icon: Wallet,
    format: "currency",
    gradient: "from-emerald-500/10 to-green-500/10",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    title: "Total Assets",
    value: 12,
    change: "+3 this week",
    changePositive: true,
    icon: BarChart3,
    format: "number",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    title: "24h P&L",
    value: 2340,
    change: "+5.2%",
    changePositive: true,
    icon: TrendingUp,
    format: "currency",
    gradient: "from-violet-500/10 to-purple-500/10",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    title: "Active Trades",
    value: 4,
    change: "2 pending",
    changePositive: true,
    icon: Activity,
    format: "number",
    gradient: "from-orange-500/10 to-amber-500/10",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
  },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="glass-card border-white/[0.08] overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">
                    {stat.format === "currency"
                      ? formatCurrency(stat.value)
                      : formatNumber(stat.value, 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.changePositive ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-rose-400" />
                    )}
                    <span className={`text-xs ${stat.changePositive ? "text-emerald-400" : "text-rose-400"}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
