'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  ArrowUpRight,
  Search,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Wallet,
  ShoppingCart,
  Vote,
  Rocket,
  Download,
} from 'lucide-react';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { useUserStore } from '@/lib/store';
import { useWalletModal } from '@/components/wallet/wallet-connect-modal';

type TransactionType = 'buy' | 'sell' | 'ipo' | 'vote' | 'transfer';
type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  assetName: string;
  assetSymbol: string;
  amount: number;
  price: number;
  total: number;
  fee: number;
  timestamp: string;
  txHash?: string;
  description?: string;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'buy',
    status: 'completed',
    assetName: 'Manhattan Penthouse',
    assetSymbol: 'MHPH',
    amount: 50,
    price: 142.30,
    total: 7115,
    fee: 21.35,
    timestamp: '2025-12-07T10:30:00Z',
    txHash: 'QUBIC...abc123',
    description: 'Purchased 50 tokens',
  },
  {
    id: '2',
    type: 'ipo',
    status: 'completed',
    assetName: 'Swiss Treasury Bond',
    assetSymbol: 'STBND',
    amount: 1000,
    price: 10.20,
    total: 10200,
    fee: 102,
    timestamp: '2025-12-06T15:45:00Z',
    txHash: 'QUBIC...def456',
    description: 'Dutch Auction IPO participation',
  },
  {
    id: '3',
    type: 'sell',
    status: 'completed',
    assetName: 'Gold Reserve Fund',
    assetSymbol: 'GLDF',
    amount: 100,
    price: 48.75,
    total: 4875,
    fee: 14.63,
    timestamp: '2025-12-05T09:15:00Z',
    txHash: 'QUBIC...ghi789',
    description: 'Sold 100 tokens',
  },
  {
    id: '4',
    type: 'vote',
    status: 'completed',
    assetName: 'Reduce Trading Fee',
    assetSymbol: 'PROP',
    amount: 15000,
    price: 0,
    total: 0,
    fee: 0,
    timestamp: '2025-12-04T14:20:00Z',
    description: 'Voted FOR with 15,000 voting power',
  },
  {
    id: '5',
    type: 'buy',
    status: 'pending',
    assetName: 'Tokyo Commercial Tower',
    assetSymbol: 'TKCT',
    amount: 25,
    price: 315.50,
    total: 7887.50,
    fee: 23.66,
    timestamp: '2025-12-07T11:00:00Z',
    description: 'Awaiting confirmation',
  },
  {
    id: '6',
    type: 'transfer',
    status: 'failed',
    assetName: 'Vintage Ferrari 250 GTO',
    assetSymbol: 'VF250',
    amount: 10,
    price: 1050,
    total: 10500,
    fee: 0,
    timestamp: '2025-12-03T16:30:00Z',
    description: 'Insufficient balance',
  },
];

const typeConfig = {
  buy: { icon: ShoppingCart, label: 'Purchase', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  sell: { icon: TrendingDown, label: 'Sale', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ipo: { icon: Rocket, label: 'IPO', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  vote: { icon: Vote, label: 'Vote', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  transfer: { icon: ArrowUpRight, label: 'Transfer', color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

const statusConfig = {
  completed: { icon: CheckCircle2, label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  pending: { icon: Loader2, label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  failed: { icon: XCircle, label: 'Failed', color: 'text-rose-400', bg: 'bg-rose-500/20' },
};

export default function HistoryPage() {
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const { isWalletConnected } = useUserStore();
  const { open } = useWalletModal();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filter, dateRange],
    queryFn: async (): Promise<Transaction[]> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockTransactions;
    },
    enabled: isWalletConnected,
  });

  const filteredTransactions = transactions?.filter(tx => {
    const matchesFilter = filter === 'all' || tx.type === filter;
    const matchesSearch = tx.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.assetSymbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    totalTransactions: transactions?.length || 0,
    totalVolume: transactions?.reduce((acc, tx) => acc + tx.total, 0) || 0,
    totalFees: transactions?.reduce((acc, tx) => acc + tx.fee, 0) || 0,
  };

  return (
    <>
      <SignedIn>
        <DashboardLayout>
          <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
                    <History className="w-6 h-6 text-violet-400" />
                  </div>
                  Transaction History
                </h1>
                <p className="text-gray-400">View and track all your platform activity</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="border-white/10 hover:bg-white/5">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {!isWalletConnected ? (
              <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-10 h-10 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Connect your Qubic wallet to view your transaction history and activity.
                </p>
                <Button 
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                  onClick={open}
                >
                  Connect Wallet
                </Button>
              </Card>
            ) : (
                <>
                  {/* Stats */}
                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-6">
                      <p className="text-gray-400 text-sm mb-1">Total Transactions</p>
                      <p className="text-2xl font-bold text-white">{stats.totalTransactions}</p>
                    </Card>
                    <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-6">
                      <p className="text-gray-400 text-sm mb-1">Total Volume</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalVolume)}</p>
                    </Card>
                    <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-6">
                      <p className="text-gray-400 text-sm mb-1">Total Fees Paid</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalFees)}</p>
                    </Card>
                  </div>

                  {/* Filters */}
                  <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Search */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          placeholder="Search transactions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-white/5 border-white/10"
                        />
                      </div>

                      {/* Type Filter */}
                      <div className="flex gap-2 flex-wrap">
                        {(['all', 'buy', 'sell', 'ipo', 'vote'] as const).map((type) => (
                          <Button
                            key={type}
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilter(type)}
                            className={cn(
                              'capitalize',
                              filter === type
                                ? 'bg-violet-600 text-white hover:bg-violet-700'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            )}
                          >
                            {type === 'all' ? 'All' : typeConfig[type].label}
                          </Button>
                        ))}
                      </div>

                      {/* Date Range */}
                      <div className="flex bg-white/5 rounded-lg p-1">
                        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                          <Button
                            key={range}
                            variant="ghost"
                            size="sm"
                            onClick={() => setDateRange(range)}
                            className={cn(
                              'px-3',
                              dateRange === range
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:text-white'
                            )}
                          >
                            {range === 'all' ? 'All' : range.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Transactions List */}
                  <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 overflow-hidden">
                    {isLoading ? (
                      <div className="p-6 space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-20 bg-gray-800" />
                        ))}
                      </div>
                    ) : filteredTransactions?.length === 0 ? (
                      <div className="p-12 text-center">
                        <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No transactions found</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        <AnimatePresence>
                          {filteredTransactions?.map((tx, index) => {
                            const typeInfo = typeConfig[tx.type];
                            const statusInfo = statusConfig[tx.status];
                            const TypeIcon = typeInfo.icon;
                            const StatusIcon = statusInfo.icon;

                            return (
                              <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 hover:bg-white/[0.02] transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  {/* Icon */}
                                  <div className={cn('p-3 rounded-xl', typeInfo.bg)}>
                                    <TypeIcon className={cn('w-5 h-5', typeInfo.color)} />
                                  </div>

                                  {/* Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-white font-medium truncate">{tx.assetName}</p>
                                      <Badge variant="outline" className="text-xs">
                                        {tx.assetSymbol}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                      <span className={typeInfo.color}>{typeInfo.label}</span>
                                      <span className="text-gray-500">•</span>
                                      <span className="text-gray-400">{tx.description}</span>
                                    </div>
                                  </div>

                                  {/* Amount */}
                                  <div className="text-right">
                                    {tx.total > 0 && (
                                      <p className={cn(
                                        'font-semibold',
                                        tx.type === 'sell' ? 'text-emerald-400' : 'text-white'
                                      )}>
                                        {tx.type === 'sell' ? '+' : '-'}{formatCurrency(tx.total)}
                                      </p>
                                    )}
                                    {tx.amount > 0 && tx.type !== 'vote' && (
                                      <p className="text-sm text-gray-400">
                                        {formatNumber(tx.amount)} @ {formatCurrency(tx.price)}
                                      </p>
                                    )}
                                    {tx.type === 'vote' && (
                                      <p className="text-sm text-gray-400">
                                        {formatNumber(tx.amount)} voting power
                                      </p>
                                    )}
                                  </div>

                                  {/* Status & Time */}
                                  <div className="text-right min-w-[120px]">
                                    <Badge className={cn('mb-1', statusInfo.bg, statusInfo.color)}>
                                      <StatusIcon className={cn(
                                        'w-3 h-3 mr-1',
                                        tx.status === 'pending' && 'animate-spin'
                                      )} />
                                      {statusInfo.label}
                                    </Badge>
                                    <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(tx.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>

                                  {/* Actions */}
                                  {tx.txHash && (
                                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    )}
                  </Card>
                </>
              )}
            </div>
          </DashboardLayout>
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </>
    );
  }
