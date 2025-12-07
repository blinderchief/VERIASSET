import { create } from "zustand";
import { persist } from "zustand/middleware";

// User/Wallet Store
interface UserState {
  walletAddress: string | null;
  isWalletConnected: boolean;
  setWalletAddress: (address: string | null) => void;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      walletAddress: null,
      isWalletConnected: false,
      setWalletAddress: (address) =>
        set({ walletAddress: address, isWalletConnected: !!address }),
      connectWallet: (address) =>
        set({ walletAddress: address, isWalletConnected: true }),
      disconnectWallet: () =>
        set({ walletAddress: null, isWalletConnected: false }),
    }),
    {
      name: "user-storage",
    }
  )
);

// Trade Store
interface TradeState {
  selectedAsset: string | null;
  tradeType: "buy" | "sell";
  amount: number;
  setSelectedAsset: (asset: string | null) => void;
  setTradeType: (type: "buy" | "sell") => void;
  setAmount: (amount: number) => void;
  resetTrade: () => void;
}

export const useTradeStore = create<TradeState>()((set) => ({
  selectedAsset: null,
  tradeType: "buy",
  amount: 0,
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
  setTradeType: (type) => set({ tradeType: type }),
  setAmount: (amount) => set({ amount }),
  resetTrade: () =>
    set({ selectedAsset: null, tradeType: "buy", amount: 0 }),
}));
