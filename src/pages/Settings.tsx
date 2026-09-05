import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon, Zap, RotateCcw, Globe, Shield, Save, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Provider {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
}

export default function Settings() {
  const [providers, setProviders] = useState<Provider[]>([
    { id: "gemini", name: "Google Gemini", priority: 1, enabled: true },
    { id: "groq", name: "Groq", priority: 2, enabled: true },
    { id: "openai", name: "OpenAI", priority: 3, enabled: true },
    { id: "anthropic", name: "Anthropic", priority: 4, enabled: false },
  ]);

  const [rotationStrategy, setRotationStrategy] = useState("round-robin");
  const [failoverDelay, setFailoverDelay] = useState("0");
  const [maxRetries, setMaxRetries] = useState("3");
  const [quotaCheckInterval, setQuotaCheckInterval] = useState("60");
  const [autoDisableExhausted, setAutoDisableExhausted] = useState(true);
  const [logRetention, setLogRetention] = useState("30");

  const handleToggleProvider = (id: string) => {
    setProviders(
      providers.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure rotation rules and gateway behavior</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Provider Priority */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Provider Priority
            </CardTitle>
            <CardDescription>Drag to reorder fallback priority</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {providers.map((provider, index) => (
                <div
                  key={provider.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <Badge variant="outline" className="w-6 justify-center">
                    {index + 1}
                  </Badge>
                  <span className="flex-1 font-medium text-foreground">{provider.name}</span>
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={() => handleToggleProvider(provider.id)}
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              When a provider's keys are exhausted, the gateway automatically falls back to the next enabled provider.
            </p>
          </CardContent>
        </Card>

        {/* Rotation Strategy */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-accent" />
              Rotation Strategy
            </CardTitle>
            <CardDescription>How keys are selected within a provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Key Selection Method</Label>
              <Select value={rotationStrategy} onValueChange={setRotationStrategy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round-robin">Round Robin</SelectItem>
                  <SelectItem value="least-used">Least Used</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="priority">Priority Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Failover Delay (ms)</Label>
                <Input
                  type="number"
                  value={failoverDelay}
                  onChange={(e) => setFailoverDelay(e.target.value)}
                  min="0"
                  max="5000"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Retries</Label>
                <Input
                  type="number"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(e.target.value)}
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quota Management */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning" />
              Quota Management
            </CardTitle>
            <CardDescription>Configure quota detection and handling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Quota Check Interval (seconds)</Label>
              <Input
                type="number"
                value={quotaCheckInterval}
                onChange={(e) => setQuotaCheckInterval(e.target.value)}
                min="10"
                max="3600"
              />
              <p className="text-xs text-muted-foreground">
                How often to check if exhausted keys have recovered
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div>
                <p className="font-medium text-foreground">Auto-disable Exhausted Keys</p>
                <p className="text-sm text-muted-foreground">
                  Automatically mark keys as inactive when quota is exceeded
                </p>
              </div>
              <Switch
                checked={autoDisableExhausted}
                onCheckedChange={setAutoDisableExhausted}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data & Logging */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              Data & Logging
            </CardTitle>
            <CardDescription>Configure log retention and data policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Log Retention (days)</Label>
              <Select value={logRetention} onValueChange={setLogRetention}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <p className="text-sm text-warning">
                <strong>Note:</strong> Logs older than the retention period will be automatically deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90">
          <Save className="mr-2 h-4 w-4" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
