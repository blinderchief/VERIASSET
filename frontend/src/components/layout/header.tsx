"use client";

import Link from "next/link";
import { useState } from "react";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Menu, X, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { WalletConnectModal, useWalletModal } from "@/components/wallet/wallet-connect-modal";
import { useUserStore } from "@/lib/store";

const navigation = [
  { name: "Marketplace", href: "/marketplace" },
  { name: "Launchpad", href: "/launchpad" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Governance", href: "/governance" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn, user, isLoaded } = useUser();
  const { isOpen, open, close } = useWalletModal();
  const { isWalletConnected, walletAddress, disconnectWallet } = useUserStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-background/80 backdrop-blur-xl">
      <nav className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-qubic to-emerald-500 flex items-center justify-center shadow-lg shadow-qubic/20 group-hover:shadow-qubic/40 transition-shadow">
              <Sparkles className="h-5 w-5 text-black" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-white">Veri</span>
              <span className="text-gradient">Assets</span>
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-3">
          {!isLoaded ? (
            <div className="h-10 w-24 animate-pulse bg-white/5 rounded-lg" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-3">
              {/* Wallet Button */}
              {isWalletConnected ? (
                <Button 
                  variant="outline" 
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  onClick={disconnectWallet}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                  onClick={open}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
              <Link href="/dashboard">
                <Button variant="ghost" className="text-muted-foreground hover:text-white">
                  Dashboard
                </Button>
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9 ring-2 ring-white/10",
                  },
                }}
              />
            </div>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                onClick={open}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-muted-foreground hover:text-white">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-gradient-to-r from-qubic to-emerald-500 hover:from-qubic hover:to-emerald-400 text-black font-semibold shadow-lg shadow-qubic/20">
                  Get Started
                </Button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* Wallet Connect Modal */}
      <WalletConnectModal isOpen={isOpen} onClose={close} />

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-background border-l border-white/[0.08] px-6 py-6"
            >
              <div className="flex items-center justify-between mb-8">
                <Link
                  href="/"
                  className="flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-qubic to-emerald-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-black" />
                  </div>
                  <span className="text-xl font-bold">
                    <span className="text-white">Veri</span>
                    <span className="text-gradient">Assets</span>
                  </span>
                </Link>
                <button
                  type="button"
                  className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-4 py-3 text-base font-medium text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/[0.08]">
                {!isLoaded ? (
                  <div className="h-10 w-full animate-pulse bg-white/5 rounded-lg" />
                ) : isSignedIn ? (
                  <div className="space-y-4">
                    {/* Mobile Wallet Button */}
                    {isWalletConnected ? (
                      <Button 
                        variant="outline" 
                        className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => {
                          disconnectWallet();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                        onClick={() => {
                          open();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect Wallet
                      </Button>
                    )}
                    <Link
                      href="/dashboard"
                      className="block px-4 py-3 text-base font-medium text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <div className="px-4">
                      <UserButton
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: "h-10 w-10 ring-2 ring-white/10",
                          },
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                      onClick={() => {
                        open();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </Button>
                    <SignInButton mode="modal">
                      <Button variant="ghost" className="w-full justify-center">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full bg-gradient-to-r from-qubic to-emerald-500 hover:from-qubic hover:to-emerald-400 text-black font-semibold">
                        Get Started
                      </Button>
                    </SignUpButton>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
