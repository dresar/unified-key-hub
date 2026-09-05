import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { useState } from "react";

export function DashboardLayout() {
  const [sidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
