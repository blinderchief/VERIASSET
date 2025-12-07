'use client';

import { useState, useEffect, useCallback } from 'react';
import { qubicSDK, QubicWallet, TokenBalance, QubicTransaction } from '@/lib/qubic-sdk';

/**
 * Hook for Qubic wallet connection and state
 */
export function useQubicWallet() {
  const [wallet, setWallet] = useState<QubicWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for wallet events
    const handleConnect = (data: unknown) => {
      setWallet(data as QubicWallet);
      setIsConnecting(false);
      setError(null);
    };

    const handleDisconnect = () => {
      setWallet(null);
    };

    qubicSDK.on('connected', handleConnect);
    qubicSDK.on('disconnected', handleDisconnect);

    // Check if already connected
    const existing = qubicSDK.getWallet();
    if (existing) {
      setWallet(existing);
    }

    return () => {
      qubicSDK.off('connected', handleConnect);
      qubicSDK.off('disconnected', handleDisconnect);
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await qubicSDK.connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await qubicSDK.disconnect();
  }, []);

  const refreshBalance = useCallback(async () => {
    if (wallet) {
      await qubicSDK.refreshBalance();
      setWallet(qubicSDK.getWallet());
    }
  }, [wallet]);

  return {
    wallet,
    isConnected: !!wallet?.connected,
    isConnecting,
    error,
    connect,
    disconnect,
    refreshBalance,
  };
}

/**
 * Hook for fetching and managing token balances
 */
export function useTokenBalances() {
  const { wallet, isConnected } = useQubicWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!isConnected) return;

    try {
      setIsLoading(true);
      setError(null);
      const tokens = await qubicSDK.getTokenBalances();
      setBalances(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    isLoading,
    error,
    refetch: fetchBalances,
  };
}

/**
 * Hook for sending transactions
 */
export function useTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<QubicTransaction | null>(null);

  const sendTransaction = useCallback(async (to: string, amount: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      const tx = await qubicSDK.sendTransaction(to, amount);
      setTransaction(tx);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const transferToken = useCallback(async (tokenId: string, to: string, amount: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      const tx = await qubicSDK.transferToken(tokenId, to, amount);
      setTransaction(tx);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transfer failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendTransaction,
    transferToken,
    isLoading,
    error,
    transaction,
  };
}

/**
 * Hook for RWA trading operations
 */
export function useRWATrading() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyToken = useCallback(async (tokenId: string, amount: bigint, price: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      const tx = await qubicSDK.tradeRWAToken({
        tokenId,
        amount,
        price,
        isBuy: true,
      });
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Buy order failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sellToken = useCallback(async (tokenId: string, amount: bigint, price: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      const tx = await qubicSDK.tradeRWAToken({
        tokenId,
        amount,
        price,
        isBuy: false,
      });
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sell order failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    buyToken,
    sellToken,
    isLoading,
    error,
  };
}

/**
 * Hook for Dutch auction operations
 */
export function useDutchAuction(auctionId: string) {
  const [currentPrice, setCurrentPrice] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current price
  const fetchPrice = useCallback(async () => {
    try {
      const price = await qubicSDK.getAuctionPrice(auctionId);
      setCurrentPrice(price);
    } catch (err) {
      console.error('Failed to fetch auction price:', err);
    }
  }, [auctionId]);

  // Poll for price updates
  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const placeBid = useCallback(async (amount: bigint, maxPrice: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      const tx = await qubicSDK.placeBid(auctionId, amount, maxPrice);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bid failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [auctionId]);

  return {
    currentPrice,
    placeBid,
    isLoading,
    error,
  };
}

/**
 * Hook for governance voting
 */
export function useGovernanceVoting() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = useCallback(async (proposalId: string, voteFor: boolean, amount: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      const tx = await qubicSDK.vote(proposalId, voteFor, amount);
      return tx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vote failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    vote,
    isLoading,
    error,
  };
}

/**
 * Hook for message signing
 */
export function useSignMessage() {
  const [isLoading, setIsLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signMessage = useCallback(async (message: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const sig = await qubicSDK.signMessage(message);
      setSignature(sig);
      return sig;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signing failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    signMessage,
    signature,
    isLoading,
    error,
  };
}

/**
 * Hook for network tick monitoring
 */
export function useQubicTick() {
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    const fetchTick = async () => {
      const currentTick = await qubicSDK.getCurrentTick();
      setTick(currentTick);
    };

    fetchTick();
    const interval = setInterval(fetchTick, 1000);
    return () => clearInterval(interval);
  }, []);

  return tick;
}

/**
 * Utility hook for formatting
 */
export function useQubicFormat() {
  const formatBalance = useCallback((amount: bigint, decimals = 0) => {
    return qubicSDK.formatBalance(amount, decimals);
  }, []);

  const parseAmount = useCallback((amount: string, decimals = 0) => {
    return qubicSDK.parseAmount(amount, decimals);
  }, []);

  const shortenAddress = useCallback((address: string, chars = 6) => {
    return qubicSDK.shortenAddress(address, chars);
  }, []);

  const getExplorerUrl = useCallback((type: 'address' | 'tx', value: string) => {
    return qubicSDK.getExplorerUrl(type, value);
  }, []);

  return {
    formatBalance,
    parseAmount,
    shortenAddress,
    getExplorerUrl,
  };
}
