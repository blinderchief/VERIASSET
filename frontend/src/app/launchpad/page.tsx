'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, TrendingUp, Clock, Users, Coins, ArrowRight, Timer, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api, IPOListing } from '@/lib/api';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';

type TabType = 'active' | 'upcoming' | 'ended';

// Mock IPO data
const mockIPOs: IPOListing[] = [
  {
    id: '1',
    name: 'Tokyo Smart Tower',
    symbol: 'TKST',
    description: 'Premium commercial real estate in Tokyo central business district',
    assetType: 'real_estate',
    totalTokens: 100000,
    availableTokens: 65000,
    currentPrice: 85.00,
    startPrice: 100.00,
    minPrice: 70.00,
    maxPrice: 100.00,
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    totalRaised: 2975000,
    participants: 342,
    verificationScore: 96,
  },
  {
    id: '2', 
    name: 'Green Energy Credits',
    symbol: 'GEC',
    description: 'Verified renewable energy credits from solar and wind projects',
    assetType: 'carbon_credit',
    totalTokens: 500000,
    availableTokens: 380000,
    currentPrice: 22.50,
    startPrice: 30.00,
    minPrice: 15.00,
    maxPrice: 30.00,
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    totalRaised: 2700000,
    participants: 567,
    verificationScore: 98,
  },
  {
    id: '3',
    name: 'Paris Art Collection',
    symbol: 'PAC',
    description: 'Curated collection of modern art pieces from renowned artists',
    assetType: 'collectible',
    totalTokens: 25000,
    availableTokens: 18000,
    currentPrice: 420.00,
    startPrice: 500.00,
    minPrice: 350.00,
    maxPrice: 500.00,
    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    totalRaised: 2940000,
    participants: 189,
    verificationScore: 94,
  },
];

export default function LaunchpadPage() {
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const { data: ipos, isLoading } = useQuery<IPOListing[]>({
    queryKey: ['ipos', activeTab],
    queryFn: async () => {
      try {
        const result = await api.nostromo.listIPOs(activeTab);
        return result?.length ? result : mockIPOs.filter(ipo => ipo.status === activeTab || activeTab === 'active');
      } catch (err) {
        console.log('Using mock IPO data');
        return mockIPOs.filter(ipo => ipo.status === activeTab || activeTab === 'active');
      }
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['launchpad-stats'],
    queryFn: async () => ({
      totalRaised: 45000000,
      totalIPOs: 127,
      averageRoi: 340,
      activeIPOs: mockIPOs.length,
    }),
  });

  const tabs = [
    { id: 'active' as TabType, label: 'Active IPOs', count: stats?.activeIPOs || 0 },
    { id: 'upcoming' as TabType, label: 'Upcoming', count: 8 },
    { id: 'ended' as TabType, label: 'Ended', count: 100 },
  ];

  return (
    <DashboardLayout>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 hero-grid opacity-50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-violet-500/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-t from-fuchsia-500/10 to-transparent rounded-full blur-3xl" />
          
          <div className="container relative mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-2 text-sm font-medium text-violet-400 mb-6">
                <Rocket className="w-4 h-4" />
                Nostromo Launchpad
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                Discover <span className="text-gradient-veri">AI-Verified</span> RWA IPOs
              </h1>
              <p className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
                Participate in tokenized real-world asset offerings with Dutch auction pricing.
                All assets are verified by Gemini AI before listing.
              </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
            >
              {[
                { label: 'Total Raised', value: formatCurrency(stats?.totalRaised || 0), icon: Coins, gradient: 'from-emerald-500/10 to-green-500/10', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
                { label: 'Total IPOs', value: formatNumber(stats?.totalIPOs || 0), icon: Rocket, gradient: 'from-violet-500/10 to-purple-500/10', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-400' },
                { label: 'Avg. ROI', value: `${stats?.averageRoi || 0}%`, icon: TrendingUp, gradient: 'from-blue-500/10 to-cyan-500/10', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
                { label: 'Active Now', value: stats?.activeIPOs || 0, icon: Timer, gradient: 'from-orange-500/10 to-amber-500/10', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-400' },
              ].map((stat) => (
                <Card key={stat.label} className="glass-card border-white/[0.08] p-5 text-center overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center mx-auto mb-3`}>
                      <stat.icon className={cn('w-5 h-5', stat.iconColor)} />
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                </Card>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Tabs */}
        <section className="container mx-auto px-4 mb-8">
          <div className="flex gap-2 justify-center">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative',
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/20'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                )}
              >
                {tab.label}
                <Badge className="ml-2 bg-white/10 text-xs">{tab.count}</Badge>
              </Button>
            ))}
          </div>
        </section>

        {/* IPO Grid */}
        <section className="container mx-auto px-4 pb-16">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <IPOCardSkeleton key={i} />
              ))}
            </div>
          ) : ipos?.length ? (
            <motion.div
              layout
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {ipos.map((ipo, index) => (
                  <IPOCard key={ipo.id} ipo={ipo} index={index} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="glass-card rounded-2xl p-12 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No IPOs Found</h3>
                <p className="text-muted-foreground mb-6">Check back soon for new opportunities!</p>
                <Button 
                  onClick={() => setActiveTab('upcoming')}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                >
                  View Upcoming IPOs
                </Button>
              </div>
            </motion.div>
          )}
        </section>

        {/* How Dutch Auction Works */}
        <section className="container mx-auto px-4 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              How Dutch Auction Works
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: 1,
                  title: 'High Start Price',
                  description: 'Auction begins at the maximum price set by the asset owner',
                },
                {
                  step: 2,
                  title: 'Price Decreases',
                  description: 'Price drops gradually over time until it reaches minimum',
                },
                {
                  step: 3,
                  title: 'Place Your Bid',
                  description: 'Bid at any price you find acceptable during the auction',
                },
                {
                  step: 4,
                  title: 'Final Settlement',
                  description: 'All winning bids pay the final clearing price',
                },
              ].map((item) => (
                <Card key={item.step} className="glass-card border-white/[0.08] p-6 text-center relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center mx-auto mb-4 text-white font-bold shadow-lg shadow-violet-500/20">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {item.step < 4 && (
                    <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground z-10" />
                  )}
                </Card>
              ))}
            </div>
          </motion.div>
        </section>
      </main>
    </DashboardLayout>
  );
}

function IPOCard({ ipo, index }: { ipo: IPOListing; index: number }) {
  const progress = ((ipo.currentPrice - ipo.minPrice) / (ipo.maxPrice - ipo.minPrice)) * 100;
  const timeLeft = new Date(ipo.endTime).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  const statusColors = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    cancelled: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  const typeColors = {
    real_estate: 'bg-emerald-500/20 text-emerald-400',
    commodity: 'bg-amber-500/20 text-amber-400',
    collectible: 'bg-violet-500/20 text-violet-400',
    financial: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="glass-card border-white/[0.08] overflow-hidden hover:border-violet-500/30 transition-all duration-300 group card-hover">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <Rocket className="w-16 h-16 text-violet-500/30" />
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className={statusColors[ipo.status as keyof typeof statusColors]}>
              {ipo.status}
            </Badge>
            <Badge className={cn(typeColors[ipo.assetType as keyof typeof typeColors] || 'bg-white/10 text-white')}>
              {ipo.assetType?.replace('_', ' ')}
            </Badge>
          </div>
          <div className="absolute top-4 right-4">
            <div className="glass-card rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Timer className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-white font-medium">
                {daysLeft}d {hoursLeft}h
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
            {ipo.name || `IPO #${ipo.id?.slice(0, 8)}`}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {ipo.description || 'AI-verified real-world asset tokenization through Dutch auction.'}
          </p>

          {/* Price Info */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Price</span>
              <span className="text-white font-bold">{formatCurrency(ipo.currentPrice || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price Range</span>
              <span className="text-muted-foreground">
                {formatCurrency(ipo.minPrice || 0)} - {formatCurrency(ipo.maxPrice || 0)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Min</span>
                <span>Current: {progress.toFixed(0)}%</span>
                <span>Max</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/[0.08]">
            <div>
              <p className="text-muted-foreground text-xs">Total Supply</p>
              <p className="text-white font-semibold">{formatNumber(ipo.totalTokens || 0)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Available</p>
              <p className="text-white font-semibold">{formatNumber(ipo.availableTokens || 0)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Participants</p>
              <p className="text-white font-semibold flex items-center gap-1">
                <Users className="w-3 h-3" />
                {formatNumber(ipo.participants || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Raised</p>
              <p className="text-emerald-400 font-semibold">{formatCurrency(ipo.totalRaised || 0)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href={`/launchpad/${ipo.id}`} className="flex-1">
              <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/20">
                View Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" className="border-white/10 hover:bg-white/5">
              <TrendingUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function IPOCardSkeleton() {
  return (
    <Card className="glass-card border-white/[0.08] overflow-hidden">
      <Skeleton className="h-48 bg-white/5" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4 bg-white/5" />
        <Skeleton className="h-4 w-full bg-white/5" />
        <Skeleton className="h-4 w-2/3 bg-white/5" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 bg-white/5" />
          <Skeleton className="h-12 bg-white/5" />
        </div>
        <Skeleton className="h-10 w-full bg-white/5" />
      </div>
    </Card>
  );
}
