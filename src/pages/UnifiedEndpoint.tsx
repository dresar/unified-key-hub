import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Copy, Play, CheckCircle, Loader2, Code, Terminal, Zap, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const samplePayload = `{
  "model": "gemini-1.5-flash",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "stream": false
}`;

const endpointUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gateway`;

const sampleResponse = `{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gemini-1.5-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 18,
    "total_tokens": 30
  },
  "provider": "gemini",
  "key_used": "gemini-key-1"
}`;

export default function UnifiedEndpoint() {
  const [payload, setPayload] = useState(samplePayload);
  const [response, setResponse] = useState("");
  const [responseStatus, setResponseStatus] = useState<"success" | "error" | null>(null);
  const [latency, setLatency] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("auto");

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(endpointUrl);
    toast.success("Endpoint URL copied to clipboard");
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(payload);
    toast.success("Payload copied to clipboard");
  };

  const handleTestRequest = async () => {
    setIsLoading(true);
    setResponse("");
    setResponseStatus(null);

    const startTime = Date.now();

    try {
      const parsedPayload = JSON.parse(payload);
      
      const { data, error } = await supabase.functions.invoke("gateway", {
        body: parsedPayload,
      });

      const elapsed = Date.now() - startTime;
      setLatency(elapsed);

      if (error) {
        setResponse(JSON.stringify({ error: error.message }, null, 2));
        setResponseStatus("error");
        toast.error("Request failed", { description: error.message });
      } else {
        setResponse(JSON.stringify(data, null, 2));
        setResponseStatus("success");
        toast.success("Request completed", {
          description: `Response from ${data?.provider || "gateway"} in ${elapsed}ms`,
        });
      }
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      setLatency(elapsed);
      setResponse(JSON.stringify({ error: error.message }, null, 2));
      setResponseStatus("error");
      toast.error("Request failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Unified API Endpoint</h1>
        <p className="text-muted-foreground">
          One endpoint for all your AI providers with automatic failover
        </p>
      </div>

      {/* Endpoint URL card */}
      <Card className="border-primary/30 bg-card shadow-glow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Your Gateway Endpoint
          </CardTitle>
          <CardDescription>
            Use this endpoint as a drop-in replacement for OpenAI API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-muted p-3 font-mono text-sm text-foreground">
              POST {endpointUrl}
            </div>
            <Button variant="outline" size="icon" onClick={handleCopyUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
              <p className="text-2xl font-bold text-primary">99.9%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
              <p className="text-2xl font-bold text-accent">~200ms</p>
              <p className="text-sm text-muted-foreground">Avg Latency</p>
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
              <p className="text-2xl font-bold text-success">3</p>
              <p className="text-sm text-muted-foreground">Active Providers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API tester */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-accent" />
            API Tester
          </CardTitle>
          <CardDescription>Test your gateway with a sample request</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="request" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
            </TabsList>

            <TabsContent value="request" className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Model Override (optional)</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (use rotation)</SelectItem>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="llama-3.1-70b">Llama 3.1 70B (Groq)</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleTestRequest}
                  disabled={isLoading}
                  className="mt-6 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Send Request
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Request Body (JSON)</Label>
                  <Button variant="ghost" size="sm" onClick={handleCopyPayload}>
                    <Copy className="mr-2 h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Enter your request payload..."
                />
              </div>
            </TabsContent>

            <TabsContent value="response" className="space-y-4">
              {response ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {responseStatus === "success" ? (
                      <Badge className="bg-success/20 text-success border-success/30">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        200 OK
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                        <XCircle className="mr-1 h-3 w-3" />
                        Error
                      </Badge>
                    )}
                    <Badge variant="secondary">{latency}ms</Badge>
                  </div>
                  <pre className="mt-4 overflow-auto rounded-lg bg-muted p-4 font-mono text-sm text-foreground max-h-[300px]">
                    {response}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Code className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    No response yet. Send a request to see the result.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" />
            How Rotation Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                1
              </div>
              <h4 className="mt-3 font-semibold text-foreground">Request Received</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Gateway receives your OpenAI-compatible request
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                2
              </div>
              <h4 className="mt-3 font-semibold text-foreground">Key Selection</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Picks the next available key based on priority and quota
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success font-bold">
                3
              </div>
              <h4 className="mt-3 font-semibold text-foreground">Auto-Failover</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                On quota error, instantly switches to next key or provider
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
