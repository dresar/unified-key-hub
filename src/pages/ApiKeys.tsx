import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Key, Plus, MoreVertical, Pencil, Trash2, Search, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  key: string;
  status: "active" | "inactive" | "exhausted";
  requestsToday: number;
  lastUsed: string;
  priority: number;
}

const mockProviders = [
  { id: "gemini", name: "Google Gemini", color: "bg-blue-500" },
  { id: "groq", name: "Groq", color: "bg-orange-500" },
  { id: "openai", name: "OpenAI Compatible", color: "bg-green-500" },
  { id: "anthropic", name: "Anthropic", color: "bg-purple-500" },
];

const mockApiKeys: ApiKey[] = [
  { id: "1", name: "Gemini Key 1", provider: "gemini", key: "AIzaSy...abc123", status: "active", requestsToday: 1234, lastUsed: "2 min ago", priority: 1 },
  { id: "2", name: "Gemini Key 2", provider: "gemini", key: "AIzaSy...def456", status: "active", requestsToday: 890, lastUsed: "5 min ago", priority: 2 },
  { id: "3", name: "Gemini Key 3", provider: "gemini", key: "AIzaSy...ghi789", status: "exhausted", requestsToday: 5000, lastUsed: "1 hour ago", priority: 3 },
  { id: "4", name: "Groq Key 1", provider: "groq", key: "gsk_...xyz789", status: "active", requestsToday: 456, lastUsed: "10 min ago", priority: 1 },
  { id: "5", name: "Groq Key 2", provider: "groq", key: "gsk_...uvw123", status: "inactive", requestsToday: 0, lastUsed: "Never", priority: 2 },
  { id: "6", name: "OpenAI Key 1", provider: "openai", key: "sk-...abc456", status: "active", requestsToday: 267, lastUsed: "15 min ago", priority: 1 },
];

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>(mockApiKeys);
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);

  // Form state
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyProvider, setNewKeyProvider] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");

  const filteredKeys = keys.filter((key) => {
    const matchesSearch = key.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = providerFilter === "all" || key.provider === providerFilter;
    return matchesSearch && matchesProvider;
  });

  const handleAddKey = () => {
    if (!newKeyName || !newKeyProvider || !newKeyValue) {
      toast.error("Please fill in all fields");
      return;
    }

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      provider: newKeyProvider,
      key: newKeyValue.slice(0, 8) + "..." + newKeyValue.slice(-6),
      status: "active",
      requestsToday: 0,
      lastUsed: "Never",
      priority: keys.filter((k) => k.provider === newKeyProvider).length + 1,
    };

    setKeys([...keys, newKey]);
    setIsAddDialogOpen(false);
    setNewKeyName("");
    setNewKeyProvider("");
    setNewKeyValue("");
    toast.success("API key added successfully");
  };

  const handleDeleteKey = () => {
    if (deleteKeyId) {
      setKeys(keys.filter((k) => k.id !== deleteKeyId));
      setDeleteKeyId(null);
      toast.success("API key deleted");
    }
  };

  const handleToggleStatus = (keyId: string) => {
    setKeys(
      keys.map((k) =>
        k.id === keyId
          ? { ...k, status: k.status === "active" ? "inactive" : "active" }
          : k
      )
    );
    toast.success("Key status updated");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle className="mr-1 h-3 w-3" /> Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            <XCircle className="mr-1 h-3 w-3" /> Inactive
          </Badge>
        );
      case "exhausted":
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            <AlertTriangle className="mr-1 h-3 w-3" /> Exhausted
          </Badge>
        );
      default:
        return null;
    }
  };

  const getProviderBadge = (providerId: string) => {
    const provider = mockProviders.find((p) => p.id === providerId);
    return provider ? (
      <Badge variant="outline" className="font-medium">
        {provider.name}
      </Badge>
    ) : null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys across all providers</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-glow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
              <DialogDescription>
                Add a new API key from any supported provider
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Gemini Key 1"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={newKeyProvider} onValueChange={setNewKeyProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder="Enter your API key"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddKey}>Add Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {mockProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Keys table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            All Keys ({filteredKeys.length})
          </CardTitle>
          <CardDescription>Enable, disable, or manage rotation priority</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Provider</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Key</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Requests</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Last Used</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Enabled</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((key) => (
                  <tr key={key.id} className="border-b border-border/50 last:border-0">
                    <td className="py-4 font-medium text-foreground">{key.name}</td>
                    <td className="py-4">{getProviderBadge(key.provider)}</td>
                    <td className="py-4 font-mono text-sm text-muted-foreground">{key.key}</td>
                    <td className="py-4">{getStatusBadge(key.status)}</td>
                    <td className="py-4 font-mono text-sm text-foreground">{key.requestsToday.toLocaleString()}</td>
                    <td className="py-4 text-sm text-muted-foreground">{key.lastUsed}</td>
                    <td className="py-4">
                      <Switch
                        checked={key.status === "active"}
                        onCheckedChange={() => handleToggleStatus(key.id)}
                        disabled={key.status === "exhausted"}
                      />
                    </td>
                    <td className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingKey(key)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteKeyId(key.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The key will be permanently removed from your gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
