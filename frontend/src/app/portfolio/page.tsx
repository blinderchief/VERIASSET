'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Gem,
  Coins,
  FileText,
  Eye,
  DollarSign,
  BarChart3,
  Plus,
  Settings,
  Download,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { useUserStore } from '@/lib/store';
import { WalletConnectModal, useWalletModal } from '@/components/wallet/wallet-connect-modal';

interface PortfolioAsset {
  id: string;
  name: string;
  type: 'real_estate' | 'commodity' | 'collectible' | 'financial';
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  pnl: number;
  pnlPercentage: number;
  image?: string;
}

interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalPnl: number;
  totalPnlPercentage: number;
  assetCount: number;
  bestPerformer: string;
  worstPerformer: string;
}

export default function PortfolioPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
  const { walletAddress, isWalletConnected } = useUserStore();
  const { open } = useWalletModal();

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio', walletAddress],
    queryFn: async (): Promise<PortfolioAsset[]> => [
      {
        id: '1',
        name: 'Manhattan Penthouse',
        type: 'real_estate',
        symbol: 'MHPH',
        quantity: 150,
        avgBuyPrice: 125.50,
        currentPrice: 142.30,
        totalValue: 21345,
        pnl: 2520,
        pnlPercentage: 13.4,
      },
      {
        id: '2',
        name: 'Gold Reserve Fund',
        type: 'commodity',
        symbol: 'GLDF',
        quantity: 500,
        avgBuyPrice: 45.00,
        currentPrice: 48.75,
        totalValue: 24375,
        pnl: 1875,
        pnlPercentage: 8.3,
      },
      {
        id: '3',
        name: 'Vintage Ferrari 250 GTO',
        type: 'collectible',
        symbol: 'VF250',
        quantity: 25,
        avgBuyPrice: 1200.00,
        currentPrice: 1050.00,
        totalValue: 26250,
        pnl: -3750,
        pnlPercentage: -12.5,
      },
      {
        id: '4',
        name: 'Swiss Treasury Bond',
        type: 'financial',
        symbol: 'STBND',
        quantity: 1000,
        avgBuyPrice: 10.20,
        currentPrice: 10.85,
        totalValue: 10850,
        pnl: 650,
        pnlPercentage: 6.4,
      },
      {
        id: '5',
        name: 'Tokyo Commercial Tower',
        type: 'real_estate',
        symbol: 'TKCT',
        quantity: 75,
        avgBuyPrice: 280.00,
        currentPrice: 315.50,
        totalValue: 23662.50,
        pnl: 2662.50,
        pnlPercentage: 12.7,
      },
    ],
    enabled: isWalletConnected,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['portfolio-stats', walletAddress, timeRange],
    queryFn: async (): Promise<PortfolioStats> => ({
      totalValue: 106482.50,
      totalInvested: 102525,
      totalPnl: 3957.50,
      totalPnlPercentage: 3.86,
      assetCount: 5,
      bestPerformer: 'Manhattan Penthouse',
      worstPerformer: 'Vintage Ferrari 250 GTO',
    }),
    enabled: isWalletConnected,
  });

  // Calculate allocation percentages
  const allocation = portfolio?.reduce((acc, asset) => {
    const type = asset.type;
    acc[type] = (acc[type] || 0) + asset.totalValue;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = Object.values(allocation || {}).reduce((a, b) => a + b, 0);

  const typeIcons = {
    real_estate: Building2,
    commodity: Coins,
    collectible: Gem,
    financial: FileText,
  };

  const typeColors = {
    real_estate: 'bg-emerald-500',
    commodity: 'bg-amber-500',
    collectible: 'bg-purple-500',
    financial: 'bg-blue-500',
  };

  return (
    <>
      <SignedIn>
        <DashboardLayout>
          <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Portfolio</h1>
                <p className="text-gray-400">Track and manage your RWA investments</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Time Range Selector */}
                <div className="flex bg-white/5 rounded-lg p-1">
                  {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                    <Button
                      key={range}
                      variant="ghost"
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className={cn(
                        'px-3',
                        timeRange === range
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      )}
                    >
                      {range === 'all' ? 'All' : range.toUpperCase()}
                    </Button>
                  ))}
                </div>
                <Button variant="outline" className="border-white/20">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {!isWalletConnected ? (
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400 mb-6">
                  Connect your Qubic wallet to view your portfolio and holdings.
                </p>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={open}
                >
                  Connect Wallet
                </Button>
              </Card>
            ) : (
                <>
                  {/* Stats Overview */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatsCard
                      title="Total Value"
                      value={formatCurrency(stats?.totalValue || 0)}
                      icon={DollarSign}
                      color="text-green-400"
                      isLoading={statsLoading}
                    />
                    <StatsCard
                      title="Total P&L"
                      value={formatCurrency(stats?.totalPnl || 0)}
                      change={stats?.totalPnlPercentage}
                      icon={stats?.totalPnl && stats.totalPnl >= 0 ? TrendingUp : TrendingDown}
                      color={stats?.totalPnl && stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
                      isLoading={statsLoading}
                    />
                    <StatsCard
                      title="Total Invested"
                      value={formatCurrency(stats?.totalInvested || 0)}
                      icon={Wallet}
                      color="text-blue-400"
                      isLoading={statsLoading}
                    />
                    <StatsCard
                      title="Assets Owned"
                      value={String(stats?.assetCount || 0)}
                      icon={PieChart}
                      color="text-purple-400"
                      isLoading={statsLoading}
                    />
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6 mb-8">
                    {/* Allocation Chart */}
                    <Card className="bg-white/5 border-white/10 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-purple-400" />
                        Asset Allocation
                      </h3>
                      <div className="space-y-4">
                        {allocation && Object.entries(allocation).map(([type, value]) => {
                          const percentage = (value / totalValue) * 100;
                          const Icon = typeIcons[type as keyof typeof typeIcons];
                          const color = typeColors[type as keyof typeof typeColors];
                          return (
                            <div key={type}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-400 flex items-center gap-2 capitalize">
                                  <Icon className="w-4 h-4" />
                                  {type.replace('_', ' ')}
                                </span>
                                <span className="text-white font-medium">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.5 }}
                                  className={cn('h-full', color)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Top Performers */}
                    <Card className="bg-white/5 border-white/10 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Best Performer
                      </h3>
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                        <p className="text-green-400 font-semibold">{stats?.bestPerformer}</p>
                        <p className="text-2xl font-bold text-white mt-1">+13.4%</p>
                        <p className="text-gray-400 text-sm">Last 30 days</p>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-400" />
                        Worst Performer
                      </h3>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-red-400 font-semibold">{stats?.worstPerformer}</p>
                        <p className="text-2xl font-bold text-white mt-1">-12.5%</p>
                        <p className="text-gray-400 text-sm">Last 30 days</p>
                      </div>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="bg-white/5 border-white/10 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <Link href="/marketplace" className="block">
                          <Button className="w-full bg-purple-600 hover:bg-purple-700 justify-start">
                            <Plus className="w-4 h-4 mr-2" />
                            Buy More Assets
                          </Button>
                        </Link>
                        <Link href="/launchpad" className="block">
                          <Button variant="outline" className="w-full border-white/20 justify-start">
                            <Gem className="w-4 h-4 mr-2" />
                            View IPOs
                          </Button>
                        </Link>
                        <Link href="/governance" className="block">
                          <Button variant="outline" className="w-full border-white/20 justify-start">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Vote on Proposals
                          </Button>
                        </Link>
                        <Button variant="ghost" className="w-full justify-start text-gray-400">
                          <Settings className="w-4 h-4 mr-2" />
                          Portfolio Settings
                        </Button>
                      </div>
                    </Card>
                  </div>

                  {/* Holdings Table */}
                  <Card className="bg-white/5 border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Holdings</h3>
                      <Button variant="ghost" size="sm" className="text-gray-400">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>

                    {portfolioLoading ? (
                      <div className="p-6 space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 bg-gray-800" />
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-gray-500 text-sm border-b border-white/10">
                              <th className="p-4 font-medium">Asset</th>
                              <th className="p-4 font-medium">Type</th>
                              <th className="p-4 font-medium text-right">Quantity</th>
                              <th className="p-4 font-medium text-right">Avg. Price</th>
                              <th className="p-4 font-medium text-right">Current Price</th>
                              <th className="p-4 font-medium text-right">Value</th>
                              <th className="p-4 font-medium text-right">P&L</th>
                              <th className="p-4 font-medium text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {portfolio?.map((asset) => {
                              const Icon = typeIcons[asset.type];
                              const isProfitable = asset.pnl >= 0;
                              return (
                                <motion.tr
                                  key={asset.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        'w-10 h-10 rounded-lg flex items-center justify-center',
                                        typeColors[asset.type] + '/20'
                                      )}>
                                        <Icon className={cn('w-5 h-5', typeColors[asset.type].replace('bg-', 'text-'))} />
                                      </div>
                                      <div>
                                        <p className="text-white font-medium">{asset.name}</p>
                                        <p className="text-gray-500 text-sm">{asset.symbol}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <Badge className={cn(
                                      'capitalize',
                                      typeColors[asset.type].replace('bg-', 'bg-') + '/20',
                                      typeColors[asset.type].replace('bg-', 'text-')
                                    )}>
                                      {asset.type.replace('_', ' ')}
                                    </Badge>
                                  </td>
                                  <td className="p-4 text-right text-white">{formatNumber(asset.quantity)}</td>
                                  <td className="p-4 text-right text-white">{formatCurrency(asset.avgBuyPrice)}</td>
                                  <td className="p-4 text-right text-white">{formatCurrency(asset.currentPrice)}</td>
                                  <td className="p-4 text-right text-white font-medium">{formatCurrency(asset.totalValue)}</td>
                                  <td className="p-4 text-right">
                                    <div className={cn(
                                      'flex items-center justify-end gap-1',
                                      isProfitable ? 'text-green-400' : 'text-red-400'
                                    )}>
                                      {isProfitable ? (
                                        <ArrowUpRight className="w-4 h-4" />
                                      ) : (
                                        <ArrowDownRight className="w-4 h-4" />
                                      )}
                                      <span className="font-medium">
                                        {isProfitable ? '+' : ''}{formatCurrency(asset.pnl)}
                                      </span>
                                      <span className="text-sm">
                                        ({isProfitable ? '+' : ''}{asset.pnlPercentage}%)
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                      <Link href={`/marketplace/${asset.id}`}>
                                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      </Link>
                                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                        Sell
                                      </Button>
                                    </div>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}
          </div>
          <WalletConnectModal isOpen={useWalletModal.getState().isOpen} onClose={useWalletModal.getState().close} />
        </DashboardLayout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  isLoading,
}: {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 p-6">
        <Skeleton className="h-4 w-24 bg-gray-800 mb-2" />
        <Skeleton className="h-8 w-32 bg-gray-800" />
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">{title}</p>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {change !== undefined && (
        <p className={cn(
          'text-sm flex items-center gap-1 mt-1',
          change >= 0 ? 'text-green-400' : 'text-red-400'
        )}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </p>
      )}
    </Card>
  );
}
