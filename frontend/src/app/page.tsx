import Link from "next/link";
import { Hero } from "@/components/home/hero";
import { Features } from "@/components/home/features";
import { AssetTypes } from "@/components/home/asset-types";
import { HowItWorks } from "@/components/home/how-it-works";
import { Stats } from "@/components/home/stats";
import { CTA } from "@/components/home/cta";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <Hero />
        <Stats />
        <Features />
        <AssetTypes />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
