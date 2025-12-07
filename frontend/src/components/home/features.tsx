"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Shield,
  Zap,
  Vote,
  LineChart,
  Webhook,
} from "lucide-react";

const features = [
  {
    name: "AI-Powered Verification",
    description:
      "Gemini 1.5 Flash analyzes documents, images, and data to verify asset authenticity with 99%+ confidence scores.",
    icon: Bot,
    gradient: "from-violet-500 to-purple-600",
    bgGradient: "from-violet-500/10 to-purple-600/10",
    shadowColor: "shadow-violet-500/20",
  },
  {
    name: "Instant Finality",
    description:
      "Qubic's tick-based architecture ensures immediate transaction confirmation with no waiting periods.",
    icon: Zap,
    gradient: "from-qubic to-emerald-500",
    bgGradient: "from-qubic/10 to-emerald-500/10",
    shadowColor: "shadow-qubic/20",
  },
  {
    name: "Smart Contract Security",
    description:
      "Assets are tokenized using secure smart contracts with built-in compliance and audit trails.",
    icon: Shield,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
    shadowColor: "shadow-blue-500/20",
  },
  {
    name: "Nostromo Governance",
    description:
      "Community-driven proposals and voting for new asset listings with transparent decision-making.",
    icon: Vote,
    gradient: "from-veri to-fuchsia-500",
    bgGradient: "from-veri/10 to-fuchsia-500/10",
    shadowColor: "shadow-veri/20",
  },
  {
    name: "Dutch Auction IPO",
    description:
      "Fair price discovery mechanism for new asset launches with descending price auctions.",
    icon: LineChart,
    gradient: "from-emerald-500 to-green-500",
    bgGradient: "from-emerald-500/10 to-green-500/10",
    shadowColor: "shadow-emerald-500/20",
  },
  {
    name: "EasyConnect Webhooks",
    description:
      "Automate workflows with Make.com and Zapier integration for trade notifications and alerts.",
    icon: Webhook,
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-500/10 to-amber-500/10",
    shadowColor: "shadow-orange-500/20",
  },
];

export function Features() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 hero-grid opacity-50" />
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-gradient-to-r from-qubic/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-gradient-to-l from-veri/5 to-transparent rounded-full blur-3xl" />
      
      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 text-sm font-medium text-qubic mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-qubic opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-qubic"></span>
            </span>
            Powerful Features
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            Everything you need to trade{" "}
            <span className="text-gradient-mixed">real-world assets</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg text-muted-foreground leading-relaxed"
          >
            VeriAssets combines cutting-edge AI verification, Qubic's 
            high-performance blockchain, and community governance to create 
            the most trusted RWA marketplace.
          </motion.p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className={`glass-card rounded-2xl p-8 h-full transition-all duration-500 hover:scale-[1.02] ${feature.shadowColor} hover:shadow-xl`}>
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative">
                  <div
                    className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white">{feature.name}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
