"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency, truncateAddress } from "@/lib/utils";

const activities = [
  {
    id: "1",
    type: "trade",
    action: "Bought",
    asset: "VCC-01",
    amount: 100,
    price: 12.5,
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "2",
    type: "verification",
    action: "Verified",
    asset: "VRE-NYC",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "3",
    type: "vote",
    action: "Voted FOR",
    proposal: "Carbon Credit Batch #45",
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: "4",
    type: "ipo",
    action: "Bid placed",
    asset: "VTN-30D",
    amount: 50,
    price: 98.5,
    status: "pending",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: "5",
    type: "trade",
    action: "Sold",
    asset: "VCC-03",
    amount: 25,
    price: 15.2,
    status: "completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

const statusColors = {
  completed: "bg-green-500/10 text-green-500",
  pending: "bg-yellow-500/10 text-yellow-500",
  failed: "bg-red-500/10 text-red-500",
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest transactions and actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {activity.action}{" "}
                    {activity.asset || activity.proposal}
                  </span>
                  {activity.amount && (
                    <span className="text-sm text-muted-foreground">
                      {activity.amount} units @ {formatCurrency(activity.price!)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant="secondary"
                  className={statusColors[activity.status as keyof typeof statusColors]}
                >
                  {activity.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDate(activity.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
