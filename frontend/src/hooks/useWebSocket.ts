'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type WebSocketMessage = {
  type: string;
  data?: unknown;
  timestamp: string;
};

type WebSocketHookOptions = {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
};

type WebSocketHookReturn = {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: Record<string, unknown>) => void;
  subscribe: (assetId: string) => void;
  unsubscribe: (assetId: string) => void;
};

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws';

/**
 * Custom hook for WebSocket connections
 */
export function useWebSocket(
  channel: string,
  options: WebSocketHookOptions = {}
): WebSocketHookReturn {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_BASE_URL}/${channel}`);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectCountRef.current = 0;
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        onMessage?.(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      onDisconnect?.();

      // Attempt to reconnect
      if (reconnectCountRef.current < reconnectAttempts) {
        reconnectCountRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      onError?.(error);
    };

    wsRef.current = ws;
  }, [channel, onConnect, onDisconnect, onError, onMessage, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((assetId: string) => {
    sendMessage({ action: 'subscribe', asset_id: assetId });
  }, [sendMessage]);

  const unsubscribe = useCallback((assetId: string) => {
    sendMessage({ action: 'unsubscribe', asset_id: assetId });
  }, [sendMessage]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        sendMessage({ action: 'ping' });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook for real-time trade updates
 */
export function useTradeStream(assetId?: string) {
  const [trades, setTrades] = useState<unknown[]>([]);
  
  const { isConnected, lastMessage, subscribe, unsubscribe } = useWebSocket('trades', {
    onMessage: (message) => {
      if (message.type === 'trade_executed') {
        setTrades((prev) => [message.data, ...prev.slice(0, 49)]);
      }
    },
  });

  useEffect(() => {
    if (isConnected && assetId) {
      subscribe(assetId);
      return () => unsubscribe(assetId);
    }
  }, [isConnected, assetId, subscribe, unsubscribe]);

  return { isConnected, trades, lastTrade: lastMessage?.data };
}

/**
 * Hook for real-time price updates
 */
export function usePriceStream(assetIds: string[]) {
  const [prices, setPrices] = useState<Record<string, { price: number; volume_24h: number }>>({});
  
  const { isConnected, sendMessage } = useWebSocket('prices', {
    onMessage: (message) => {
      if (message.type === 'price_update' && message.data) {
        const data = message.data as { asset_id: string; price: number; volume_24h: number };
        setPrices((prev) => ({
          ...prev,
          [data.asset_id]: { price: data.price, volume_24h: data.volume_24h },
        }));
      }
    },
  });

  useEffect(() => {
    if (isConnected && assetIds.length > 0) {
      sendMessage({ action: 'subscribe_assets', asset_ids: assetIds });
    }
  }, [isConnected, assetIds, sendMessage]);

  return { isConnected, prices };
}

/**
 * Hook for Dutch auction real-time updates
 */
export function useAuctionStream(auctionId: string) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [bids, setBids] = useState<unknown[]>([]);

  const { isConnected, lastMessage } = useWebSocket(`auctions/${auctionId}`, {
    onMessage: (message) => {
      if (message.type === 'price_tick' && message.data) {
        const data = message.data as { current_price: number; time_remaining: number };
        setCurrentPrice(data.current_price);
        setTimeRemaining(data.time_remaining);
      } else if (message.type === 'bid_placed') {
        setBids((prev) => [message.data, ...prev]);
      }
    },
  });

  return { isConnected, currentPrice, timeRemaining, bids, lastMessage };
}

/**
 * Hook for governance updates
 */
export function useGovernanceStream(proposalId?: string) {
  const [votes, setVotes] = useState<unknown[]>([]);
  const [voteCount, setVoteCount] = useState({ for: 0, against: 0 });

  const { isConnected, sendMessage } = useWebSocket('governance', {
    onMessage: (message) => {
      if (message.type === 'vote_cast' && message.data) {
        const data = message.data as { vote: 'for' | 'against' };
        setVotes((prev) => [message.data, ...prev.slice(0, 99)]);
        setVoteCount((prev) => ({
          ...prev,
          [data.vote]: prev[data.vote] + 1,
        }));
      }
    },
  });

  useEffect(() => {
    if (isConnected && proposalId) {
      sendMessage({ action: 'subscribe_proposal', proposal_id: proposalId });
    }
  }, [isConnected, proposalId, sendMessage]);

  return { isConnected, votes, voteCount };
}

/**
 * Hook for user notifications
 */
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<unknown[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isConnected, sendMessage } = useWebSocket(`user/${userId}`, {
    onMessage: (message) => {
      if (message.type !== 'pong' && message.type !== 'connected' && message.type !== 'ack_confirmed') {
        setNotifications((prev) => [message, ...prev.slice(0, 49)]);
        setUnreadCount((prev) => prev + 1);
      }
    },
  });

  const acknowledge = useCallback((notificationId: string) => {
    sendMessage({ action: 'ack', notification_id: notificationId });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, [sendMessage]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return { isConnected, notifications, unreadCount, acknowledge, clearAll };
}
