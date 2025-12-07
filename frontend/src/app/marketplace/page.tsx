"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Store, Search, SlidersHorizontal } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AssetCard } from "@/components/marketplace/asset-card";
import { AssetFilters } from "@/components/marketplace/asset-filters";
import { MarketStats } from "@/components/marketplace/market-stats";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

// Mock data for when API is not available
const mockAssets = [
  {
    id: '1',
    name: 'Manhattan Luxury Penthouse',
    symbol: 'MLPH',
    asset_type: 'real_estate',
    description: 'Premium penthouse in Manhattan with stunning views',
    status: 'listed',
    price_per_unit: 250.00,
    total_supply: 10000,
    circulating_supply: 7500,
    verification_score: 95,
    image_url: null,
    creator: { name: 'VeriAssets' },
  },
  {
    id: '2',
    name: 'Amazon Rainforest Carbon Credits',
    symbol: 'ARCC',
    asset_type: 'carbon_credit',
    description: 'Verified carbon credits from Amazon rainforest conservation',
    status: 'listed',
    price_per_unit: 45.50,
    total_supply: 50000,
    circulating_supply: 32000,
    verification_score: 98,
    image_url: null,
    creator: { name: 'EcoVerde' },
  },
  {
    id: '3',
    name: 'Swiss Government Bond 2030',
    symbol: 'SGB30',
    asset_type: 'treasury',
    description: 'Tokenized Swiss government treasury bond maturing in 2030',
    status: 'listed',
    price_per_unit: 1050.00,
    total_supply: 5000,
    circulating_supply: 4200,
    verification_score: 100,
    image_url: null,
    creator: { name: 'SwissFin' },
  },
  {
    id: '4',
    name: 'Vintage Wine Collection',
    symbol: 'VWC',
    asset_type: 'collectible',
    description: 'Rare vintage wine collection from Bordeaux region',
    status: 'listed',
    price_per_unit: 180.00,
    total_supply: 1000,
    circulating_supply: 850,
    verification_score: 92,
    image_url: null,
    creator: { name: 'WineVault' },
  },
];

export default function MarketplacePage() {
  const [filters, setFilters] = useState({
    type: "",
    status: "listed",
    search: "",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["assets", filters],
    queryFn: async () => {
      try {
        const result = await api.getAssets({
          type: filters.type || undefined,
          status: filters.status || undefined,
          search: filters.search || undefined,
        });
        return result;
      } catch (err) {
        console.log('Using mock data - API not available');
        // Filter mock data based on filters
        let filtered = mockAssets;
        if (filters.type) {
          filtered = filtered.filter(a => a.asset_type === filters.type);
        }
        if (filters.search) {
          const search = filters.search.toLowerCase();
          filtered = filtered.filter(a => 
            a.name.toLowerCase().includes(search) || 
            a.symbol.toLowerCase().includes(search)
          );
        }
        return { items: filtered, total: filtered.length };
      }
    },
  });

  return (
    <DashboardLayout>
      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 hero-grid opacity-50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-qubic/15 to-transparent rounded-full blur-3xl" />
          
          <div className="container relative mx-auto px-4 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-2 text-sm font-medium text-qubic mb-6">
                <Store className="h-4 w-4" />
                RWA Marketplace
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                Trade <span className="text-gradient-mixed">AI-Verified</span> Assets
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Browse and trade real-world assets on Qubic. Every asset is verified by 
                Gemini AI for authenticity and compliance.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <div className="container mx-auto px-4 lg:px-8">
          <MarketStats />
        </div>

        {/* Filters */}
        <div className="container mx-auto px-4 lg:px-8 mt-8">
          <AssetFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Asset Grid */}
        <div className="container mx-auto px-4 lg:px-8 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <AssetCardSkeleton key={i} />
              ))}
            </div>
          ) : error && !data?.items?.length ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="glass-card rounded-2xl p-12 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-rose-400" />
                </div>
                <p className="text-rose-400 font-medium">Failed to load assets</p>
                <p className="text-muted-foreground text-sm mt-2">Please try again later</p>
              </div>
            </motion.div>
          ) : data?.items?.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="glass-card rounded-2xl p-12 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <SlidersHorizontal className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-white font-medium">No assets found</p>
                <p className="text-muted-foreground text-sm mt-2">Try adjusting your filters</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {data?.items?.map((asset: any, index: number) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AssetCard asset={asset} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function AssetCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <Skeleton className="h-44 w-full rounded-xl bg-white/5" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/3 bg-white/5" />
        <Skeleton className="h-4 w-1/2 bg-white/5" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-24 bg-white/5" />
        <Skeleton className="h-9 w-20 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}
