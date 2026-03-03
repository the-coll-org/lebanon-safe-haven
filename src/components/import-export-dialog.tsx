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
import { FileUp, Download, FileSpreadsheet } from "lucide-react";

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

  async function handleExport() {
    try {
      const res = await fetch("/api/admin/listings?format=xlsx");
      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `listings_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
      alert(t("exportError"));
    }
  }

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
          <FileSpreadsheet className="h-4 w-4" />
          {t("importExport")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("importExportTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("exportListings")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("exportDescription")}
            </p>
            <Button 
              onClick={handleExport} 
              className="w-full gap-2"
              variant="secondary"
            >
              <Download className="h-4 w-4" />
              {t("downloadExcel")}
            </Button>
          </div>

          <hr className="border-border" />

          {/* Import Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("importListings")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("importDescription")}
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
              id="excel-import"
            />
            <label htmlFor="excel-import">
              <Button 
                asChild
                className="w-full gap-2"
                disabled={importing}
              >
                <span>
                  <FileUp className="h-4 w-4" />
                  {importing ? t("importing") : t("uploadExcel")}
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
            <p className="font-medium mb-1">{t("excelTemplateTitle")}:</p>
            <p>{t("excelTemplateDescription")}</p>
            <div className="mt-2 font-mono text-[10px]">
              Phone, Region, Area, Category, Capacity, Description, Latitude, Longitude
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
