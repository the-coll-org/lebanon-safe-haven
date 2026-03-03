"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUp, Upload, Download } from "lucide-react";

interface ImportExportDialogProps {
  onImportSuccess: () => void;
}

export function ImportExportDialog({ onImportSuccess }: ImportExportDialogProps) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    total: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/listings", {
        method: "PATCH",
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setImportResult({
          success: result.success,
          failed: result.failed,
          total: result.total,
          errors: result.errors || [],
        });
        if (result.success > 0) {
          onImportSuccess();
        }
      } else {
        setImportResult({
          success: 0,
          failed: 1,
          total: 1,
          errors: [result.error || "Import failed"],
        });
      }
    } catch (err) {
      setImportResult({
        success: 0,
        failed: 1,
        total: 1,
        errors: [err instanceof Error ? err.message : "Import failed"],
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1">
          <Upload className="h-4 w-4" />
          {t("importListings")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("importListings")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Import Section */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {t("importDescription")}
            </p>
            <a href="/listings_template.csv" download>
              <Button variant="secondary" className="w-full gap-2">
                <Download className="h-4 w-4" />
                {t("downloadTemplate")}
              </Button>
            </a>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
              id="csv-import"
            />
            <label htmlFor="csv-import">
              <Button 
                asChild
                className="w-full gap-2"
                disabled={importing}
              >
                <span>
                  <FileUp className="h-4 w-4" />
                  {importing ? t("importing") : t("uploadCSV")}
                </span>
              </Button>
            </label>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className={`p-3 rounded-md ${importResult.failed === 0 ? 'bg-green-50 border border-green-200' : importResult.success > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="text-sm font-medium mb-2">
                {t("importResults", { 
                  success: importResult.success, 
                  failed: importResult.failed, 
                  total: importResult.total 
                })}
              </p>
              {importResult.errors.length > 0 && (
                <div className="text-xs text-red-600 max-h-32 overflow-y-auto">
                  {importResult.errors.map((error, i) => (
                    <p key={i} className="mb-1">• {error}</p>
                  ))}
                  {importResult.errors.length >= 10 && (
                    <p className="text-muted-foreground">... {t("moreErrors")}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Template Info */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-medium mb-1">{t("csvTemplateTitle")}:</p>
            <p>{t("csvTemplateDescription")}</p>
            <div className="mt-2 font-mono text-[10px]">
              phone,region,area,category,capacity,description,latitude,longitude
            </div>
            <div className="mt-2 text-[10px]">
              <p className="font-medium">{t("validRegions")}:</p>
              <p>beirut, mount_lebanon, south_lebanon, north_lebanon, nabatieh, bekaa, baalbek_hermel, akkar</p>
              <p className="font-medium mt-1">{t("validCategories")}:</p>
              <p>shelter, food, appliances, clothing</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
