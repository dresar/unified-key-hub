import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, CheckCircle, XCircle, Activity, Zap, Globe, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mock data for charts
const requestsData = [
  { name: "00:00", requests: 120 },
  { name: "04:00", requests: 89 },
  { name: "08:00", requests: 340 },
  { name: "12:00", requests: 780 },
  { name: "16:00", requests: 650 },
  { name: "20:00", requests: 420 },
  { name: "24:00", requests: 280 },
];

const providerData = [
  { name: "Gemini", value: 45, color: "hsl(199, 89%, 48%)" },
  { name: "Groq", value: 30, color: "hsl(187, 100%, 42%)" },
  { name: "OpenAI", value: 25, color: "hsl(142, 76%, 36%)" },
];

const recentActivity = [
  { id: 1, endpoint: "/v1/chat/completions", provider: "Gemini", status: "success", latency: "234ms", time: "2 min ago" },
  { id: 2, endpoint: "/v1/chat/completions", provider: "Groq", status: "success", latency: "189ms", time: "5 min ago" },
  { id: 3, endpoint: "/v1/chat/completions", provider: "Gemini", status: "error", latency: "-", time: "8 min ago" },
  { id: 4, endpoint: "/v1/embeddings", provider: "OpenAI", status: "success", latency: "312ms", time: "12 min ago" },
  { id: 5, endpoint: "/v1/chat/completions", provider: "Gemini", status: "success", latency: "198ms", time: "15 min ago" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your API gateway status</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-1.5 text-sm text-success">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Gateway Online
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total API Keys"
          value={12}
          change="+2 this week"
          changeType="positive"
          icon={Key}
        />
        <StatCard
          title="Active Keys"
          value={9}
          change="75% active"
          changeType="positive"
          icon={CheckCircle}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Failed Keys"
          value={3}
          change="Quota exhausted"
          changeType="negative"
          icon={XCircle}
          iconColor="bg-destructive/10 text-destructive"
        />
        <StatCard
          title="Requests Today"
          value="2,847"
          change="+12% vs yesterday"
          changeType="positive"
          icon={Activity}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Requests chart */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Request Volume
            </CardTitle>
            <CardDescription>API requests over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={requestsData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(217, 33%, 17%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 98%)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(199, 89%, 48%)"
                  strokeWidth={2}
                  fill="url(#colorRequests)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Provider distribution */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Globe className="h-5 w-5 text-accent" />
              Provider Usage
            </CardTitle>
            <CardDescription>Distribution by provider</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={providerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {providerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(217, 33%, 17%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 98%)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {providerData.map((provider) => (
                <div key={provider.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: provider.color }} />
                  <span className="text-sm text-muted-foreground">{provider.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Zap className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest API requests through the gateway</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Endpoint</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Provider</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Latency</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity) => (
                  <tr key={activity.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-mono text-sm text-foreground">{activity.endpoint}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className="font-medium">
                        {activity.provider}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={activity.status === "success" ? "default" : "destructive"}
                        className={activity.status === "success" ? "bg-success/20 text-success border-success/30" : ""}
                      >
                        {activity.status}
                      </Badge>
                    </td>
                    <td className="py-3 font-mono text-sm text-muted-foreground">{activity.latency}</td>
                    <td className="py-3 text-sm text-muted-foreground">{activity.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
