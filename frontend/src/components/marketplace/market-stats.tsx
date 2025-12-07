"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, formatCurrency } from "@/lib/utils";

const stats = [
  { label: "Total Listings", value: 234 },
  { label: "24h Volume", value: 12500000, prefix: "$" },
  { label: "Market Cap", value: 67500000, prefix: "$" },
  { label: "Active Traders", value: 5420 },
];

export function MarketStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {stat.prefix}
              {formatNumber(stat.value, 1)}
            </div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
