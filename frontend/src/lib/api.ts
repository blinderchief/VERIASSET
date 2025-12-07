import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Request interceptor for auth
    this.client.interceptors.request.use(
      async (config) => {
        // In production, get token from Clerk
        // const token = await getToken();
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          window.location.href = "/sign-in";
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  // ==================== RWA Assets ====================

  async getAssets(params?: {
    type?: string;
    status?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) {
    const response = await this.client.get("/rwa", { params });
    return response.data;
  }

  async getAsset(id: string) {
    const response = await this.client.get(`/rwa/${id}`);
    return response.data;
  }

  async createAsset(data: {
    name: string;
    symbol: string;
    asset_type: string;
    description: string;
    total_supply: number;
    price_per_unit: number;
    document_url?: string;
    metadata?: Record<string, any>;
  }) {
    const response = await this.client.post("/rwa", data);
    return response.data;
  }

  async verifyAsset(id: string) {
    const response = await this.client.post(`/rwa/${id}/verify`);
    return response.data;
  }

  async getAssetTypes() {
    const response = await this.client.get("/rwa/types");
    return response.data;
  }

  // ==================== Trading ====================

  async createTrade(data: {
    asset_id: string;
    trade_type: "buy" | "sell";
    quantity: number;
    price_per_unit: number;
  }) {
    const response = await this.client.post("/trade", data);
    return response.data;
  }

  async executeTrade(tradeId: string, data: { wallet_address: string }) {
    const response = await this.client.post(`/trade/${tradeId}/execute`, data);
    return response.data;
  }

  async getTrades(params?: {
    asset_id?: string;
    trade_type?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }) {
    const response = await this.client.get("/trade", { params });
    return response.data;
  }

  async getMarketStats(assetId: string) {
    const response = await this.client.get(`/trade/market/${assetId}/stats`);
    return response.data;
  }

  async getOrderBook(assetId: string) {
    const response = await this.client.get(`/trade/market/${assetId}/orderbook`);
    return response.data;
  }

  // ==================== Nostromo Launchpad ====================

  async getProposals(params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }) {
    const response = await this.client.get("/nostromo/proposals", { params });
    return response.data;
  }

  async getProposal(id: string) {
    const response = await this.client.get(`/nostromo/proposals/${id}`);
    return response.data;
  }

  async createProposal(data: {
    asset_id: string;
    title: string;
    description: string;
    requested_amount: number;
    token_allocation: number;
    ipo_start_price: number;
    ipo_reserve_price: number;
    voting_duration_days?: number;
  }) {
    const response = await this.client.post("/nostromo/proposals", data);
    return response.data;
  }

  async voteOnProposal(
    proposalId: string,
    data: { vote_for: boolean; voting_power?: number }
  ) {
    const response = await this.client.post(
      `/nostromo/proposals/${proposalId}/vote`,
      data
    );
    return response.data;
  }

  async getIPOStatus(proposalId: string) {
    const response = await this.client.get(`/nostromo/ipo/${proposalId}`);
    return response.data;
  }

  async placeIPOBid(
    proposalId: string,
    data: { quantity: number; max_price: number }
  ) {
    const response = await this.client.post(
      `/nostromo/ipo/${proposalId}/bid`,
      data
    );
    return response.data;
  }

  async getActiveIPOs() {
    const response = await this.client.get("/nostromo/active-ipos");
    return response.data;
  }

  async getLaunchpadStats() {
    const response = await this.client.get("/nostromo/stats");
    return response.data;
  }

  // ==================== User ====================

  async getCurrentUser() {
    const response = await this.client.get("/users/me");
    return response.data;
  }

  async updateProfile(data: { name?: string; avatar_url?: string }) {
    const response = await this.client.patch("/users/me", data);
    return response.data;
  }

  async connectWallet(data: {
    qubic_public_key: string;
    signature?: string;
    message?: string;
  }) {
    const response = await this.client.post("/users/me/wallet", data);
    return response.data;
  }

  async getUserStats() {
    const response = await this.client.get("/users/me/stats");
    return response.data;
  }

  // ==================== Market Statistics ====================

  async getMarketAnalytics() {
    const response = await this.client.get("/stats/market");
    return response.data;
  }

  async getQuickStats() {
    const response = await this.client.get("/stats/summary");
    return response.data;
  }

  // Nostromo namespace for launchpad page compatibility
  nostromo = {
    listIPOs: async (status?: string) => {
      const response = await this.client.get("/nostromo/active-ipos", {
        params: { status },
      });
      return response.data;
    },
    getIPO: async (id: string) => {
      const response = await this.client.get(`/nostromo/ipo/${id}`);
      return response.data;
    },
    placeBid: async (ipoId: string, data: { quantity: number; max_price: number }) => {
      const response = await this.client.post(`/nostromo/ipo/${ipoId}/bid`, data);
      return response.data;
    },
  };
}

// Types for Market Analytics
export interface MarketStats {
  total_volume_24h: number;
  total_volume_change: number;
  total_trades_24h: number;
  trades_change: number;
  active_listings: number;
  listings_change: number;
  avg_price: number;
  price_change: number;
}

export interface TopAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  asset_type: string;
}

export interface RecentTrade {
  id: string;
  asset_symbol: string;
  trade_type: string;
  quantity: number;
  price: number;
  total_value: number;
  executed_at: string;
}

export interface AssetDistribution {
  asset_type: string;
  count: number;
  percentage: number;
  total_value: number;
}

export interface MarketAnalytics {
  market_stats: MarketStats;
  top_assets: TopAsset[];
  recent_trades: RecentTrade[];
  asset_distribution: AssetDistribution[];
  last_updated: string;
}

// Types for IPO listings
export interface IPOListing {
  id: string;
  name: string;
  symbol: string;
  description: string;
  assetType: string;
  totalTokens: number;
  availableTokens: number;
  currentPrice: number;
  startPrice: number;
  minPrice: number;
  maxPrice: number;
  startTime: string;
  endTime: string;
  status: "active" | "upcoming" | "ended" | "pending" | "completed" | "cancelled";
  totalRaised: number;
  participants: number;
  verificationScore: number;
}

export const api = new ApiClient();
export default api;
