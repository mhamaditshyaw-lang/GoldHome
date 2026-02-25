import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Download, Upload, Database, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { authManager } from "@/lib/auth";
import { useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function BackupRestore() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const [tablesToClear, setTablesToClear] = useState<string[]>([]);

  const user = authManager.getState().user;

  if (!user || user.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const availableTables = [
    { id: 'services', label: 'Services' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'debts', label: 'Debts' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'locations', label: 'Location History' },
  ];

  const exportBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/backup/export', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Backup Exported",
        description: "Your backup file has been downloaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export backup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async (backupData: any) => {
      const response = await apiRequest("POST", "/api/backup/restore", backupData);
      return response.json();
    },
    onSuccess: (data) => {
      setRestoreResult(data);
      queryClient.invalidateQueries();
      toast({
        title: "Backup Restored",
        description: "Your backup has been restored successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Restore Failed",
        description: "Failed to restore backup. Please check the file format.",
        variant: "destructive",
      });
    },
  });

  const clearDataMutation = useMutation({
    mutationFn: async (tables: string[]) => {
      const response = await apiRequest("DELETE", "/api/backup/clear-data", { tables });
      return response.json();
    },
    onSuccess: () => {
      setTablesToClear([]);
      queryClient.invalidateQueries();
      toast({
        title: "Data Cleared",
        description: "Selected data has been cleared successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Clear Failed",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        restoreBackupMutation.mutate(backupData);
      } catch (error) {
        toast({
          title: "Invalid File",
          description: "The selected file is not a valid backup file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleTable = (tableId: string) => {
    setTablesToClear(prev =>
      prev.includes(tableId)
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="backup-restore-title">
          Backup & Restore
        </h1>
        <p className="text-gray-600 mt-2" data-testid="backup-restore-subtitle">
          Export your data for safekeeping or restore from a previous backup
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="export-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-600" />
              <span>Export Backup</span>
            </CardTitle>
            <CardDescription>
              Download all your system data as a JSON file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                The backup includes users, services, invoices, expenses, debts, equipment, settings, and notifications.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => exportBackupMutation.mutate()}
              disabled={exportBackupMutation.isPending}
              className="w-full"
              data-testid="button-export-backup"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportBackupMutation.isPending ? "Exporting..." : "Export Backup"}
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="import-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-green-600" />
              <span>Restore Backup</span>
            </CardTitle>
            <CardDescription>
              Restore all data from a backup file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                For best results, use the Clear Data function below to remove existing data before restoring to avoid duplicates.
              </AlertDescription>
            </Alert>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="input-file-upload"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={restoreBackupMutation.isPending}
              className="w-full"
              variant="outline"
              data-testid="button-restore-backup"
            >
              <Upload className="h-4 w-4 mr-2" />
              {restoreBackupMutation.isPending ? "Restoring..." : "Upload & Restore"}
            </Button>

            {restoreResult && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-semibold mb-2">Restore completed!</div>
                  <div className="text-sm space-y-1 max-h-64 overflow-y-auto">
                    <div><strong>Restored:</strong></div>
                    <div className="ml-3 grid grid-cols-2 gap-x-4">
                      {Object.entries(restoreResult.restored || {}).map(([key, value]) => (
                        (value as number) > 0 && <div key={key}>{key}: {value as number}</div>
                      ))}
                    </div>
                    {restoreResult.skipped && Object.keys(restoreResult.skipped).length > 0 && (
                      <div className="mt-2">
                        <strong>Skipped (already exists):</strong>
                        <div className="ml-3">
                          {Object.entries(restoreResult.skipped).map(([key, value]) => (
                            (value as number) > 0 && <div key={key}>{key}: {value as number}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {restoreResult.note && (
                      <div className="mt-2 text-xs italic">{restoreResult.note}</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-red-200" data-testid="danger-zone-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Clear specific data from your system. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select tables to clear:</Label>
            <div className="grid grid-cols-2 gap-3">
              {availableTables.map((table) => (
                <div key={table.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={table.id}
                    checked={tablesToClear.includes(table.id)}
                    onCheckedChange={() => toggleTable(table.id)}
                    data-testid={`checkbox-${table.id}`}
                  />
                  <Label
                    htmlFor={table.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {table.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Warning: Clearing data is permanent and cannot be undone. Make sure you have a backup before proceeding.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => clearDataMutation.mutate(tablesToClear)}
            disabled={tablesToClear.length === 0 || clearDataMutation.isPending}
            variant="destructive"
            className="w-full"
            data-testid="button-clear-data"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {clearDataMutation.isPending ? "Clearing..." : `Clear Selected Data (${tablesToClear.length})`}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6 bg-blue-50 border-blue-200" data-testid="info-card">
        <CardHeader>
          <CardTitle className="text-blue-800">Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Export backups regularly to protect your data</li>
            <li>Store backup files in a secure location</li>
            <li>Test your backups by restoring them in a test environment</li>
            <li>Always create a backup before clearing any data</li>
            <li>Keep multiple backup versions from different dates</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
