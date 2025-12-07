'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Search,
  ShoppingCart,
  Vote,
  Gavel
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const demoSteps = [
  {
    id: 1,
    title: 'Connect Your Wallet',
    description: 'Securely connect your Qubic wallet to access the marketplace',
    icon: Wallet,
    color: 'from-blue-500 to-cyan-500',
    mockUI: 'wallet',
  },
  {
    id: 2,
    title: 'Browse AI-Verified Assets',
    description: 'Explore tokenized real-world assets with confidence scores',
    icon: Search,
    color: 'from-purple-500 to-pink-500',
    mockUI: 'marketplace',
  },
  {
    id: 3,
    title: 'Trade Instantly',
    description: 'Buy and sell with sub-second settlement on Qubic',
    icon: ShoppingCart,
    color: 'from-green-500 to-emerald-500',
    mockUI: 'trade',
  },
  {
    id: 4,
    title: 'Participate in Governance',
    description: 'Vote on proposals to shape the platform\'s future',
    icon: Vote,
    color: 'from-orange-500 to-red-500',
    mockUI: 'governance',
  },
  {
    id: 5,
    title: 'Join Dutch Auction IPOs',
    description: 'Get fair access to new asset listings',
    icon: Gavel,
    color: 'from-teal-500 to-cyan-500',
    mockUI: 'ipo',
  },
];

// Mock UI Components for each step
function WalletMockUI() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900/80 rounded-xl p-6 border border-white/10 max-w-sm mx-auto"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Connect Wallet</h3>
      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full p-4 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-lg border border-teal-500/30 flex items-center gap-3 text-white hover:border-teal-400 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">Q</div>
          <span>Qubic Wallet</span>
          <span className="ml-auto text-xs text-teal-400">Recommended</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="w-full p-4 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3 text-gray-400"
        >
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">W</div>
          <span>WalletConnect</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

function MarketplaceMockUI() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-4 max-w-md mx-auto"
    >
      {[
        { name: 'Carbon Credits', price: '$125.50', change: '+15.2%', verified: true },
        { name: 'Real Estate', price: '$8,750', change: '+3.8%', verified: true },
      ].map((asset, i) => (
        <motion.div
          key={asset.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.2 }}
          className="bg-gray-900/80 rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{asset.name}</span>
            {asset.verified && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">AI ✓</span>
            )}
          </div>
          <div className="text-xl font-bold text-white">{asset.price}</div>
          <div className="text-sm text-green-400">{asset.change}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function TradeMockUI() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900/80 rounded-xl p-6 border border-white/10 max-w-sm mx-auto"
    >
      <div className="flex gap-2 mb-4">
        <button className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg font-medium">Buy</button>
        <button className="flex-1 py-2 bg-white/5 text-gray-400 rounded-lg">Sell</button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Amount</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="text" value="100" readOnly className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" />
            <span className="text-gray-400">CCB-A</span>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400">Total</label>
          <div className="text-2xl font-bold text-white mt-1">$12,550.00</div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg"
        >
          Confirm Purchase
        </motion.button>
      </div>
    </motion.div>
  );
}

function GovernanceMockUI() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/80 rounded-xl p-6 border border-white/10 max-w-sm mx-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Active</span>
        <span className="text-xs text-gray-400">Ends in 5 days</span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">VIP-23: Reduce Fees</h3>
      <p className="text-sm text-gray-400 mb-4">Lower trading fees from 0.3% to 0.2%</p>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-green-400">FOR: 156</span>
          <span className="text-red-400">AGAINST: 44</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '78%' }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg"
        >
          Vote FOR
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg"
        >
          Vote AGAINST
        </motion.button>
      </div>
    </motion.div>
  );
}

function IPOMockUI() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900/80 rounded-xl p-6 border border-white/10 max-w-sm mx-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Dutch Auction</span>
        <span className="text-xs text-gray-400">12:45:32 left</span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-4">Solar Farm Arizona IPO</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400">Current Price</p>
          <motion.p
            key="price"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-teal-400"
          >
            $87.50
          </motion.p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Tokens Left</p>
          <p className="text-2xl font-bold text-white">7,500</p>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>$150.00</span>
          <span>$75.00</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '42%' }}
            transition={{ duration: 2 }}
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
          />
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg"
      >
        Place Bid
      </motion.button>
    </motion.div>
  );
}

const mockUIComponents: Record<string, React.FC> = {
  wallet: WalletMockUI,
  marketplace: MarketplaceMockUI,
  trade: TradeMockUI,
  governance: GovernanceMockUI,
  ipo: IPOMockUI,
};

export default function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Auto-advance steps
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % demoSteps.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const step = demoSteps[currentStep];
  const MockUI = mockUIComponents[step.mockUI];
  const Icon = step.icon;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            See VeriAssets in Action
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience the future of real-world asset trading
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Demo Video/Interactive Area */}
          <div className="relative">
            <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-white/10">
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-10`} />
              
              {/* Mock UI */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full"
                  >
                    <MockUI />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                  
                  {/* Progress Dots */}
                  <div className="flex gap-2">
                    {demoSteps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentStep(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentStep ? 'bg-teal-400' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>

                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Maximize className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => setCurrentStep((prev) => (prev - 1 + demoSteps.length) % demoSteps.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 p-3 bg-gray-800 rounded-full border border-white/10 hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setCurrentStep((prev) => (prev + 1) % demoSteps.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 p-3 bg-gray-800 rounded-full border border-white/10 hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            {demoSteps.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = i === currentStep;
              
              return (
                <motion.button
                  key={s.id}
                  onClick={() => setCurrentStep(i)}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-white/10 border-teal-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${s.color} ${
                      isActive ? 'opacity-100' : 'opacity-50'
                    }`}>
                      <StepIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {s.title}
                      </h3>
                      <p className={`text-sm mt-1 ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                        {s.description}
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      isActive
                        ? 'bg-teal-500 text-white'
                        : 'bg-white/10 text-gray-400'
                    }`}>
                      {s.id}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-8"
          >
            Try VeriAssets Now →
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
