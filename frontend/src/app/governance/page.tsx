'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vote,
  Plus,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Search,
  ThumbsUp,
  ThumbsDown,
  Timer,
  Gavel,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn, formatNumber, truncateAddress } from '@/lib/utils';
import { useUserStore } from '@/lib/store';

type ProposalStatus = 'active' | 'passed' | 'rejected' | 'pending';
type ProposalFilter = 'all' | ProposalStatus;

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  quorum: number;
  startTime: string;
  endTime: string;
  category: 'parameter' | 'feature' | 'treasury' | 'emergency';
  assetId?: string;
  assetName?: string;
}

export default function GovernancePage() {
  const [filter, setFilter] = useState<ProposalFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isWalletConnected } = useUserStore();

  // Mock data - replace with actual API call
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['proposals', filter],
    queryFn: async (): Promise<Proposal[]> => [
      {
        id: '1',
        title: 'Reduce Trading Fee to 0.2%',
        description: 'Proposal to reduce the platform trading fee from 0.3% to 0.2% to increase trading volume and competitiveness.',
        proposer: 'QUBIC...X7Y8Z',
        status: 'active',
        votesFor: 15420000,
        votesAgainst: 3280000,
        totalVoters: 1847,
        quorum: 50,
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'parameter',
      },
      {
        id: '2',
        title: 'Add NFT Support for Collectibles',
        description: 'Enable NFT minting and trading for verified collectible assets, expanding marketplace capabilities.',
        proposer: 'QUBIC...A1B2C',
        status: 'active',
        votesFor: 8750000,
        votesAgainst: 2100000,
        totalVoters: 923,
        quorum: 50,
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'feature',
      },
      {
        id: '3',
        title: 'Community Treasury Allocation',
        description: 'Allocate 5% of burned fees to a community development treasury for ecosystem grants.',
        proposer: 'QUBIC...D3E4F',
        status: 'passed',
        votesFor: 22100000,
        votesAgainst: 4500000,
        totalVoters: 2341,
        quorum: 50,
        startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'treasury',
      },
      {
        id: '4',
        title: 'Emergency: Pause Manhattan Penthouse Trading',
        description: 'Emergency proposal to temporarily pause trading on Manhattan Penthouse asset due to verification concerns.',
        proposer: 'QUBIC...G5H6I',
        status: 'rejected',
        votesFor: 3200000,
        votesAgainst: 18700000,
        totalVoters: 1654,
        quorum: 75,
        startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'emergency',
        assetId: 'asset-123',
        assetName: 'Manhattan Penthouse',
      },
      {
        id: '5',
        title: 'Increase AI Verification Depth',
        description: 'Enhance Gemini AI verification to include additional document analysis and cross-referencing.',
        proposer: 'QUBIC...J7K8L',
        status: 'pending',
        votesFor: 0,
        votesAgainst: 0,
        totalVoters: 0,
        quorum: 50,
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'feature',
      },
    ],
  });

  const { data: stats } = useQuery({
    queryKey: ['governance-stats'],
    queryFn: async () => ({
      totalProposals: 47,
      activeProposals: 2,
      totalVoters: 12847,
      passRate: 78,
    }),
  });

  const voteMutation = useMutation({
    mutationFn: async ({ proposalId, vote }: { proposalId: string; vote: 'for' | 'against' }) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Vote Submitted!',
        description: 'Your vote has been recorded on-chain.',
      });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
    onError: () => {
      toast({
        title: 'Vote Failed',
        description: 'Unable to submit vote. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleVote = (proposalId: string, vote: 'for' | 'against') => {
    if (!isWalletConnected) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to vote.',
        variant: 'destructive',
      });
      return;
    }
    voteMutation.mutate({ proposalId, vote });
  };

  const filteredProposals = proposals?.filter((p) => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters: { id: ProposalFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: proposals?.length },
    { id: 'active', label: 'Active', count: proposals?.filter((p) => p.status === 'active').length },
    { id: 'pending', label: 'Pending', count: proposals?.filter((p) => p.status === 'pending').length },
    { id: 'passed', label: 'Passed', count: proposals?.filter((p) => p.status === 'passed').length },
    { id: 'rejected', label: 'Rejected', count: proposals?.filter((p) => p.status === 'rejected').length },
  ];

  return (
    <DashboardLayout>
      <main className="pt-8 pb-16 px-6 lg:px-8">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Gavel className="w-3 h-3 mr-1" />
              Decentralized Governance
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Shape the <span className="text-gradient bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Future</span> of VeriAssets
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Participate in governance decisions. Vote on proposals that affect platform parameters,
              features, and individual asset policies.
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
              { label: 'Total Proposals', value: stats?.totalProposals || 0, icon: FileText, color: 'text-purple-400' },
              { label: 'Active Now', value: stats?.activeProposals || 0, icon: Vote, color: 'text-green-400' },
              { label: 'Total Voters', value: formatNumber(stats?.totalVoters || 0), icon: Users, color: 'text-blue-400' },
              { label: 'Pass Rate', value: `${stats?.passRate || 0}%`, icon: TrendingUp, color: 'text-orange-400' },
            ].map((stat) => (
              <Card key={stat.label} className="bg-white/5 border-white/10 p-4 text-center">
                <stat.icon className={cn('w-6 h-6 mx-auto mb-2', stat.color)} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </Card>
            ))}
          </motion.div>
        </section>

        {/* Actions & Filters */}
        <section className="container mx-auto px-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filters.map((f) => (
                <Button
                  key={f.id}
                  variant={filter === f.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    filter === f.id
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  {f.label}
                  {f.count !== undefined && (
                    <Badge className="ml-2 bg-white/10 text-xs">{f.count}</Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Create Proposal */}
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Proposal
            </Button>
          </div>
        </section>

        {/* Proposals List */}
        <section className="container mx-auto px-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <ProposalSkeleton key={i} />
              ))}
            </div>
          ) : filteredProposals?.length ? (
            <motion.div layout className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredProposals.map((proposal, index) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    index={index}
                    onVote={handleVote}
                    isVoting={voteMutation.isPending}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Proposals Found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery ? 'Try a different search term.' : 'Be the first to create a proposal!'}
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Proposal
              </Button>
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}

function ProposalCard({
  proposal,
  index,
  onVote,
  isVoting,
}: {
  proposal: Proposal;
  index: number;
  onVote: (id: string, vote: 'for' | 'against') => void;
  isVoting: boolean;
}) {
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 50;
  const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 50;
  const quorumReached = (proposal.totalVoters / 10000) * 100 >= proposal.quorum;

  const timeLeft = new Date(proposal.endTime).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  const statusConfig = {
    active: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Vote },
    pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
    passed: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle2 },
    rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  };

  const categoryColors = {
    parameter: 'bg-purple-500/20 text-purple-400',
    feature: 'bg-blue-500/20 text-blue-400',
    treasury: 'bg-green-500/20 text-green-400',
    emergency: 'bg-red-500/20 text-red-400',
  };

  const status = statusConfig[proposal.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-white/5 border-white/10 p-6 hover:border-blue-500/50 transition-all duration-300">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-3">
              <Badge className={status.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {proposal.status}
              </Badge>
              <Badge className={categoryColors[proposal.category]}>
                {proposal.category}
              </Badge>
              {proposal.assetName && (
                <Badge className="bg-white/10 text-gray-300">
                  Asset: {proposal.assetName}
                </Badge>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{proposal.title}</h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{proposal.description}</p>

            {/* Proposer & Time */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {truncateAddress(proposal.proposer)}
              </span>
              {proposal.status === 'active' && (
                <span className="flex items-center gap-1">
                  <Timer className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400">{daysLeft}d {hoursLeft}h left</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {formatNumber(proposal.totalVoters)} voters
              </span>
            </div>
          </div>

          {/* Voting Section */}
          <div className="lg:w-80 space-y-4">
            {/* Vote Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-400 flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  For: {forPercentage.toFixed(1)}%
                </span>
                <span className="text-red-400 flex items-center gap-1">
                  Against: {againstPercentage.toFixed(1)}%
                  <ThumbsDown className="w-4 h-4" />
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${forPercentage}%` }}
                />
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${againstPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatNumber(proposal.votesFor)} votes</span>
                <span>{formatNumber(proposal.votesAgainst)} votes</span>
              </div>
            </div>

            {/* Quorum Status */}
            <div className="bg-black/30 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Quorum ({proposal.quorum}%)</span>
                <span className={quorumReached ? 'text-green-400' : 'text-yellow-400'}>
                  {quorumReached ? 'Reached' : 'Not Reached'}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    quorumReached ? 'bg-green-500' : 'bg-yellow-500'
                  )}
                  style={{ width: `${Math.min(100, (proposal.totalVoters / 10000) * 100)}%` }}
                />
              </div>
            </div>

            {/* Vote Buttons */}
            {proposal.status === 'active' && (
              <div className="flex gap-2">
                <Button
                  onClick={() => onVote(proposal.id, 'for')}
                  disabled={isVoting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Vote For
                </Button>
                <Button
                  onClick={() => onVote(proposal.id, 'against')}
                  disabled={isVoting}
                  variant="outline"
                  className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Against
                </Button>
              </div>
            )}

            {proposal.status === 'pending' && (
              <Button disabled className="w-full bg-gray-700">
                <Clock className="w-4 h-4 mr-2" />
                Voting Not Started
              </Button>
            )}

            {(proposal.status === 'passed' || proposal.status === 'rejected') && (
              <Button variant="outline" className="w-full border-white/20">
                View Results
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ProposalSkeleton() {
  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 bg-gray-800" />
            <Skeleton className="h-6 w-24 bg-gray-800" />
          </div>
          <Skeleton className="h-6 w-3/4 bg-gray-800" />
          <Skeleton className="h-4 w-full bg-gray-800" />
          <Skeleton className="h-4 w-2/3 bg-gray-800" />
        </div>
        <div className="lg:w-80 space-y-4">
          <Skeleton className="h-20 bg-gray-800 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 bg-gray-800" />
            <Skeleton className="h-10 flex-1 bg-gray-800" />
          </div>
        </div>
      </div>
    </Card>
  );
}
