"use client";

import { motion } from "framer-motion";
import { Upload, Bot, Vote, ShoppingCart, ArrowRight } from "lucide-react";

const steps = [
  {
    step: 1,
    title: "Submit Asset",
    description:
      "Upload your real-world asset documentation including certificates, deeds, or verification papers.",
    icon: Upload,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    step: 2,
    title: "AI Verification",
    description:
      "Gemini AI analyzes your documents and generates a verification score with detailed authenticity report.",
    icon: Bot,
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/10 to-purple-500/10",
  },
  {
    step: 3,
    title: "Community Vote",
    description:
      "Verified assets go through Nostromo governance for community approval before listing.",
    icon: Vote,
    gradient: "from-fuchsia-500 to-pink-500",
    bgGradient: "from-fuchsia-500/10 to-pink-500/10",
  },
  {
    step: 4,
    title: "Trade & Earn",
    description:
      "Once approved, your asset is listed on the marketplace for instant trading with 0.3% fee burn.",
    icon: ShoppingCart,
    gradient: "from-qubic to-emerald-500",
    bgGradient: "from-qubic/10 to-emerald-500/10",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 hero-grid opacity-50" />
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-gradient-to-r from-violet-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-gradient-to-l from-qubic/5 to-transparent rounded-full blur-3xl" />
      
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
            Simple Process
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-white"
          >
            How VeriAssets Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg text-muted-foreground"
          >
            From asset submission to trading in four simple steps. 
            Our AI and community governance ensure every asset is verified and trusted.
          </motion.p>
        </div>

        <div className="mt-20 relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-qubic/30 -translate-y-1/2" />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <div className="glass-card rounded-2xl p-8 h-full flex flex-col items-center text-center relative z-10 card-hover">
                  {/* Gradient background */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  {/* Step number */}
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className={`relative mt-4 w-16 h-16 rounded-2xl bg-gradient-to-br ${step.bgGradient} flex items-center justify-center`}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="mt-6 text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector (hidden on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 w-6 h-6 -translate-y-1/2 z-20 items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
