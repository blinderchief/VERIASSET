'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Users,
  Coins,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Share2,
  Bell,
  Info,
  Wallet,
  Timer,
  Target,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { useUserStore } from '@/lib/store';
import { useWalletModal } from '@/components/wallet/wallet-connect-modal';

// Mock IPO data for demo
const mockIPOs: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Manhattan Luxury Tower',
    symbol: 'MLT',
    description: 'Prime commercial real estate in Manhattan, featuring a 45-story luxury mixed-use development with retail, office, and residential spaces.',
    assetType: 'real_estate',
    status: 'active',
    totalTokens: 100000,
    availableTokens: 75000,
    maxPrice: 150,
    minPrice: 80,
    currentPrice: 120,
    totalRaised: 1500000,
    participants: 234,
    startTime: '2025-01-01T00:00:00Z',
    endTime: '2025-02-01T00:00:00Z',
    contractId: 'QUBIC123456789ABCDEF',
  },
  '2': {
    id: '2',
    name: 'Carbon Credit Reserve',
    symbol: 'CCR',
    description: 'Verified carbon offset credits from Amazon rainforest conservation projects. Each token represents 1 metric ton of CO2 offset.',
    assetType: 'commodity',
    status: 'active',
    totalTokens: 50000,
    availableTokens: 45000,
    maxPrice: 50,
    minPrice: 25,
    currentPrice: 38,
    totalRaised: 190000,
    participants: 89,
    startTime: '2025-01-15T00:00:00Z',
    endTime: '2025-02-15T00:00:00Z',
    contractId: 'QUBICCARBON123456789',
  },
  '3': {
    id: '3',
    name: 'Art Collection Fund',
    symbol: 'ACF',
    description: 'Fractional ownership of a curated collection of contemporary art from renowned artists including Banksy and Kaws.',
    assetType: 'collectible',
    status: 'pending',
    totalTokens: 10000,
    availableTokens: 10000,
    maxPrice: 500,
    minPrice: 200,
    currentPrice: 500,
    totalRaised: 0,
    participants: 0,
    startTime: '2025-03-01T00:00:00Z',
    endTime: '2025-04-01T00:00:00Z',
    contractId: null,
  },
};

export default function IPODetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { walletAddress, isWalletConnected } = useUserStore();
  const { open: openWalletModal } = useWalletModal();

  const [bidAmount, setBidAmount] = useState<string>('');
  const [tokenQuantity, setTokenQuantity] = useState<string>('1');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const ipoId = params.id as string;

  const { data: ipo, isLoading } = useQuery({
    queryKey: ['ipo', ipoId],
    queryFn: async () => {
      try {
        const result = await api.nostromo.getIPO(ipoId);
        return result;
      } catch (err) {
        // Return mock data if API is not available
        return mockIPOs[ipoId] || mockIPOs['1'];
      }
    },
    enabled: !!ipoId,
    refetchInterval: 30000, // Refresh every 30 seconds for price updates
  });

  // Dutch auction price simulation
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    if (ipo) {
      setCurrentPrice(ipo.currentPrice || ipo.maxPrice);
      setBidAmount(String(ipo.currentPrice || ipo.maxPrice));
    }
  }, [ipo]);

  // Price countdown simulation for Dutch auction
  useEffect(() => {
    if (!ipo || ipo.status !== 'active') return;

    const priceInterval = setInterval(() => {
      setCurrentPrice((prev) => {
        const decrease = (ipo.maxPrice - ipo.minPrice) / (24 * 60 * 6); // Decrease every 10 seconds
        const newPrice = Math.max(ipo.minPrice, prev - decrease);
        return newPrice;
      });
    }, 10000);

    return () => clearInterval(priceInterval);
  }, [ipo]);

  // Time countdown
  useEffect(() => {
    if (!ipo?.endTime) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(ipo.endTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, endTime - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [ipo?.endTime]);

  const bidMutation = useMutation({
    mutationFn: async (data: { price: number; quantity: number }) => {
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, bidId: `BID-${Date.now()}` };
    },
    onSuccess: () => {
      toast({
        title: 'Bid Placed Successfully!',
        description: 'Your bid has been recorded. You will be notified of the outcome.',
      });
      queryClient.invalidateQueries({ queryKey: ['ipo', ipoId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Bid Failed',
        description: error.message || 'Unable to place bid. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleBid = () => {
    if (!isWalletConnected) {
      openWalletModal();
      return;
    }

    const price = parseFloat(bidAmount);
    const quantity = parseInt(tokenQuantity);

    if (isNaN(price) || price < (ipo?.minPrice || 0)) {
      toast({
        title: 'Invalid Bid',
        description: `Minimum bid price is ${formatCurrency(ipo?.minPrice || 0)}`,
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(quantity) || quantity < 1) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid token quantity.',
        variant: 'destructive',
      });
      return;
    }

    bidMutation.mutate({ price, quantity });
  };

  if (isLoading) {
    return <IPODetailSkeleton />;
  }

  if (!ipo) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">IPO Not Found</h3>
          <p className="text-gray-400 mb-6">This IPO may have been removed or doesn&apos;t exist.</p>
          <Link href="/launchpad">
            <Button>Back to Launchpad</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const totalCost = parseFloat(bidAmount || '0') * parseInt(tokenQuantity || '0');
  const priceProgress = ((currentPrice - ipo.minPrice) / (ipo.maxPrice - ipo.minPrice)) * 100;
  const fundingProgress = (ipo.totalRaised / (ipo.totalTokens * ipo.minPrice)) * 100;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link href="/launchpad">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Launchpad
            </Button>
          </Link>
        </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white/5 border-white/10 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn(
                          ipo.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          ipo.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        )}>
                          {ipo.status}
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-400">
                          Dutch Auction
                        </Badge>
                      </div>
                      <h1 className="text-3xl font-bold text-white mb-2">
                        {ipo.name || `IPO #${ipo.id?.slice(0, 8)}`}
                      </h1>
                      <p className="text-gray-400">
                        {ipo.description || 'AI-verified real-world asset tokenization.'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <Share2 className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <Bell className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="bg-black/30 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="w-5 h-5 text-orange-400" />
                      <span className="text-gray-400">Time Remaining</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { value: timeLeft.days, label: 'Days' },
                        { value: timeLeft.hours, label: 'Hours' },
                        { value: timeLeft.minutes, label: 'Minutes' },
                        { value: timeLeft.seconds, label: 'Seconds' },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className="bg-gray-800 rounded-lg p-3">
                            <span className="text-2xl md:text-3xl font-bold text-white">
                              {String(item.value).padStart(2, '0')}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 mt-1 block">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-black/20 rounded-lg p-4">
                      <Users className="w-5 h-5 text-blue-400 mb-2" />
                      <p className="text-2xl font-bold text-white">{formatNumber(ipo.participants || 0)}</p>
                      <p className="text-sm text-gray-500">Participants</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4">
                      <Coins className="w-5 h-5 text-green-400 mb-2" />
                      <p className="text-2xl font-bold text-white">{formatCurrency(ipo.totalRaised || 0)}</p>
                      <p className="text-sm text-gray-500">Total Raised</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4">
                      <Target className="w-5 h-5 text-purple-400 mb-2" />
                      <p className="text-2xl font-bold text-white">{formatNumber(ipo.totalTokens || 0)}</p>
                      <p className="text-sm text-gray-500">Total Supply</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4">
                      <Zap className="w-5 h-5 text-yellow-400 mb-2" />
                      <p className="text-2xl font-bold text-white">{formatNumber(ipo.availableTokens || 0)}</p>
                      <p className="text-sm text-gray-500">Available</p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Price Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-orange-400" />
                    Dutch Auction Price
                  </h2>

                  {/* Price Display */}
                  <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Current Price</p>
                        <p className="text-4xl font-bold text-white">{formatCurrency(currentPrice)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Price Drop Rate</p>
                        <p className="text-orange-400 font-semibold">
                          -${((ipo.maxPrice - ipo.minPrice) / 24).toFixed(2)}/hour
                        </p>
                      </div>
                    </div>

                    {/* Price Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Min: {formatCurrency(ipo.minPrice)}</span>
                        <span className="text-gray-400">Max: {formatCurrency(ipo.maxPrice)}</span>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: '100%' }}
                          animate={{ width: `${priceProgress}%` }}
                          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>🎯 Best Price</span>
                        <span className="text-purple-400">{priceProgress.toFixed(1)}% from max</span>
                        <span>💰 Starting Price</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Alert */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-medium mb-1">How Dutch Auction Works</p>
                      <p className="text-gray-400 text-sm">
                        The price starts high and decreases over time. You can place a bid at any price
                        above the current price. All winning bids pay the final clearing price when
                        the auction ends.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Asset Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/5 border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Asset Details</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Asset Type</span>
                        <span className="text-white capitalize">{ipo.assetType?.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Token Symbol</span>
                        <span className="text-white">{ipo.symbol || 'RWA'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Total Supply</span>
                        <span className="text-white">{formatNumber(ipo.totalTokens)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Min Investment</span>
                        <span className="text-white">{formatCurrency(ipo.minPrice)}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Network</span>
                        <span className="text-white">Qubic</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Contract</span>
                        <span className="text-purple-400 font-mono text-sm">
                          {ipo.contractId ? `${ipo.contractId.slice(0, 8)}...` : 'Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">AI Verified</span>
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Verified
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Platform Fee</span>
                        <span className="text-white">0.3% (burned)</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar - Bid Panel */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="sticky top-24"
              >
                <Card className="bg-white/5 border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-purple-400" />
                    Place Your Bid
                  </h2>

                  <div className="space-y-4 mb-6">
                    {/* Bid Price */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Bid Price (per token)</label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder="0.00"
                          min={ipo.minPrice}
                          step="0.01"
                          className="bg-black/30 border-white/20 text-white text-lg pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">USD</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Min: {formatCurrency(ipo.minPrice)} | Current: {formatCurrency(currentPrice)}
                      </p>
                    </div>

                    {/* Token Quantity */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Token Quantity</label>
                      <Input
                        type="number"
                        value={tokenQuantity}
                        onChange={(e) => setTokenQuantity(e.target.value)}
                        placeholder="1"
                        min="1"
                        max={ipo.availableTokens}
                        className="bg-black/30 border-white/20 text-white text-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Available: {formatNumber(ipo.availableTokens)} tokens
                      </p>
                    </div>

                    {/* Quick Select */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Quick Select</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[10, 50, 100, 500].map((qty) => (
                          <Button
                            key={qty}
                            variant="outline"
                            size="sm"
                            onClick={() => setTokenQuantity(String(qty))}
                            className={cn(
                              'border-white/20 hover:bg-white/10',
                              tokenQuantity === String(qty) && 'bg-purple-600 border-purple-600'
                            )}
                          >
                            {qty}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-black/30 rounded-lg p-4 mb-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Bid Price</span>
                      <span className="text-white">{formatCurrency(parseFloat(bidAmount) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Quantity</span>
                      <span className="text-white">{formatNumber(parseInt(tokenQuantity) || 0)} tokens</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Platform Fee (0.3%)</span>
                      <span className="text-white">{formatCurrency(totalCost * 0.003)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Cost</span>
                        <span className="text-xl font-bold text-white">{formatCurrency(totalCost * 1.003)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bid Button */}
                  <Button
                    onClick={handleBid}
                    disabled={!isWalletConnected || ipo.status !== 'active' || bidMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-6"
                  >
                    {!isWalletConnected ? (
                      <>
                        <Wallet className="w-5 h-5 mr-2" />
                        Connect Wallet
                      </>
                    ) : bidMutation.isPending ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                        />
                        Placing Bid...
                      </>
                    ) : ipo.status !== 'active' ? (
                      'Auction Not Active'
                    ) : (
                      <>
                        Place Bid
                        <Zap className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  {!isWalletConnected && (
                    <p className="text-xs text-center text-gray-500 mt-3">
                      Connect your Qubic wallet to participate in this IPO
                    </p>
                  )}
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </DashboardLayout>
  );
}

function IPODetailSkeleton() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4">
        <Skeleton className="h-8 w-32 bg-gray-800 mb-6" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] bg-gray-800 rounded-xl" />
            <Skeleton className="h-[300px] bg-gray-800 rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-[500px] bg-gray-800 rounded-xl" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
