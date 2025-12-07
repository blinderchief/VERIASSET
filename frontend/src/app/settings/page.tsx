'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Wallet,
  Key,
  Smartphone,
  Moon,
  Sun,
  Check,
  ChevronRight,
  LogOut,
  Trash2,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SignedIn, SignedOut, RedirectToSignIn, useUser, useClerk } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { WalletConnectModal, useWalletModal } from '@/components/wallet/wallet-connect-modal';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'wallet' | 'appearance';

const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { user } = useUser();
  const { signOut } = useClerk();
  const { walletAddress, isWalletConnected, disconnectWallet } = useUserStore();
  const { toast } = useToast();
  const [showWalletKey, setShowWalletKey] = useState(false);
  const { open } = useWalletModal();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Address copied to clipboard',
    });
  };

  return (
    <>
      <SignedIn>
        <DashboardLayout>
          <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-500/20">
                  <Settings className="w-6 h-6 text-gray-400" />
                </div>
                Settings
              </h1>
              <p className="text-gray-400">Manage your account preferences and settings</p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-4 h-fit lg:sticky lg:top-24">
                  <nav className="space-y-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        )}
                      >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                        {activeTab === tab.id && (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    ))}
                  </nav>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      onClick={() => signOut()}
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </Card>

                {/* Content */}
                <div className="lg:col-span-3 space-y-6">
                  {activeTab === 'profile' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>
                        
                        <div className="flex items-center gap-6 mb-6">
                          <div className="relative">
                            <img
                              src={user?.imageUrl || '/default-avatar.png'}
                              alt="Profile"
                              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10"
                            />
                            <button className="absolute -bottom-2 -right-2 p-2 bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors">
                              <Palette className="w-4 h-4 text-white" />
                            </button>
                          </div>
                          <div>
                            <p className="text-white font-medium">{user?.fullName || 'User'}</p>
                            <p className="text-gray-400 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
                            <Badge className="mt-2 bg-emerald-500/20 text-emerald-400">Verified</Badge>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Display Name</label>
                            <Input
                              defaultValue={user?.fullName || ''}
                              className="bg-white/5 border-white/10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Username</label>
                            <Input
                              defaultValue={user?.username || ''}
                              className="bg-white/5 border-white/10"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-2">Email</label>
                            <Input
                              defaultValue={user?.primaryEmailAddress?.emailAddress || ''}
                              disabled
                              className="bg-white/5 border-white/10"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end mt-6">
                          <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700">
                            Save Changes
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {activeTab === 'notifications' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Notification Preferences</h3>
                        
                        <div className="space-y-4">
                          {[
                            { title: 'Trade Confirmations', desc: 'Get notified when trades are executed', enabled: true },
                            { title: 'IPO Alerts', desc: 'Notifications about new IPO opportunities', enabled: true },
                            { title: 'Governance Updates', desc: 'Updates on proposals you voted on', enabled: true },
                            { title: 'Price Alerts', desc: 'Alerts when assets hit your target price', enabled: false },
                            { title: 'Weekly Summary', desc: 'Weekly portfolio performance report', enabled: true },
                            { title: 'Marketing', desc: 'News and promotional content', enabled: false },
                          ].map((item) => (
                            <div key={item.title} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                              <div>
                                <p className="text-white font-medium">{item.title}</p>
                                <p className="text-gray-400 text-sm">{item.desc}</p>
                              </div>
                              <button
                                className={cn(
                                  'w-12 h-6 rounded-full transition-colors relative',
                                  item.enabled ? 'bg-violet-600' : 'bg-gray-700'
                                )}
                              >
                                <span
                                  className={cn(
                                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                                    item.enabled ? 'right-1' : 'left-1'
                                  )}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {activeTab === 'security' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Security Settings</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-lg bg-emerald-500/10">
                                <Shield className="w-5 h-5 text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">Two-Factor Authentication</p>
                                <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                              </div>
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-400">Enabled</Badge>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-lg bg-violet-500/10">
                                <Key className="w-5 h-5 text-violet-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">Password</p>
                                <p className="text-gray-400 text-sm">Last changed 30 days ago</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="border-white/10">
                              Change
                            </Button>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-lg bg-blue-500/10">
                                <Smartphone className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">Active Sessions</p>
                                <p className="text-gray-400 text-sm">2 devices currently logged in</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="border-white/10">
                              Manage
                            </Button>
                          </div>
                        </div>
                      </Card>

                      <Card className="bg-gradient-to-br from-rose-500/5 to-rose-500/[0.02] border-rose-500/20 p-6">
                        <h3 className="text-lg font-semibold text-rose-400 mb-4">Danger Zone</h3>
                        <p className="text-gray-400 text-sm mb-4">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <Button variant="outline" className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </Card>
                    </motion.div>
                  )}

                  {activeTab === 'wallet' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Connected Wallet</h3>
                        
                        {isWalletConnected ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-lg border border-violet-500/20">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-gray-400 text-sm">Qubic Wallet</span>
                                <Badge className="bg-emerald-500/20 text-emerald-400">Connected</Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <code className="flex-1 text-white font-mono text-sm bg-black/30 p-3 rounded-lg">
                                  {showWalletKey ? walletAddress : `${walletAddress?.slice(0, 10)}...${walletAddress?.slice(-10)}`}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowWalletKey(!showWalletKey)}
                                  className="text-gray-400"
                                >
                                  {showWalletKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(walletAddress || '')}
                                  className="text-gray-400"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Button variant="outline" className="border-white/10">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View on Explorer
                              </Button>
                              <Button
                                variant="outline"
                                className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                                onClick={disconnectWallet}
                              >
                                Disconnect
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-4">
                              <Wallet className="w-8 h-8 text-violet-400" />
                            </div>
                            <p className="text-gray-400 mb-4">No wallet connected</p>
                            <Button 
                              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                              onClick={open}
                            >
                              Connect Wallet
                            </Button>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  )}

                  {activeTab === 'appearance' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Theme</h3>
                        
                        <div className="grid md:grid-cols-3 gap-4">
                          {[
                            { id: 'dark', label: 'Dark', icon: Moon, active: true },
                            { id: 'light', label: 'Light', icon: Sun, active: false },
                            { id: 'system', label: 'System', icon: Globe, active: false },
                          ].map((theme) => (
                            <button
                              key={theme.id}
                              className={cn(
                                'p-4 rounded-lg border-2 transition-all text-left',
                                theme.active
                                  ? 'border-violet-500 bg-violet-500/10'
                                  : 'border-white/10 hover:border-white/20'
                              )}
                            >
                              <theme.icon className={cn(
                                'w-6 h-6 mb-2',
                                theme.active ? 'text-violet-400' : 'text-gray-400'
                              )} />
                              <p className="text-white font-medium">{theme.label}</p>
                              {theme.active && (
                                <Check className="w-4 h-4 text-violet-400 mt-2" />
                              )}
                            </button>
                          ))}
                        </div>
                      </Card>

                      <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Language & Region</h3>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Language</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white">
                              <option>English (US)</option>
                              <option>Spanish</option>
                              <option>French</option>
                              <option>German</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Currency Display</label>
                            <select className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white">
                              <option>USD ($)</option>
                              <option>EUR (€)</option>
                              <option>GBP (£)</option>
                              <option>QUBIC</option>
                            </select>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </DashboardLayout>
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </>
    );
  }
