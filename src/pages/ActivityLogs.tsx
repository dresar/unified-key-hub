import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Search, Filter, Download, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  provider: string;
  keyName: string;
  status: "success" | "error" | "pending";
  statusCode: number;
  latency: number;
  requestSize: string;
  responseSize: string;
  errorMessage?: string;
}

const mockLogs: LogEntry[] = [
  { id: "1", timestamp: "2024-01-15 14:32:45", endpoint: "/v1/chat/completions", method: "POST", provider: "Gemini", keyName: "Gemini Key 1", status: "success", statusCode: 200, latency: 234, requestSize: "1.2KB", responseSize: "2.8KB" },
  { id: "2", timestamp: "2024-01-15 14:32:40", endpoint: "/v1/chat/completions", method: "POST", provider: "Groq", keyName: "Groq Key 1", status: "success", statusCode: 200, latency: 189, requestSize: "980B", responseSize: "1.5KB" },
  { id: "3", timestamp: "2024-01-15 14:32:35", endpoint: "/v1/chat/completions", method: "POST", provider: "Gemini", keyName: "Gemini Key 2", status: "error", statusCode: 429, latency: 45, requestSize: "1.1KB", responseSize: "256B", errorMessage: "Quota exceeded" },
  { id: "4", timestamp: "2024-01-15 14:32:30", endpoint: "/v1/embeddings", method: "POST", provider: "OpenAI", keyName: "OpenAI Key 1", status: "success", statusCode: 200, latency: 312, requestSize: "2.4KB", responseSize: "8.1KB" },
  { id: "5", timestamp: "2024-01-15 14:32:25", endpoint: "/v1/chat/completions", method: "POST", provider: "Gemini", keyName: "Gemini Key 1", status: "success", statusCode: 200, latency: 198, requestSize: "1.0KB", responseSize: "2.2KB" },
  { id: "6", timestamp: "2024-01-15 14:32:20", endpoint: "/v1/chat/completions", method: "POST", provider: "Gemini", keyName: "Gemini Key 3", status: "error", statusCode: 500, latency: 1200, requestSize: "1.5KB", responseSize: "128B", errorMessage: "Internal server error" },
  { id: "7", timestamp: "2024-01-15 14:32:15", endpoint: "/v1/chat/completions", method: "POST", provider: "Groq", keyName: "Groq Key 2", status: "success", statusCode: 200, latency: 156, requestSize: "890B", responseSize: "1.8KB" },
  { id: "8", timestamp: "2024-01-15 14:32:10", endpoint: "/v1/models", method: "GET", provider: "Gemini", keyName: "Gemini Key 1", status: "success", statusCode: 200, latency: 89, requestSize: "256B", responseSize: "4.2KB" },
];

export default function ActivityLogs() {
  const [logs] = useState<LogEntry[]>(mockLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.keyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesProvider = providerFilter === "all" || log.provider.toLowerCase() === providerFilter;
    return matchesSearch && matchesStatus && matchesProvider;
  });

  const getStatusBadge = (status: string, statusCode: number) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle className="mr-1 h-3 w-3" />
            {statusCode}
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            <XCircle className="mr-1 h-3 w-3" />
            {statusCode}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground">Monitor all API requests and responses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by endpoint or key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="groq">Groq</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Request History ({filteredLogs.length})
          </CardTitle>
          <CardDescription>Detailed log of all gateway requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Timestamp</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Endpoint</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Provider</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Key</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Latency</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Size</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 text-sm text-muted-foreground font-mono">{log.timestamp}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {log.method}
                        </Badge>
                        <span className="font-mono text-sm text-foreground">{log.endpoint}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary">{log.provider}</Badge>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">{log.keyName}</td>
                    <td className="py-3">{getStatusBadge(log.status, log.statusCode)}</td>
                    <td className="py-3 font-mono text-sm text-foreground">{log.latency}ms</td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {log.requestSize} / {log.responseSize}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLogs.length} of {logs.length} entries
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
