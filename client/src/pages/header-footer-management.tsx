import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Save, FileText, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSettings } from "@/hooks/use-settings";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HeaderFooterManagement() {
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [footerImage, setFooterImage] = useState<string | null>(null);
  const [headerWidth, setHeaderWidth] = useState("100");
  const [headerHeight, setHeaderHeight] = useState("80");
  const [footerWidth, setFooterWidth] = useState("100");
  const [footerHeight, setFooterHeight] = useState("60");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("header-footer")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  // Query to fetch existing invoice settings
  const { data: invoiceSettings, isLoading } = useQuery<any>({
    queryKey: ['/api/invoice-settings'],
  });

  // Mutation to save invoice settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      console.log('Mutation starting, payload size:', JSON.stringify(settingsData).length);
      const response = await apiRequest('POST', '/api/invoice-settings', settingsData);
      console.log('Mutation successful');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoice-settings'] });
      toast({
        title: "Settings Saved",
        description: "Header and footer settings have been saved to the database successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  // Load settings when data is available
  useEffect(() => {
    if (invoiceSettings) {
      setHeaderText(invoiceSettings.headerText || "");
      setFooterText(invoiceSettings.footerText || "");
      setHeaderImage(invoiceSettings.headerImage || null);
      setFooterImage(invoiceSettings.footerImage || null);
      setHeaderWidth(invoiceSettings.headerWidth || "100");
      setHeaderHeight(invoiceSettings.headerHeight || "80");
      setFooterWidth(invoiceSettings.footerWidth || "100");
      setFooterHeight(invoiceSettings.footerHeight || "60");
    }
  }, [invoiceSettings]);

  // Helper function to handle image upload
  const handleImageUpload = (type: "header" | "footer", event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === "header") {
          setHeaderImage(result);
        } else {
          setFooterImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to remove uploaded image
  const removeImage = (type: "header" | "footer") => {
    if (type === "header") {
      setHeaderImage(null);
    } else {
      setFooterImage(null);
    }
  };

  const saveSettings = () => {
    const settingsData = {
      headerText: headerText || "",
      footerText: footerText || "",
      headerImage: headerImage || null,
      footerImage: footerImage || null,
      headerWidth: headerWidth || "100",
      headerHeight: headerHeight || "80",
      footerWidth: footerWidth || "100",
      footerHeight: footerHeight || "60",
    };

    console.log('Saving settings:', settingsData);
    saveSettingsMutation.mutate(settingsData);
  };

  const handleGenerateSampleInvoice = async () => {
    const { exportInvoiceToPDF } = await import('@/lib/pdf-export');

    // Create sample invoice data
    const sampleInvoice = {
      id: 999,
      customerName: "Sample Customer",
      services: [
        { id: 1, name: "House Cleaning", price: "50000", quantity: 1 },
        { id: 2, name: "Window Cleaning", price: "15000", quantity: 2 }
      ],
      totalAmount: "80000",
      createdAt: new Date().toISOString(),
      status: "paid",
      cleanerId: 1,
      notes: "This is a sample invoice generated to test header/footer settings.",
      paymentMethod: "cash",
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    try {
      // Create settings object with current values
      const settings = {
        companyName: "Mali Altwni Company",
        headerText,
        footerText,
        primaryColor: "#FFD700",
        secondaryColor: "#FFA500",
        accentColor: "#28A745",
        templateStyle: "modern",
        showCompanyInfo: true,
        showCustomerInfo: true,
        showServiceDetails: true,
        headerImage,
        footerImage,
        headerWidth,
        headerHeight,
        footerWidth,
        footerHeight
      };

      await exportInvoiceToPDF(sampleInvoice, settings);
      toast({
        title: "Sample Invoice Generated",
        description: "A sample invoice PDF has been downloaded to test your header/footer settings.",
      });
    } catch (error) {
      console.error('Error generating sample invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate sample invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-gray-600">Loading invoice settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Invoice Header & Footer Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Customize the header and footer for your invoice PDFs
          </p>
        </div>

        {/* Header Configuration */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Header Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Header Text */}
              <div className="space-y-2">
                <Label htmlFor="headerText" className="text-sm font-medium text-gray-700">
                  Header Text
                </Label>
                <Textarea
                  id="headerText"
                  placeholder="Enter header text (e.g., company name, tagline)"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              {/* Header Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Header Image
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                  {headerImage ? (
                    <div className="relative">
                      <img 
                        src={headerImage} 
                        alt="Header Preview" 
                        className="max-w-full h-auto mx-auto mb-2 rounded"
                        style={{ 
                          maxHeight: '100px',
                          objectFit: 'contain'
                        }}
                      />
                      <Button
                        onClick={() => removeImage('header')}
                        variant="destructive"
                        size="sm"
                        className="absolute top-0 right-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Upload header image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('header', e)}
                        className="hidden"
                        id="headerImageUpload"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('headerImageUpload')?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Header Size Controls */}
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Header Image Size (pixels)
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="headerWidth" className="text-xs text-gray-500">Width</Label>
                    <Input
                      id="headerWidth"
                      type="number"
                      value={headerWidth}
                      onChange={(e) => setHeaderWidth(e.target.value)}
                      placeholder="Width (px)"
                      min="10"
                      max="800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="headerHeight" className="text-xs text-gray-500">Height</Label>
                    <Input
                      id="headerHeight"
                      type="number"
                      value={headerHeight}
                      onChange={(e) => setHeaderHeight(e.target.value)}
                      placeholder="Height (px)"
                      min="10"
                      max="400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Configuration */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Footer Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Footer Text */}
              <div className="space-y-2">
                <Label htmlFor="footerText" className="text-sm font-medium text-gray-700">
                  Footer Text
                </Label>
                <Textarea
                  id="footerText"
                  placeholder="Enter footer text (e.g., contact info, thank you message)"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              {/* Footer Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Footer Image
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
                  {footerImage ? (
                    <div className="relative">
                      <img 
                        src={footerImage} 
                        alt="Footer Preview" 
                        className="max-w-full h-auto mx-auto mb-2 rounded"
                        style={{ 
                          maxHeight: '80px',
                          objectFit: 'contain'
                        }}
                      />
                      <Button
                        onClick={() => removeImage('footer')}
                        variant="destructive"
                        size="sm"
                        className="absolute top-0 right-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Upload footer image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('footer', e)}
                        className="hidden"
                        id="footerImageUpload"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('footerImageUpload')?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Size Controls */}
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Footer Image Size (pixels)
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="footerWidth" className="text-xs text-gray-500">Width</Label>
                    <Input
                      id="footerWidth"
                      type="number"
                      value={footerWidth}
                      onChange={(e) => setFooterWidth(e.target.value)}
                      placeholder="Width (px)"
                      min="10"
                      max="800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="footerHeight" className="text-xs text-gray-500">Height</Label>
                    <Input
                      id="footerHeight"
                      type="number"
                      value={footerHeight}
                      onChange={(e) => setFooterHeight(e.target.value)}
                      placeholder="Height (px)"
                      min="10"
                      max="200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg shadow-sm">
              {/* Header Preview */}
              {(headerText || headerImage) && (
                <div className="border-b border-gray-200 p-6 text-center">
                  {headerImage && (
                    <div className="mb-4">
                      <img 
                        src={headerImage} 
                        alt="Header Preview" 
                        className="mx-auto rounded"
                        style={{ 
                          objectFit: 'contain',
                          width: `${headerWidth}px`,
                          height: `${headerHeight}px`
                        }}
                      />
                    </div>
                  )}
                  {headerText && (
                    <p className="text-gray-700">{headerText}</p>
                  )}
                </div>
              )}

              {/* Content Area */}
              <div className="p-6 text-center text-gray-400">
                <p>Document content would appear here</p>
              </div>

              {/* Footer Preview */}
              {(footerText || footerImage) && (
                <div className="border-t border-gray-200 p-6 text-center">
                  {footerText && (
                    <p className="text-gray-700 mb-4">{footerText}</p>
                  )}
                  {footerImage && (
                    <div>
                      <img 
                        src={footerImage} 
                        alt="Footer Preview" 
                        className="mx-auto rounded"
                        style={{ 
                          objectFit: 'contain',
                          width: `${footerWidth}px`,
                          height: `${footerHeight}px`
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <Button 
            onClick={handleGenerateSampleInvoice}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Sample Invoice
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={saveSettingsMutation.isPending || isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {saveSettingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}