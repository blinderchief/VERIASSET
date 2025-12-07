'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check, 
  X, 
  TrendingUp, 
  Vote, 
  Coins, 
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type NotificationType = 'trade' | 'governance' | 'auction' | 'verification' | 'system';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
};

// Mock notifications - in production this would come from WebSocket/API
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'trade',
    title: 'Order Filled',
    message: 'Your buy order for 100 CCB-A has been filled at $125.50',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    actionUrl: '/portfolio',
  },
  {
    id: '2',
    type: 'governance',
    title: 'New Proposal',
    message: 'VIP-23: Reduce trading fees to 0.2% is now open for voting',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    actionUrl: '/governance',
  },
  {
    id: '3',
    type: 'auction',
    title: 'Auction Starting Soon',
    message: 'Manhattan Office Building IPO starts in 30 minutes',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    actionUrl: '/launchpad',
  },
  {
    id: '4',
    type: 'verification',
    title: 'Verification Complete',
    message: 'Your Carbon Credit Bundle has passed AI verification',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
    actionUrl: '/dashboard/create',
  },
  {
    id: '5',
    type: 'system',
    title: 'Welcome to VeriAssets',
    message: 'Start by connecting your Qubic wallet to explore the marketplace',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
  },
];

const notificationIcons: Record<NotificationType, React.ElementType> = {
  trade: TrendingUp,
  governance: Vote,
  auction: Coins,
  verification: CheckCircle2,
  system: AlertCircle,
};

const notificationColors: Record<NotificationType, string> = {
  trade: 'text-green-400 bg-green-400/20',
  governance: 'text-purple-400 bg-purple-400/20',
  auction: 'text-yellow-400 bg-yellow-400/20',
  verification: 'text-teal-400 bg-teal-400/20',
  system: 'text-blue-400 bg-blue-400/20',
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function NotificationItem({ 
  notification, 
  onRead, 
  onDismiss 
}: { 
  notification: Notification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const Icon = notificationIcons[notification.type];
  const colorClass = notificationColors[notification.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`p-4 rounded-lg border transition-all ${
        notification.read 
          ? 'bg-white/5 border-white/5' 
          : 'bg-white/10 border-teal-500/30'
      }`}
    >
      <div className="flex gap-3">
        <div className={`p-2 rounded-lg ${colorClass} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={`font-medium ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-400 mt-0.5">{notification.message}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!notification.read && (
                <button
                  onClick={() => onRead(notification.id)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <button
                onClick={() => onDismiss(notification.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">{formatTimeAgo(notification.timestamp)}</span>
            {notification.actionUrl && (
              <a 
                href={notification.actionUrl}
                className="text-xs text-teal-400 hover:text-teal-300 ml-auto"
              >
                View Details →
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleReadAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-12 w-96 max-h-[500px] bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReadAll}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Mark all read
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Clear all
                    </Button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filter === 'all' 
                        ? 'bg-teal-500/20 text-teal-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filter === 'unread' 
                        ? 'bg-teal-500/20 text-teal-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[380px] overflow-y-auto p-3 space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={handleRead}
                        onDismiss={handleDismiss}
                      />
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No notifications</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {filter === 'unread' ? 'All caught up!' : "You're all set"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
