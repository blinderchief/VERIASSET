/**
 * VeriAssets - Qubic SDK Integration
 * Client-side Qubic wallet and blockchain interactions
 */

// Qubic network configuration
const QUBIC_CONFIG = {
  mainnet: {
    rpcUrl: 'https://rpc.qubic.org',
    explorerUrl: 'https://explorer.qubic.org',
    chainId: 'mainnet',
  },
  testnet: {
    rpcUrl: 'https://testnet-rpc.qubic.org',
    explorerUrl: 'https://testnet-explorer.qubic.org',
    chainId: 'testnet',
  },
} as const;

type NetworkType = keyof typeof QUBIC_CONFIG;

// Wallet connection state
export interface QubicWallet {
  address: string;
  publicKey: string;
  balance: bigint;
  connected: boolean;
}

// Transaction types
export interface QubicTransaction {
  hash: string;
  from: string;
  to: string;
  amount: bigint;
  tick: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
}

// Token balance
export interface TokenBalance {
  tokenId: string;
  symbol: string;
  name: string;
  amount: bigint;
  decimals: number;
}

// Smart contract types
export interface SmartContractCall {
  contractAddress: string;
  method: string;
  params: unknown[];
  value?: bigint;
}

class QubicSDK {
  private network: NetworkType;
  private wallet: QubicWallet | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(network: NetworkType = 'testnet') {
    this.network = network;
  }

  // ============================================================================
  // Network Configuration
  // ============================================================================

  get config() {
    return QUBIC_CONFIG[this.network];
  }

  setNetwork(network: NetworkType) {
    this.network = network;
    this.emit('networkChanged', network);
  }

  // ============================================================================
  // Wallet Connection
  // ============================================================================

  async connect(): Promise<QubicWallet> {
    // In production, this would integrate with actual Qubic wallet
    // For hackathon demo, we simulate wallet connection
    
    // Check if Qubic wallet extension is available
    const qubicWallet = (window as unknown as { qubic?: { connect: () => Promise<unknown> } }).qubic;
    
    if (qubicWallet) {
      try {
        const account = await qubicWallet.connect();
        this.wallet = {
          address: (account as { address: string }).address,
          publicKey: (account as { publicKey: string }).publicKey,
          balance: BigInt(0),
          connected: true,
        };
        
        // Fetch balance
        await this.refreshBalance();
        
        this.emit('connected', this.wallet);
        return this.wallet;
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw new Error('Wallet connection failed');
      }
    }

    // Fallback: Generate demo wallet for testing
    const demoWallet: QubicWallet = {
      address: this.generateDemoAddress(),
      publicKey: this.generateDemoPublicKey(),
      balance: BigInt(1000000000), // 1 billion for demo
      connected: true,
    };

    this.wallet = demoWallet;
    this.emit('connected', this.wallet);
    return this.wallet;
  }

  async disconnect(): Promise<void> {
    if (this.wallet) {
      this.wallet = null;
      this.emit('disconnected', null);
    }
  }

  isConnected(): boolean {
    return this.wallet?.connected ?? false;
  }

  getWallet(): QubicWallet | null {
    return this.wallet;
  }

  // ============================================================================
  // Balance Operations
  // ============================================================================

  async refreshBalance(): Promise<bigint> {
    if (!this.wallet) throw new Error('Wallet not connected');

    try {
      const response = await fetch(`${this.config.rpcUrl}/v1/balance/${this.wallet.address}`);
      const data = await response.json();
      this.wallet.balance = BigInt(data.balance || 0);
      return this.wallet.balance;
    } catch {
      // Return cached balance on error
      return this.wallet.balance;
    }
  }

  async getTokenBalances(): Promise<TokenBalance[]> {
    if (!this.wallet) throw new Error('Wallet not connected');

    try {
      const response = await fetch(`${this.config.rpcUrl}/v1/tokens/${this.wallet.address}`);
      const data = await response.json();
      
      return (data.tokens || []).map((token: { id: string; symbol: string; name: string; amount: string; decimals: number }) => ({
        tokenId: token.id,
        symbol: token.symbol,
        name: token.name,
        amount: BigInt(token.amount),
        decimals: token.decimals,
      }));
    } catch {
      return [];
    }
  }

  // ============================================================================
  // Transaction Operations
  // ============================================================================

  async sendTransaction(to: string, amount: bigint): Promise<QubicTransaction> {
    if (!this.wallet) throw new Error('Wallet not connected');

    const tx: QubicTransaction = {
      hash: this.generateTxHash(),
      from: this.wallet.address,
      to,
      amount,
      tick: await this.getCurrentTick(),
      status: 'pending',
      timestamp: new Date(),
    };

    // In production, this would sign and broadcast the transaction
    // For demo, we simulate success after a delay
    setTimeout(() => {
      tx.status = 'confirmed';
      this.emit('transactionConfirmed', tx);
    }, 2000);

    this.emit('transactionSent', tx);
    return tx;
  }

  async transferToken(tokenId: string, to: string, amount: bigint): Promise<QubicTransaction> {
    if (!this.wallet) throw new Error('Wallet not connected');

    const tx: QubicTransaction = {
      hash: this.generateTxHash(),
      from: this.wallet.address,
      to,
      amount,
      tick: await this.getCurrentTick(),
      status: 'pending',
      timestamp: new Date(),
    };

    // Simulate token transfer
    setTimeout(() => {
      tx.status = 'confirmed';
      this.emit('transactionConfirmed', tx);
    }, 2000);

    this.emit('tokenTransfer', { tx, tokenId });
    return tx;
  }

  async getTransaction(hash: string): Promise<QubicTransaction | null> {
    try {
      const response = await fetch(`${this.config.rpcUrl}/v1/transaction/${hash}`);
      const data = await response.json();
      
      if (!data.transaction) return null;
      
      return {
        hash: data.transaction.hash,
        from: data.transaction.from,
        to: data.transaction.to,
        amount: BigInt(data.transaction.amount),
        tick: data.transaction.tick,
        status: data.transaction.status,
        timestamp: new Date(data.transaction.timestamp),
      };
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Smart Contract Interactions
  // ============================================================================

  async callContract(call: SmartContractCall): Promise<unknown> {
    if (!this.wallet) throw new Error('Wallet not connected');

    // In production, this would encode and execute the smart contract call
    const payload = {
      contract: call.contractAddress,
      method: call.method,
      params: call.params,
      value: call.value?.toString() || '0',
      sender: this.wallet.address,
    };

    try {
      const response = await fetch(`${this.config.rpcUrl}/v1/contract/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Contract call failed:', error);
      throw error;
    }
  }

  async readContract(contractAddress: string, method: string, params: unknown[]): Promise<unknown> {
    try {
      const response = await fetch(`${this.config.rpcUrl}/v1/contract/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract: contractAddress,
          method,
          params,
        }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Contract read failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // RWA Token Operations (VeriAssets specific)
  // ============================================================================

  async createRWAToken(params: {
    name: string;
    symbol: string;
    totalSupply: bigint;
    metadata: Record<string, unknown>;
  }): Promise<string> {
    const result = await this.callContract({
      contractAddress: 'RWA_TOKEN_CONTRACT_ADDRESS',
      method: 'createToken',
      params: [params.name, params.symbol, params.totalSupply.toString(), JSON.stringify(params.metadata)],
    });

    return (result as { tokenId: string }).tokenId;
  }

  async tradeRWAToken(params: {
    tokenId: string;
    amount: bigint;
    price: bigint;
    isBuy: boolean;
  }): Promise<QubicTransaction> {
    const method = params.isBuy ? 'buyToken' : 'sellToken';
    
    const tx = await this.sendTransaction(
      'RWA_TRADING_CONTRACT_ADDRESS',
      params.isBuy ? params.price * params.amount : BigInt(0)
    );

    await this.callContract({
      contractAddress: 'RWA_TRADING_CONTRACT_ADDRESS',
      method,
      params: [params.tokenId, params.amount.toString(), params.price.toString()],
    });

    return tx;
  }

  // ============================================================================
  // Dutch Auction Operations
  // ============================================================================

  async placeBid(auctionId: string, amount: bigint, maxPrice: bigint): Promise<QubicTransaction> {
    if (!this.wallet) throw new Error('Wallet not connected');

    const tx = await this.sendTransaction(
      'DUTCH_AUCTION_CONTRACT_ADDRESS',
      maxPrice * amount
    );

    await this.callContract({
      contractAddress: 'DUTCH_AUCTION_CONTRACT_ADDRESS',
      method: 'placeBid',
      params: [auctionId, amount.toString(), maxPrice.toString()],
    });

    return tx;
  }

  async getAuctionPrice(auctionId: string): Promise<bigint> {
    const result = await this.readContract(
      'DUTCH_AUCTION_CONTRACT_ADDRESS',
      'getCurrentPrice',
      [auctionId]
    );

    return BigInt((result as { price: string }).price);
  }

  // ============================================================================
  // Governance Operations
  // ============================================================================

  async vote(proposalId: string, voteFor: boolean, amount: bigint): Promise<QubicTransaction> {
    if (!this.wallet) throw new Error('Wallet not connected');

    const tx = await this.sendTransaction(
      'GOVERNANCE_CONTRACT_ADDRESS',
      BigInt(0) // Voting is free, only stake is locked
    );

    await this.callContract({
      contractAddress: 'GOVERNANCE_CONTRACT_ADDRESS',
      method: 'vote',
      params: [proposalId, voteFor, amount.toString()],
    });

    return tx;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async getCurrentTick(): Promise<number> {
    try {
      const response = await fetch(`${this.config.rpcUrl}/v1/tick`);
      const data = await response.json();
      return data.tick || 0;
    } catch {
      return 0;
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not connected');

    // In production, this would use the wallet to sign
    // For demo, we return a mock signature
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ============================================================================
  // Event System
  // ============================================================================

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateDemoAddress(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let address = '';
    for (let i = 0; i < 60; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return address;
  }

  private generateDemoPublicKey(): string {
    const chars = '0123456789abcdef';
    let key = '0x';
    for (let i = 0; i < 64; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  private generateTxHash(): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  }

  // ============================================================================
  // Format Utilities
  // ============================================================================

  formatBalance(amount: bigint, decimals: number = 0): string {
    if (decimals === 0) {
      return amount.toLocaleString();
    }
    
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    
    return `${whole.toLocaleString()}.${fraction.toString().padStart(decimals, '0')}`;
  }

  parseAmount(amount: string, decimals: number = 0): bigint {
    if (decimals === 0) {
      return BigInt(amount.replace(/,/g, ''));
    }
    
    const parts = amount.split('.');
    const whole = BigInt(parts[0].replace(/,/g, ''));
    const fraction = parts[1] ? BigInt(parts[1].padEnd(decimals, '0')) : BigInt(0);
    
    return whole * BigInt(10 ** decimals) + fraction;
  }

  shortenAddress(address: string, chars: number = 6): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }

  getExplorerUrl(type: 'address' | 'tx', value: string): string {
    const base = this.config.explorerUrl;
    return type === 'address' ? `${base}/address/${value}` : `${base}/tx/${value}`;
  }
}

// Singleton instance
export const qubicSDK = new QubicSDK(
  process.env.NEXT_PUBLIC_QUBIC_NETWORK as NetworkType || 'testnet'
);

export default QubicSDK;
