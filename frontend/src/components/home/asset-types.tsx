"use client";

import { motion } from "framer-motion";
import { Leaf, Building2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const assetTypes = [
  {
    name: "Carbon Credits",
    description:
      "Tokenized carbon offset certificates from verified projects. Trade environmental impact with AI-verified authenticity.",
    icon: Leaf,
    color: "from-green-400 to-emerald-600",
    stats: { listed: 45, volume: "2.5M" },
    href: "/marketplace?type=carbon",
  },
  {
    name: "Real Estate",
    description:
      "Fractional ownership of premium properties. Access real estate investments starting from just $100.",
    icon: Building2,
    color: "from-blue-400 to-indigo-600",
    stats: { listed: 23, volume: "15M" },
    href: "/marketplace?type=real_estate",
  },
  {
    name: "Treasury Notes",
    description:
      "Tokenized government securities with guaranteed yields. Stable, secure, and liquid treasury investments.",
    icon: Landmark,
    color: "from-purple-400 to-violet-600",
    stats: { listed: 12, volume: "50M" },
    href: "/marketplace?type=treasury",
  },
];

export function AssetTypes() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Diverse Asset Categories
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Trade tokenized versions of real-world assets across multiple 
            categories, all verified by AI and secured on Qubic.
          </motion.p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {assetTypes.map((asset, index) => (
            <motion.div
              key={asset.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group relative overflow-hidden"
            >
              <div className="relative bg-card rounded-2xl p-8 shadow-sm border h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                {/* Icon with gradient background */}
                <div
                  className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${asset.color} p-4 shadow-lg`}
                >
                  <asset.icon className="h-8 w-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="mt-6 text-xl font-bold">{asset.name}</h3>
                <p className="mt-3 text-muted-foreground flex-1">
                  {asset.description}
                </p>

                {/* Stats */}
                <div className="mt-6 flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Listed: </span>
                    <span className="font-semibold">{asset.stats.listed}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume: </span>
                    <span className="font-semibold">${asset.stats.volume}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-6">
                  <Link href={asset.href}>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Browse {asset.name}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
