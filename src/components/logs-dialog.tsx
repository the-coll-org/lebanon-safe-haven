"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { ScrollText, ChevronLeft, ChevronRight, User, Calendar, Shield, FileText } from "lucide-react";
import type { AdminLog } from "@/types";

type FilterAction = "all" | "login" | "logout" | "create" | "update" | "delete" | "verify" | "unflag";
type FilterEntity = "all" | "listing" | "user" | "flag" | "feedback";

interface LogsResponse {
  logs: AdminLog[];
  total: number;
  limit: number;
  offset: number;
}

export function LogsDialog() {
  const t = useTranslations("admin");
  const tLog = useTranslations("logs");
  
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState<FilterAction>("all");
  const [entityFilter, setEntityFilter] = useState<FilterEntity>("all");
  
  const limit = 20;

  useEffect(() => {
    if (open) {
      void fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, offset, actionFilter, entityFilter]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?limit=${limit}&offset=${offset}`);
      if (res.ok) {
        const data: LogsResponse = await res.json();
        let filteredLogs = data.logs;
        
        // Client-side filtering
        if (actionFilter !== "all") {
          filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
        }
        if (entityFilter !== "all") {
          filteredLogs = filteredLogs.filter(log => log.entityType === entityFilter);
        }
        
        setLogs(filteredLogs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  function getActionColor(action: string): string {
    switch (action) {
      case "login":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "logout":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "create":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "update":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "verify":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "unflag":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  }

  function getEntityIcon(entityType: string) {
    switch (entityType) {
      case "listing":
        return <FileText className="h-4 w-4" />;
      case "user":
        return <User className="h-4 w-4" />;
      case "flag":
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  }

  const hasNext = offset + limit < total;
  const hasPrev = offset > 0;

  const actionOptions: FilterAction[] = ["all", "login", "logout", "create", "update", "delete", "verify", "unflag"];
  const entityOptions: FilterEntity[] = ["all", "listing", "user", "flag", "feedback"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <ScrollText className="h-4 w-4" />
          {t("viewLogs")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("logsTitle")}</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v as FilterAction); setOffset(0); }}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={tLog("filterAction")} />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {tLog(`actions.${action}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v as FilterEntity); setOffset(0); }}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={tLog("filterEntity")} />
              </SelectTrigger>
              <SelectContent>
                {entityOptions.map((entity) => (
                  <SelectItem key={entity} value={entity}>
                    {tLog(`entities.${entity}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-lg" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t("noLogs")}</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {tLog(`actions.${log.action}`)}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          {getEntityIcon(log.entityType)}
                          {tLog(`entities.${log.entityType}`)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(log.createdAt)}
                      </span>
                    </div>

                    {log.userName && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <User className="h-3 w-3" />
                        {log.userName}
                        {log.ipAddress && <span className="text-xs">• {log.ipAddress}</span>}
                      </div>
                    )}

                    {log.details && (
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        {log.details}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            disabled={!hasPrev || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("pagination", {
              start: offset + 1,
              end: Math.min(offset + limit, total),
              total,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((prev) => prev + limit)}
            disabled={!hasNext || loading}
          >
            {t("next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
