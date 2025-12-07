"use client";

import Link from "next/link";
import { ArrowRight, Plus, Vote, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  {
    title: "Create Asset",
    description: "Tokenize a new real-world asset",
    icon: Plus,
    href: "/dashboard/create",
    color: "bg-qubic",
  },
  {
    title: "Browse Marketplace",
    description: "Explore verified RWA listings",
    icon: ArrowRight,
    href: "/marketplace",
    color: "bg-veri",
  },
  {
    title: "View Proposals",
    description: "Vote on new asset listings",
    icon: Vote,
    href: "/governance",
    color: "bg-purple-500",
  },
  {
    title: "Launchpad IPOs",
    description: "Participate in Dutch auctions",
    icon: Rocket,
    href: "/launchpad",
    color: "bg-orange-500",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <div className="group p-4 rounded-xl border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                <div
                  className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3`}
                >
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
