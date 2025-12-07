'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api, { MarketAnalytics, TopAsset, RecentTrade, AssetDistribution } from '@/lib/api';

const ASSET_TYPE_COLORS: Record<string, string> = {
  'carbon_credit': 'bg-green-500',
  'real_estate': 'bg-blue-500',
  'treasury': 'bg-purple-500',
  'commodity': 'bg-orange-500',
  'other': 'bg-gray-500',
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  'carbon_credit': 'Carbon Credits',
  'real_estate': 'Real Estate',
  'treasury': 'Treasury',
  'commodity': 'Commodities',
  'other': 'Other',
};

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  prefix = '',
  suffix = '',
  isLoading = false,
}: { 
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
  isLoading?: boolean;
}) {
  const isPositive = change >= 0;
  
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-16 h-5" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-32 h-8" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-teal-500/20">
              <Icon className="w-5 h-5 text-teal-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(change)}%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TopAssetsTable({ assets, isLoading }: { assets: TopAsset[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            Top Performing Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-12 h-3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assets.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            Top Performing Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No assets listed yet</p>
            <p className="text-sm mt-2">Create your first RWA asset to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="w-5 h-5 text-teal-400" />
          Top Performing Assets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-white">{asset.name}</p>
                  <p className="text-sm text-gray-400">{asset.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-white">${asset.price.toLocaleString()}</p>
                <p className={`text-sm flex items-center gap-1 justify-end ${asset.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.change_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {asset.change_24h >= 0 ? '+' : ''}{asset.change_24h}%
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentTradesFeed({ trades, isLoading }: { trades: RecentTrade[]; isLoading: boolean }) {
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-yellow-400" />
            Live Trade Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-6 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="w-16 h-4" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                </div>
                <Skeleton className="w-16 h-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-yellow-400" />
            Live Trade Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No trades yet</p>
            <p className="text-sm mt-2">Start trading to see activity here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="w-5 h-5 text-yellow-400" />
          Live Trade Feed
          <span className="ml-auto flex items-center gap-1 text-xs font-normal text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trades.map((trade, index) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  trade.trade_type === 'buy' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {trade.trade_type.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-white">{trade.asset_symbol}</p>
                  <p className="text-xs text-gray-400">{trade.quantity} units @ ${trade.price.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{formatTimeAgo(trade.executed_at)}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AssetDistributionChart({ distribution, isLoading }: { distribution: AssetDistribution[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <PieChart className="w-5 h-5 text-purple-400" />
            Asset Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-12 h-4" />
                </div>
                <Skeleton className="w-full h-2 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (distribution.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <PieChart className="w-5 h-5 text-purple-400" />
            Asset Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No distribution data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <PieChart className="w-5 h-5 text-purple-400" />
          Asset Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {distribution.map((asset, index) => (
            <motion.div
              key={asset.asset_type}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">
                  {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}
                </span>
                <span className="text-white font-medium">{asset.percentage}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${asset.percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`h-full ${ASSET_TYPE_COLORS[asset.asset_type] || 'bg-gray-500'} rounded-full`}
                />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Stats summary */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Assets</span>
            <span className="text-white font-medium">
              {distribution.reduce((sum, d) => sum + d.count, 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<MarketAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getMarketAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load market analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = analytics?.market_stats || {
    total_volume_24h: 0,
    total_volume_change: 0,
    total_trades_24h: 0,
    trades_change: 0,
    active_listings: 0,
    listings_change: 0,
    avg_price: 0,
    price_change: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Market Analytics</h2>
          <p className="text-gray-400">Real-time market data and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="bg-white/5 border-white/10 hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Markets Open
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="24h Volume"
          value={stats.total_volume_24h}
          change={stats.total_volume_change}
          icon={BarChart3}
          prefix="$"
          isLoading={isLoading}
        />
        <StatCard
          title="24h Trades"
          value={stats.total_trades_24h}
          change={stats.trades_change}
          icon={Activity}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Listings"
          value={stats.active_listings}
          change={stats.listings_change}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title="Avg Price"
          value={stats.avg_price}
          change={stats.price_change}
          icon={PieChart}
          prefix="$"
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopAssetsTable 
            assets={analytics?.top_assets || []} 
            isLoading={isLoading} 
          />
        </div>
        <div>
          <AssetDistributionChart 
            distribution={analytics?.asset_distribution || []} 
            isLoading={isLoading} 
          />
        </div>
      </div>

      {/* Live Feed */}
      <RecentTradesFeed 
        trades={analytics?.recent_trades || []} 
        isLoading={isLoading} 
      />
      
      {/* Last Updated */}
      {analytics?.last_updated && (
        <p className="text-xs text-gray-500 text-right">
          Last updated: {new Date(analytics.last_updated).toLocaleString()}
        </p>
      )}
    </div>
  );
}
