"use client";

import { motion } from "framer-motion";
import { ArrowRight, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 hero-grid opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-qubic/10 via-violet-500/10 to-veri/10 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto max-w-4xl"
        >
          <div className="glass-card rounded-3xl p-12 lg:p-16 text-center">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-3xl gradient-border" />
            
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-qubic/10 px-4 py-1.5 text-sm font-medium text-qubic mb-6">
                <Rocket className="h-4 w-4" />
                Built for Qubic Hackathon 2025
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl text-white">
                Ready to tokenize your{" "}
                <span className="text-gradient-mixed">real-world assets?</span>
              </h2>

              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of users trading verified real-world assets on the 
                most trusted RWA marketplace. AI verification, community governance, 
                and instant settlement powered by Qubic.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/marketplace">
                  <Button size="xl" className="group bg-gradient-to-r from-qubic to-emerald-500 hover:from-qubic hover:to-emerald-400 text-black font-semibold glow-qubic">
                    Start Trading
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/launchpad">
                  <Button size="xl" variant="outline" className="border-white/10 hover:bg-white/5">
                    Launch Your Asset
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
                {[
                  { label: "Powered by Qubic", letter: "Q", color: "text-qubic bg-qubic/10" },
                  { label: "Gemini AI Verified", letter: "G", color: "text-violet-400 bg-violet-500/10" },
                  { label: "Nostromo Governance", letter: "N", color: "text-fuchsia-400 bg-fuchsia-500/10" },
                ].map((badge) => (
                  <div key={badge.label} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${badge.color} flex items-center justify-center`}>
                      <span className="font-bold">{badge.letter}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
