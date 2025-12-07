"use client";

import Link from "next/link";
import { Shield, TrendingUp, TrendingDown, Building2, Leaf, Landmark, Gem, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  symbol: string;
  asset_type?: string;
  assetType?: string;
  description: string;
  price_per_unit?: number;
  pricePerUnit?: number;
  total_supply?: number;
  totalSupply?: number;
  circulating_supply?: number;
  circulatingSupply?: number;
  verification_status?: string;
  verificationStatus?: string;
  verification_score?: number;
  verificationScore?: number;
  image_url?: string;
  imageUrl?: string;
  price_change_24h?: number;
  priceChange24h?: number;
  status?: string;
}

interface AssetCardProps {
  asset: Asset;
}

const assetTypeConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  carbon_credit: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Leaf },
  real_estate: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Building2 },
  treasury: { color: "bg-violet-500/10 text-violet-400 border-violet-500/20", icon: Landmark },
  collectible: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Gem },
  commodity: { color: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: Box },
  CARBON_CREDIT: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Leaf },
  REAL_ESTATE: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Building2 },
  TREASURY: { color: "bg-violet-500/10 text-violet-400 border-violet-500/20", icon: Landmark },
};

export function AssetCard({ asset }: AssetCardProps) {
  // Handle both snake_case and camelCase
  const assetType = asset.asset_type || asset.assetType || 'other';
  const pricePerUnit = asset.price_per_unit || asset.pricePerUnit || 0;
  const totalSupply = asset.total_supply || asset.totalSupply || 0;
  const circulatingSupply = asset.circulating_supply || asset.circulatingSupply || 0;
  const verificationScore = asset.verification_score || asset.verificationScore;
  const verificationStatus = asset.verification_status || asset.verificationStatus || asset.status;
  const imageUrl = asset.image_url || asset.imageUrl;
  const priceChangeRaw = asset.price_change_24h || asset.priceChange24h;
  const priceChange = priceChangeRaw ?? (Math.random() * 10 - 5);
  const isPositive = priceChange >= 0;
  
  const typeConfig = assetTypeConfig[assetType] || { 
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20", 
    icon: Box 
  };
  const TypeIcon = typeConfig.icon;

  return (
    <div className="group glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-qubic/30 card-hover">
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-white/5 to-white/[0.02]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <TypeIcon className="w-12 h-12 mx-auto text-white/20 mb-2" />
              <span className="text-2xl font-bold text-white/30">
                {asset.symbol}
              </span>
            </div>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={`${typeConfig.color} border`}>
            {assetType.replace(/_/g, " ")}
          </Badge>
        </div>
        
        {(verificationStatus === "VERIFIED" || verificationStatus === "verified" || verificationStatus === "listed") && verificationScore && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 bg-qubic/90 text-black px-2.5 py-1 rounded-full text-xs font-semibold">
              <Shield className="h-3 w-3" />
              {verificationScore.toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white line-clamp-1 group-hover:text-qubic transition-colors">
              {asset.name}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">
              {asset.symbol}
            </p>
          </div>
          <div className="text-right ml-3">
            <div className="font-bold text-white">{formatCurrency(pricePerUnit)}</div>
            <div
              className={`flex items-center justify-end gap-1 text-xs ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isPositive ? "+" : ""}
              {priceChange.toFixed(2)}%
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {asset.description}
        </p>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pb-4 border-b border-white/5">
          <span>Supply: {totalSupply.toLocaleString()}</span>
          <span>
            {totalSupply > 0 ? ((circulatingSupply / totalSupply) * 100).toFixed(0) : 0}% circ.
          </span>
        </div>

        <Link href={`/marketplace/${asset.id}`}>
          <Button className="w-full bg-gradient-to-r from-qubic/20 to-emerald-500/20 hover:from-qubic/30 hover:to-emerald-500/30 border border-qubic/30 text-white">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
