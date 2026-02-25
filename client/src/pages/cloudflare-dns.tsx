import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Cloud, 
  Plus, 
  Trash2, 
  Edit, 
  RefreshCw, 
  Settings, 
  Globe, 
  Shield,
  CheckCircle2,
  XCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CloudflareConfig {
  id: number;
  zoneId: string;
  zoneName: string;
  isActive: boolean;
  apiToken: string;
}

interface DNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  priority?: number;
}

export default function CloudflareDNS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);

  const [configForm, setConfigForm] = useState({
    apiToken: '',
    zoneId: '',
    zoneName: ''
  });

  const [recordForm, setRecordForm] = useState({
    type: 'A',
    name: '',
    content: '',
    ttl: 3600,
    proxied: false,
    priority: undefined as number | undefined
  });

  const { data: config, isLoading: configLoading } = useQuery<CloudflareConfig | null>({
    queryKey: ['/api/cloudflare/config'],
    retry: false,
  });

  const { data: records = [], isLoading: recordsLoading } = useQuery<DNSRecord[]>({
    queryKey: ['/api/cloudflare/dns/records'],
    enabled: !!config,
    retry: false,
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: typeof configForm) => {
      if (!data.apiToken || !data.zoneId || !data.zoneName) {
        throw new Error("All fields are required");
      }
      return await apiRequest('POST', '/api/cloudflare/config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloudflare/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cloudflare/dns/records'] });
      toast({
        title: "✅ Configuration Saved",
        description: "Cloudflare configuration has been saved successfully. You can now manage DNS records."
      });
      setShowConfigDialog(false);
      setConfigForm({ apiToken: '', zoneId: '', zoneName: '' });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Configuration Error",
        description: error.message || "Failed to save configuration. Please check your API token and Zone ID.",
        variant: "destructive"
      });
    }
  });

  const refreshRecordsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/cloudflare/dns/records');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloudflare/dns/records'] });
      toast({
        title: "Records Refreshed",
        description: "DNS records have been synced from Cloudflare."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh records",
        variant: "destructive"
      });
    }
  });

  const createRecordMutation = useMutation({
    mutationFn: async (data: typeof recordForm) => {
      return await apiRequest('POST', '/api/cloudflare/dns/records', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloudflare/dns/records'] });
      toast({
        title: "Record Created",
        description: "DNS record has been created successfully."
      });
      setShowRecordDialog(false);
      resetRecordForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create record",
        variant: "destructive"
      });
    }
  });

  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DNSRecord> }) => {
      return await apiRequest('PATCH', `/api/cloudflare/dns/records/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloudflare/dns/records'] });
      toast({
        title: "Record Updated",
        description: "DNS record has been updated successfully."
      });
      setShowRecordDialog(false);
      setEditingRecord(null);
      resetRecordForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update record",
        variant: "destructive"
      });
    }
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/cloudflare/dns/records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloudflare/dns/records'] });
      toast({
        title: "Record Deleted",
        description: "DNS record has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record",
        variant: "destructive"
      });
    }
  });

  const resetRecordForm = () => {
    setRecordForm({
      type: 'A',
      name: '',
      content: '',
      ttl: 3600,
      proxied: false,
      priority: undefined
    });
  };

  const handleEditRecord = (record: DNSRecord) => {
    setEditingRecord(record);
    setRecordForm({
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      proxied: record.proxied,
      priority: record.priority
    });
    setShowRecordDialog(true);
  };

  const validateIPv4 = (ip: string): boolean => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  };

  const validateIPv6 = (ip: string): boolean => {
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(ip);
  };

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  };

  const handleSaveRecord = () => {
    // Validate form
    if (!recordForm.type || !recordForm.name || !recordForm.content) {
      toast({
        title: "Validation Error",
        description: "Type, Name, and Content are required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate A record IP address
    if (recordForm.type === 'A' && !validateIPv4(recordForm.content)) {
      toast({
        title: "Validation Error",
        description: "Invalid IPv4 address format for A record",
        variant: "destructive"
      });
      return;
    }

    // Validate AAAA record IPv6 address
    if (recordForm.type === 'AAAA' && !validateIPv6(recordForm.content)) {
      toast({
        title: "Validation Error",
        description: "Invalid IPv6 address format for AAAA record",
        variant: "destructive"
      });
      return;
    }

    // Validate CNAME domain
    if (recordForm.type === 'CNAME' && !validateDomain(recordForm.content)) {
      toast({
        title: "Validation Error",
        description: "Invalid domain format for CNAME record",
        variant: "destructive"
      });
      return;
    }

    // Validate MX record has priority
    if (recordForm.type === 'MX' && !recordForm.priority) {
      toast({
        title: "Validation Error",
        description: "MX records require a priority value",
        variant: "destructive"
      });
      return;
    }

    // Validate MX record domain
    if (recordForm.type === 'MX' && !validateDomain(recordForm.content)) {
      toast({
        title: "Validation Error",
        description: "Invalid mail server domain format for MX record",
        variant: "destructive"
      });
      return;
    }

    if (editingRecord) {
      updateRecordMutation.mutate({ id: editingRecord.id, data: recordForm });
    } else {
      createRecordMutation.mutate(recordForm);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cloud className="h-8 w-8 text-orange-500" />
            Cloudflare DNS Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your DNS records directly from Cloudflare
          </p>
        </div>
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-open-config">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-cloudflare-config">
            <DialogHeader>
              <DialogTitle>Cloudflare Configuration</DialogTitle>
              <DialogDescription>
                Enter your Cloudflare API credentials to manage DNS records
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiToken">API Token</Label>
                <Input
                  id="apiToken"
                  type="password"
                  placeholder="Enter Cloudflare API Token"
                  value={configForm.apiToken}
                  onChange={(e) => setConfigForm({ ...configForm, apiToken: e.target.value })}
                  data-testid="input-api-token"
                />
              </div>
              <div>
                <Label htmlFor="zoneId">Zone ID</Label>
                <Input
                  id="zoneId"
                  placeholder="Enter Zone ID"
                  value={configForm.zoneId}
                  onChange={(e) => setConfigForm({ ...configForm, zoneId: e.target.value })}
                  data-testid="input-zone-id"
                />
              </div>
              <div>
                <Label htmlFor="zoneName">Zone Name (Domain)</Label>
                <Input
                  id="zoneName"
                  placeholder="example.com"
                  value={configForm.zoneName}
                  onChange={(e) => setConfigForm({ ...configForm, zoneName: e.target.value })}
                  data-testid="input-zone-name"
                />
              </div>
              <Button 
                onClick={() => saveConfigMutation.mutate(configForm)}
                disabled={saveConfigMutation.isPending}
                className="w-full"
                data-testid="button-save-config"
              >
                {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {config ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {config.zoneName}
                  </CardTitle>
                  <CardDescription>Zone ID: {config.zoneId}</CardDescription>
                </div>
                <Badge variant={config.isActive ? "default" : "secondary"} className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {config.isActive ? "Connected" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Quick Guide</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>A Record</strong>: Points domain to an IPv4 address</li>
                    <li>• <strong>CNAME</strong>: Creates an alias for another domain</li>
                    <li>• <strong>MX Record</strong>: Directs email to mail servers</li>
                    <li>• <strong>TXT Record</strong>: Stores text data for verification</li>
                    <li>• <strong>Proxied (Orange Cloud)</strong>: Routes through Cloudflare for DDoS protection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <Cloud className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No Configuration Found</h3>
                <p className="text-muted-foreground text-sm">
                  Please configure your Cloudflare credentials to get started
                </p>
              </div>
              <Button onClick={() => setShowConfigDialog(true)} data-testid="button-configure-cloudflare">
                <Settings className="h-4 w-4 mr-2" />
                Configure Cloudflare
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {config && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>DNS Records</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshRecordsMutation.mutate()}
                  disabled={refreshRecordsMutation.isPending}
                  data-testid="button-refresh-records"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshRecordsMutation.isPending ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Dialog open={showRecordDialog} onOpenChange={(open) => {
                  setShowRecordDialog(open);
                  if (!open) {
                    setEditingRecord(null);
                    resetRecordForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-record">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-dns-record">
                    <DialogHeader>
                      <DialogTitle>{editingRecord ? 'Edit' : 'Add'} DNS Record</DialogTitle>
                      <DialogDescription>
                        {editingRecord ? 'Update' : 'Create'} a DNS record for your domain
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select value={recordForm.type} onValueChange={(value) => setRecordForm({ ...recordForm, type: value })}>
                          <SelectTrigger data-testid="select-record-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="AAAA">AAAA</SelectItem>
                            <SelectItem value="CNAME">CNAME</SelectItem>
                            <SelectItem value="MX">MX</SelectItem>
                            <SelectItem value="TXT">TXT</SelectItem>
                            <SelectItem value="NS">NS</SelectItem>
                            <SelectItem value="SRV">SRV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="subdomain or @"
                          value={recordForm.name}
                          onChange={(e) => setRecordForm({ ...recordForm, name: e.target.value })}
                          data-testid="input-record-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="content">Content</Label>
                        <Input
                          id="content"
                          placeholder="IP address or target"
                          value={recordForm.content}
                          onChange={(e) => setRecordForm({ ...recordForm, content: e.target.value })}
                          data-testid="input-record-content"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ttl">TTL (seconds)</Label>
                        <Input
                          id="ttl"
                          type="number"
                          value={recordForm.ttl}
                          onChange={(e) => setRecordForm({ ...recordForm, ttl: parseInt(e.target.value) })}
                          data-testid="input-record-ttl"
                        />
                      </div>
                      {recordForm.type === 'MX' && (
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Input
                            id="priority"
                            type="number"
                            value={recordForm.priority || ''}
                            onChange={(e) => setRecordForm({ ...recordForm, priority: parseInt(e.target.value) })}
                            data-testid="input-record-priority"
                          />
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="proxied"
                          checked={recordForm.proxied}
                          onCheckedChange={(checked) => setRecordForm({ ...recordForm, proxied: checked })}
                          data-testid="switch-proxied"
                        />
                        <Label htmlFor="proxied" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Proxied through Cloudflare
                        </Label>
                      </div>
                      <Button 
                        onClick={handleSaveRecord}
                        disabled={createRecordMutation.isPending || updateRecordMutation.isPending}
                        className="w-full"
                        data-testid="button-save-record"
                      >
                        {(createRecordMutation.isPending || updateRecordMutation.isPending) ? "Saving..." : "Save Record"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recordsLoading ? (
              <div className="text-center py-8">Loading records...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No DNS records found. Click "Add Record" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>TTL</TableHead>
                      <TableHead>Proxied</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} data-testid={`row-dns-record-${record.id}`}>
                        <TableCell>
                          <Badge variant="outline">{record.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{record.content}</TableCell>
                        <TableCell>{record.ttl === 1 ? 'Auto' : record.ttl}</TableCell>
                        <TableCell>
                          {record.proxied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/cloudflare/dns/verify/${record.id}`);
                                  const data = await response.json();
                                  
                                  if (data.propagation?.isPropagated) {
                                    toast({
                                      title: "✅ DNS Verified",
                                      description: "Record is propagated and active"
                                    });
                                  } else if (data.propagation?.isPropagated === false) {
                                    toast({
                                      title: "⏳ Not Propagated Yet",
                                      description: "DNS record is not fully propagated. This can take up to 48 hours.",
                                      variant: "destructive"
                                    });
                                  } else {
                                    toast({
                                      title: "⚠️ Could Not Verify",
                                      description: data.propagation?.error || "Unable to verify DNS propagation",
                                      variant: "destructive"
                                    });
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to verify DNS record",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              data-testid={`button-verify-${record.id}`}
                            >
                              <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRecord(record)}
                              data-testid={`button-edit-${record.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this DNS record?')) {
                                  deleteRecordMutation.mutate(record.id);
                                }
                              }}
                              data-testid={`button-delete-${record.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
