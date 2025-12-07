'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Heart,
  Building2,
  Coins,
  Gem,
  FileText,
  CheckCircle,
  Shield,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  BarChart3,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ShoppingCart,
  Tag,
  Globe,
  Calendar,
  Award,
  Leaf,
  Landmark,
  Box,
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
import { cn, formatCurrency, formatNumber, truncateAddress } from '@/lib/utils';
import { useUserStore, useTradeStore } from '@/lib/store';
import { useWalletModal } from '@/components/wallet/wallet-connect-modal';

// Types
interface OrderBookEntry {
  price: number;
  quantity: number;
}

interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

// Mock asset data
const mockAssets: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Manhattan Luxury Penthouse',
    symbol: 'MLPH',
    assetType: 'real_estate',
    description: 'Premium penthouse located in the heart of Manhattan with stunning Central Park views. This tokenized property offers fractional ownership of a 5,000 sq ft luxury residence.',
    currentPrice: 250.00,
    totalSupply: 10000,
    circulatingSupply: 7500,
    verificationScore: 95,
    location: 'New York, USA',
    ownerId: 'QUBICXYZ123456789',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
    annualYield: 8.5,
    lockPeriod: 0,
  },
  '2': {
    id: '2',
    name: 'Amazon Rainforest Carbon Credits',
    symbol: 'ARCC',
    assetType: 'carbon_credit',
    description: 'Verified carbon credits from Amazon rainforest conservation projects. Each token represents 1 tonne of CO2 offset through reforestation and forest protection.',
    currentPrice: 45.50,
    totalSupply: 50000,
    circulatingSupply: 32000,
    verificationScore: 98,
    location: 'Brazil',
    ownerId: 'QUBICECO987654321',
    createdAt: '2025-02-20T00:00:00Z',
    updatedAt: '2025-11-28T00:00:00Z',
    annualYield: 0,
    lockPeriod: 365,
  },
  '3': {
    id: '3',
    name: 'Swiss Government Bond 2030',
    symbol: 'SGB30',
    assetType: 'treasury',
    description: 'Tokenized Swiss government treasury bond with maturity in 2030. Backed by the full faith and credit of the Swiss Confederation.',
    currentPrice: 1050.00,
    totalSupply: 5000,
    circulatingSupply: 4200,
    verificationScore: 100,
    location: 'Switzerland',
    ownerId: 'QUBICFIN456789123',
    createdAt: '2025-03-10T00:00:00Z',
    updatedAt: '2025-12-05T00:00:00Z',
    annualYield: 3.2,
    lockPeriod: 0,
  },
  '4': {
    id: '4',
    name: 'Vintage Wine Collection',
    symbol: 'VWC',
    assetType: 'collectible',
    description: 'Rare vintage wine collection from the prestigious Bordeaux region. Includes 100 bottles from 1990-2010 vintages stored in climate-controlled facilities.',
    currentPrice: 180.00,
    totalSupply: 1000,
    circulatingSupply: 850,
    verificationScore: 92,
    location: 'France',
    ownerId: 'QUBICART111222333',
    createdAt: '2025-04-05T00:00:00Z',
    updatedAt: '2025-11-15T00:00:00Z',
    annualYield: 12.0,
    lockPeriod: 180,
  },
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const assetId = params.id as string;

  const { isWalletConnected, walletAddress } = useUserStore();
  const { open: openWalletModal } = useWalletModal();

  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      try {
        const result = await api.getAsset(assetId);
        return result;
      } catch (err) {
        // Return mock data if API is not available
        return mockAssets[assetId] || mockAssets['1'];
      }
    },
    enabled: !!assetId,
  });

  const { data: orderbook } = useQuery<OrderBook>({
    queryKey: ['orderbook', assetId],
    queryFn: async () => {
      try {
        const result = await api.getOrderBook(assetId);
        return result;
      } catch (err) {
        // Mock orderbook
        return {
          bids: [
            { price: (asset?.currentPrice || 100) * 0.98, quantity: 50 },
            { price: (asset?.currentPrice || 100) * 0.97, quantity: 100 },
            { price: (asset?.currentPrice || 100) * 0.95, quantity: 200 },
          ],
          asks: [
            { price: (asset?.currentPrice || 100) * 1.02, quantity: 75 },
            { price: (asset?.currentPrice || 100) * 1.03, quantity: 150 },
            { price: (asset?.currentPrice || 100) * 1.05, quantity: 250 },
          ],
        };
      }
    },
    enabled: !!assetId && !!asset,
    refetchInterval: 5000,
  });

  const { data: marketStats } = useQuery({
    queryKey: ['market-stats', assetId],
    queryFn: async () => {
      try {
        const result = await api.getMarketStats(assetId);
        return result;
      } catch (err) {
        // Mock market stats
        return {
          volume24h: Math.random() * 1000000,
          priceChange24h: Math.random() * 20 - 10,
          holders: Math.floor(Math.random() * 1000) + 100,
        };
      }
    },
    enabled: !!assetId,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { assetId: string; type: string; quantity: number; pricePerToken: number }) => {
      // Simulate order creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, orderId: `ORD-${Date.now()}` };
    },
    onSuccess: () => {
      toast({
        title: 'Order Placed!',
        description: 'Your order has been submitted to the order book.',
      });
      queryClient.invalidateQueries({ queryKey: ['orderbook', assetId] });
      setAmount('');
      setPrice('');
    },
    onError: (error: any) => {
      toast({
        title: 'Order Failed',
        description: error.message || 'Unable to place order.',
        variant: 'destructive',
      });
    },
  });

  const handleOrder = () => {
    if (!isWalletConnected) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to trade.',
        variant: 'destructive',
      });
      return;
    }

    const quantity = parseInt(amount);
    const priceValue = parseFloat(price);

    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid quantity.',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid price.',
        variant: 'destructive',
      });
      return;
    }

    createOrderMutation.mutate({
      assetId,
      type: orderType === 'buy' ? 'buy' : 'sell',
      quantity,
      pricePerToken: priceValue,
    });
  };

  const typeConfig = {
    real_estate: { icon: Building2, color: 'emerald', label: 'Real Estate' },
    commodity: { icon: Coins, color: 'amber', label: 'Commodity' },
    collectible: { icon: Gem, color: 'purple', label: 'Collectible' },
    financial: { icon: FileText, color: 'blue', label: 'Financial' },
  };

  if (isLoading) {
    return <AssetDetailSkeleton />;
  }

  if (!asset) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Asset Not Found</h3>
          <p className="text-gray-400 mb-6">This asset may have been removed or doesn&apos;t exist.</p>
          <Link href="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const config = typeConfig[asset.assetType as keyof typeof typeConfig] || typeConfig.financial;
  const TypeIcon = config.icon;
  const priceChange = marketStats?.priceChange24h || 0;
  const isPriceUp = priceChange >= 0;
  const totalValue = (parseFloat(amount) || 0) * (parseFloat(price) || 0);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4">
        {/* Back & Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Link href="/marketplace">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFavorite(!isFavorite)}
              className={cn(
                'text-gray-400 hover:text-white',
                isFavorite && 'text-red-500 hover:text-red-400'
              )}
            >
              <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Asset Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white/5 border-white/10 overflow-hidden">
                  {/* Image */}
                  <div className="relative h-64 md:h-80 bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TypeIcon className="w-24 h-24 text-purple-500/30" />
                    </div>
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className={cn(
                        'text-white',
                        `bg-${config.color}-500`
                      )}>
                        {config.label}
                      </Badge>
                      {asset.verificationScore && asset.verificationScore >= 80 && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          AI Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                          {asset.name}
                        </h1>
                        <p className="text-gray-400">{asset.symbol || 'RWA'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">
                          {formatCurrency(asset.currentPrice || asset.valuation || 0)}
                        </p>
                        <div className={cn(
                          'flex items-center gap-1 text-sm',
                          isPriceUp ? 'text-green-400' : 'text-red-400'
                        )}>
                          {isPriceUp ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                          {isPriceUp ? '+' : ''}{priceChange.toFixed(2)}% (24h)
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-400 mb-6">{asset.description}</p>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-black/30 rounded-lg p-4">
                        <p className="text-gray-500 text-sm mb-1">Market Cap</p>
                        <p className="text-white font-semibold">
                          {formatCurrency((asset.currentPrice || 0) * (asset.totalSupply || 0))}
                        </p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4">
                        <p className="text-gray-500 text-sm mb-1">24h Volume</p>
                        <p className="text-white font-semibold">
                          {formatCurrency(marketStats?.volume24h || 0)}
                        </p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4">
                        <p className="text-gray-500 text-sm mb-1">Total Supply</p>
                        <p className="text-white font-semibold">
                          {formatNumber(asset.totalSupply || 0)}
                        </p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-4">
                        <p className="text-gray-500 text-sm mb-1">Holders</p>
                        <p className="text-white font-semibold">
                          {formatNumber(marketStats?.holders || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Asset Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Asset Details</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <DetailRow icon={Globe} label="Location" value={asset.location || 'Global'} />
                      <DetailRow icon={Calendar} label="Tokenized" value={new Date(asset.createdAt || Date.now()).toLocaleDateString()} />
                      <DetailRow icon={Users} label="Owner" value={truncateAddress(asset.ownerId || '')} />
                      <DetailRow icon={Award} label="Verification Score" value={`${asset.verificationScore || 0}/100`} />
                    </div>
                    <div className="space-y-4">
                      <DetailRow icon={Tag} label="Token Standard" value="Qubic RWA" />
                      <DetailRow icon={Shield} label="Compliance" value="Fully Compliant" />
                      <DetailRow icon={BarChart3} label="Annual Yield" value={asset.annualYield ? `${asset.annualYield}%` : 'N/A'} />
                      <DetailRow icon={Clock} label="Lock Period" value={asset.lockPeriod ? `${asset.lockPeriod} days` : 'None'} />
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Order Book */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/5 border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Order Book
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Bids */}
                    <div>
                      <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Buy Orders
                      </h3>
                      <div className="space-y-2">
                        {orderbook?.bids?.slice(0, 5).map((bid, i) => (
                          <div key={i} className="flex justify-between text-sm bg-green-500/10 rounded px-3 py-2">
                            <span className="text-green-400">{formatCurrency(bid.price)}</span>
                            <span className="text-gray-400">{formatNumber(bid.quantity)}</span>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-sm">No buy orders</p>
                        )}
                      </div>
                    </div>
                    {/* Asks */}
                    <div>
                      <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Sell Orders
                      </h3>
                      <div className="space-y-2">
                        {orderbook?.asks?.slice(0, 5).map((ask, i) => (
                          <div key={i} className="flex justify-between text-sm bg-red-500/10 rounded px-3 py-2">
                            <span className="text-red-400">{formatCurrency(ask.price)}</span>
                            <span className="text-gray-400">{formatNumber(ask.quantity)}</span>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-sm">No sell orders</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar - Trade Panel */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="sticky top-24 space-y-6"
              >
                {/* Trade Card */}
                <Card className="bg-white/5 border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-purple-400" />
                    Trade
                  </h2>

                  {/* Buy/Sell Toggle */}
                  <div className="flex bg-black/30 rounded-lg p-1 mb-6">
                    <Button
                      onClick={() => setOrderType('buy')}
                      className={cn(
                        'flex-1',
                        orderType === 'buy'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-transparent text-gray-400 hover:text-white'
                      )}
                    >
                      Buy
                    </Button>
                    <Button
                      onClick={() => setOrderType('sell')}
                      className={cn(
                        'flex-1',
                        orderType === 'sell'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-transparent text-gray-400 hover:text-white'
                      )}
                    >
                      Sell
                    </Button>
                  </div>

                  {/* Form */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Amount</label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        min="1"
                        className="bg-black/30 border-white/20 text-white text-lg"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Price per Token</label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder={String(asset.currentPrice || 0)}
                          step="0.01"
                          className="bg-black/30 border-white/20 text-white text-lg pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">USD</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrice(String(asset.currentPrice || 0))}
                        className="text-purple-400 text-xs mt-1"
                      >
                        Use market price
                      </Button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-black/30 rounded-lg p-4 mb-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total</span>
                      <span className="text-white">{formatCurrency(totalValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Fee (0.3%)</span>
                      <span className="text-white">{formatCurrency(totalValue * 0.003)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">You {orderType === 'buy' ? 'pay' : 'receive'}</span>
                        <span className="text-xl font-bold text-white">
                          {formatCurrency(orderType === 'buy' ? totalValue * 1.003 : totalValue * 0.997)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleOrder}
                    disabled={!isWalletConnected || createOrderMutation.isPending}
                    className={cn(
                      'w-full text-lg py-6',
                      orderType === 'buy'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    )}
                  >
                    {!isWalletConnected ? (
                      <>
                        <Wallet className="w-5 h-5 mr-2" />
                        Connect Wallet
                      </>
                    ) : createOrderMutation.isPending ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                        />
                        Processing...
                      </>
                    ) : (
                      <>
                        {orderType === 'buy' ? 'Buy' : 'Sell'} {asset.symbol || 'Tokens'}
                      </>
                    )}
                  </Button>
                </Card>

                {/* Verification Status */}
                <Card className="bg-white/5 border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    AI Verification
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Status</span>
                      <Badge className="bg-green-500/20 text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Score</span>
                      <span className="text-white font-medium">{asset.verificationScore || 0}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">AI Model</span>
                      <span className="text-white">Gemini 1.5 Flash</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Last Verified</span>
                      <span className="text-white">{new Date(asset.updatedAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </DashboardLayout>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10">
      <span className="text-gray-400 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function AssetDetailSkeleton() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4">
        <Skeleton className="h-8 w-40 bg-gray-800 mb-6" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[500px] bg-gray-800 rounded-xl" />
            <Skeleton className="h-[300px] bg-gray-800 rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-[450px] bg-gray-800 rounded-xl" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
