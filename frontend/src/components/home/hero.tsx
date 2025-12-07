"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap, TrendingUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background effects */}
      <div className="absolute inset-0 hero-grid" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-qubic/20 via-qubic/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-t from-veri/15 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-gradient-to-r from-violet-600/10 to-transparent rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 lg:px-8 py-20">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full glass-card px-5 py-2 text-sm font-medium text-qubic mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-qubic opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-qubic"></span>
            </span>
            Built on Qubic Network • Hackathon 2025
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.1]"
          >
            <span className="text-shimmer">AI-Verified</span>
            <br />
            <span className="text-white">Real-World Assets</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 text-lg text-muted-foreground sm:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed"
          >
            Tokenize, verify, and trade real-world assets with{" "}
            <span className="text-qubic font-medium">Gemini AI verification</span>,{" "}
            <span className="text-veri font-medium">Nostromo governance</span>, and{" "}
            <span className="text-white font-medium">instant settlement</span> on Qubic.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/marketplace">
              <Button size="xl" className="group bg-gradient-to-r from-qubic to-emerald-500 hover:from-qubic hover:to-emerald-400 text-black font-semibold px-8 h-14 text-lg glow-qubic">
                Explore Marketplace
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/launchpad">
              <Button size="xl" variant="outline" className="border-white/20 hover:bg-white/5 px-8 h-14 text-lg">
                Launch Asset
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          >
            {[
              { icon: Shield, text: "AI-Verified Assets", color: "text-emerald-400" },
              { icon: Zap, text: "Instant Finality", color: "text-yellow-400" },
              { icon: TrendingUp, text: "0.3% Burn on Trades", color: "text-orange-400" },
              { icon: Globe, text: "Global Access", color: "text-blue-400" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hero preview cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="relative mx-auto max-w-6xl">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-qubic/10 via-transparent to-veri/10 rounded-3xl blur-3xl" />
            
            {/* Preview cards grid */}
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Carbon Credit",
                  symbol: "VCC-01",
                  price: "12,500",
                  change: "+5.2%",
                  verified: true,
                  icon: "🌱",
                  gradient: "from-emerald-500/20 to-green-600/20",
                  borderColor: "border-emerald-500/30",
                },
                {
                  title: "Treasury Note",
                  symbol: "VTN-90D",
                  price: "98,750",
                  change: "+0.8%",
                  verified: true,
                  icon: "📜",
                  gradient: "from-blue-500/20 to-indigo-600/20",
                  borderColor: "border-blue-500/30",
                },
                {
                  title: "Real Estate Token",
                  symbol: "VRE-NYC",
                  price: "250,000",
                  change: "+12.4%",
                  verified: true,
                  icon: "🏢",
                  gradient: "from-violet-500/20 to-purple-600/20",
                  borderColor: "border-violet-500/30",
                },
              ].map((asset, i) => (
                <motion.div
                  key={asset.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                  className={`glass-card rounded-2xl p-6 ${asset.borderColor} card-hover`}
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${asset.gradient} opacity-50`} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">{asset.icon}</span>
                      {asset.verified && (
                        <span className="flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
                          <Shield className="h-3 w-3" />
                          AI Verified
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">{asset.title}</div>
                    <div className="font-mono text-lg font-bold text-white">{asset.symbol}</div>
                    <div className="mt-4 flex items-baseline gap-3">
                      <span className="text-2xl font-bold text-white">${asset.price}</span>
                      <span className="text-sm font-medium text-emerald-400">{asset.change}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
