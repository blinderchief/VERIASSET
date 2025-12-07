"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FiltersState {
  type: string;
  status: string;
  search: string;
}

interface AssetFiltersProps {
  filters: FiltersState;
  onFilterChange: (filters: FiltersState) => void;
}

const assetTypes = [
  { value: "", label: "All Types" },
  { value: "carbon_credit", label: "Carbon Credits" },
  { value: "real_estate", label: "Real Estate" },
  { value: "treasury", label: "Treasury" },
  { value: "collectible", label: "Collectible" },
  { value: "commodity", label: "Commodity" },
];

export function AssetFilters({ filters, onFilterChange }: AssetFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search assets..."
          value={filters.search}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
          className="pl-10 bg-white/5 border-white/10"
        />
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {assetTypes.map((type) => (
          <Button
            key={type.value}
            variant={filters.type === type.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange({ ...filters, type: type.value })}
            className={filters.type === type.value 
              ? "bg-qubic hover:bg-qubic/90" 
              : "border-white/10 hover:bg-white/5"
            }
          >
            {type.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
