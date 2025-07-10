import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Database, Cloud } from "lucide-react";
import { ReviewFilters } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface ExportSectionProps {
  filters: ReviewFilters;
}

export default function ExportSection({ filters }: ExportSectionProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const buildExportUrl = (endpoint: string, format: string) => {
    const params = new URLSearchParams();
    
    if (filters.service?.id) {
      params.append('serviceId', filters.service.id);
    }
    
    if (filters.source && filters.source.length > 0) {
      filters.source.forEach(source => params.append('source', source));
    }
    
    if (filters.dateFrom) {
      params.append('dateFrom', filters.dateFrom.toISOString());
    }
    
    if (filters.dateTo) {
      params.append('dateTo', filters.dateTo.toISOString());
    }
    
    params.append('format', format);
    
    return `/api/export/${endpoint}?${params.toString()}`;
  };

  const handleExport = async (type: 'reviews' | 'insights' | 'wordcloud') => {
    setIsExporting(true);
    
    try {
      const url = buildExportUrl(type, exportFormat);
      
      // Create a temporary anchor element for download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `${type} data exported successfully as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Data
        </CardTitle>
        <CardDescription>
          Export review data and insights in CSV or JSON format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Export Format</label>
          <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
              <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3 p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium">Reviews Data</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Export all review data including ratings, content, and sentiment analysis
            </p>
            <Button 
              onClick={() => handleExport('reviews')}
              disabled={isExporting}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Reviews'}
            </Button>
          </div>

          <div className="space-y-3 p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-green-500" />
              <h4 className="font-medium">UX Insights</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Export AI-generated insights and improvement suggestions based on HEART framework
            </p>
            <Button 
              onClick={() => handleExport('insights')}
              disabled={isExporting}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Insights'}
            </Button>
          </div>

          <div className="space-y-3 p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-purple-500" />
              <h4 className="font-medium">Word Cloud Data</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Export word frequency data for sentiment analysis and visualization
            </p>
            <Button 
              onClick={() => handleExport('wordcloud')}
              disabled={isExporting}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Word Cloud'}
            </Button>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Current Filter Settings</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><strong>Service:</strong> {filters.service?.name || 'All Services'}</p>
            <p><strong>Sources:</strong> {filters.source.length > 0 ? filters.source.join(', ') : 'All Sources'}</p>
            <p><strong>Date Range:</strong> {
              filters.dateFrom && filters.dateTo 
                ? `${filters.dateFrom.toLocaleDateString()} - ${filters.dateTo.toLocaleDateString()}`
                : 'All Dates'
            }</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}