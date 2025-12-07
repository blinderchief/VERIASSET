"use client";

import { motion } from "framer-motion";
import { formatNumber } from "@/lib/utils";
import { TrendingUp, Shield, BarChart3, Users } from "lucide-react";

const stats = [
  { label: "Total Value Locked", value: 67500000, prefix: "$", icon: TrendingUp, color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  { label: "Assets Verified", value: 234, prefix: "", icon: Shield, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { label: "Trading Volume (24h)", value: 12500000, prefix: "$", icon: BarChart3, color: "text-violet-400", bgColor: "bg-violet-500/10" },
  { label: "Active Traders", value: 5420, prefix: "", icon: Users, color: "text-orange-400", bgColor: "bg-orange-500/10" },
];

export function Stats() {
  return (
    <section className="py-20 relative">
      {/* Background gradient line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-qubic/50 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-veri/50 to-transparent" />
      
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 lg:p-8 text-center stats-pattern"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${stat.bgColor} mb-4`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold lg:text-4xl text-white">
                {stat.prefix}
                {formatNumber(stat.value, 1)}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
