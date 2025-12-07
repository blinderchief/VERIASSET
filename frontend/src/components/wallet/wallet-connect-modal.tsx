'use client';

import { useState } from 'react';
import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Loader2, Check, Copy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/lib/store';
import { useQubicWallet } from '@/hooks/useQubic';
import { useToast } from '@/hooks/use-toast';

// Hook to manage wallet modal state
interface WalletModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useWalletModal = create<WalletModalState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const [step, setStep] = useState<'select' | 'connecting' | 'connected' | 'error'>('select');
  const [errorMessage, setErrorMessage] = useState('');
  const [connectedAddress, setConnectedAddress] = useState('');
  const { connectWallet } = useUserStore();
  const { connect, wallet, isConnecting, error } = useQubicWallet();
  const { toast } = useToast();

  const handleConnect = async (method: 'qubic' | 'demo') => {
    setStep('connecting');
    setErrorMessage('');
    
    try {
      if (method === 'demo') {
        // Generate demo wallet address
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let address = '';
        for (let i = 0; i < 60; i++) {
          address += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        connectWallet(address);
        setConnectedAddress(address);
        setStep('connected');
        
        toast({
          title: 'Wallet Connected!',
          description: 'Demo wallet connected successfully.',
        });
        
        setTimeout(() => {
          onClose();
          setStep('select');
        }, 2000);
      } else {
        // Try to connect with actual Qubic wallet
        await connect();
        // After connect, wallet should be available from the hook
        // Wait a bit for the wallet state to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (wallet) {
          connectWallet(wallet.address);
          setConnectedAddress(wallet.address);
          setStep('connected');
          
          toast({
            title: 'Wallet Connected!',
            description: 'Your Qubic wallet is now connected.',
          });
          
          setTimeout(() => {
            onClose();
            setStep('select');
          }, 2000);
        } else {
          // Fallback to demo if no actual wallet extension
          throw new Error('No Qubic wallet extension found. Try using the demo wallet instead.');
        }
      }
    } catch (err) {
      setStep('error');
      setErrorMessage(err instanceof Error ? err.message : 'Connection failed');
      
      toast({
        title: 'Connection Failed',
        description: err instanceof Error ? err.message : 'Unable to connect wallet. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: 'Copied!',
      description: 'Wallet address copied to clipboard.',
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
          >
            <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-white/10 p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              {step === 'select' && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm mb-6">
                    Connect your wallet to access all features of VeriAssets platform.
                  </p>

                  {/* Qubic Wallet Option */}
                  <button
                    onClick={() => handleConnect('qubic')}
                    className="w-full p-4 rounded-xl border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold group-hover:text-violet-400 transition-colors">
                          Qubic Wallet
                        </p>
                        <p className="text-gray-400 text-sm">Connect with browser extension</p>
                      </div>
                    </div>
                  </button>

                  {/* Demo Wallet Option */}
                  <button
                    onClick={() => handleConnect('demo')}
                    className="w-full p-4 rounded-xl border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold group-hover:text-emerald-400 transition-colors">
                          Demo Wallet
                        </p>
                        <p className="text-gray-400 text-sm">Try with a demo wallet (Testnet)</p>
                      </div>
                    </div>
                  </button>

                  <p className="text-center text-gray-500 text-xs mt-4">
                    By connecting, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              )}

              {step === 'connecting' && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  </div>
                  <p className="text-white font-semibold mb-2">Connecting...</p>
                  <p className="text-gray-400 text-sm">Please confirm in your wallet</p>
                </div>
              )}

              {step === 'connected' && connectedAddress && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-white font-semibold mb-2">Connected!</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <code className="text-sm text-gray-300 bg-black/30 px-3 py-2 rounded-lg">
                      {connectedAddress.slice(0, 10)}...{connectedAddress.slice(-10)}
                    </code>
                    <button
                      onClick={() => copyAddress(connectedAddress)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 'error' && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-rose-400" />
                  </div>
                  <p className="text-white font-semibold mb-2">Connection Failed</p>
                  <p className="text-gray-400 text-sm mb-6">{errorMessage}</p>
                  <Button
                    onClick={() => setStep('select')}
                    variant="outline"
                    className="border-white/10"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


