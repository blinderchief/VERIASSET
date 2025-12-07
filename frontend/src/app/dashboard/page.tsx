import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardStats } from "@/components/dashboard/stats";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <DashboardHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {/* Background effects */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-b from-qubic/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-gradient-to-r from-veri/5 to-transparent rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-7xl mx-auto space-y-8">
            {/* Welcome */}
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back! 👋</h1>
              <p className="text-muted-foreground mt-1">
                Here's an overview of your VeriAssets portfolio
              </p>
            </div>

            {/* Stats */}
            <DashboardStats />

            {/* Quick Actions */}
            <QuickActions />

            {/* Recent Activity */}
            <RecentActivity />
          </div>
        </main>
      </div>
    </div>
  );
}
