"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, X, AlertCircle, Info, Bug, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface LogViewerModalProps {
  jobId: string;
  onClose: () => void;
}

export function LogViewerModal({ jobId, onClose }: LogViewerModalProps) {
  const [logs, setLogs] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [level, setLevel] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.getTagGenerationLogs(
        jobId,
        level || undefined,
        category || undefined,
        pageSize,
        page * pageSize
      );
      setLogs(result);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [jobId, level, category, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            ERROR
          </Badge>
        );
      case "WARNING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            WARNING
          </Badge>
        );
      case "INFO":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Info className="mr-1 h-3 w-3" />
            INFO
          </Badge>
        );
      case "DEBUG":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Bug className="mr-1 h-3 w-3" />
            DEBUG
          </Badge>
        );
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      SCRIPT_START: "Skript start",
      DB_CONNECT: "Databas",
      TAXONOMY_LOAD: "Taxonomi",
      INIT: "Initiering",
      ASSOCIATION_PROCESS: "Förening",
      TAG_MATCH: "Tagg-matchning",
      TAG_CREATE: "Skapa tagg",
      TAG_LINK: "Länka tagg",
      PROGRESS_UPDATE: "Progress",
      REPORT_WRITE: "Rapport",
      ERROR: "Fel",
      COMPLETE: "Klar",
      BATCH_PROCESS: "Batch",
      DB_READ: "DB läsning"
    };
    return labels[cat] || cat;
  };

  const totalPages = logs ? Math.ceil(logs.total / pageSize) : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Jobblogg: {jobId}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">Visa loggar för tagg-genereringsjobb</DialogDescription>
          {logs?.job && (
            <div className="flex gap-4 text-sm text-slate-600">
              <span>Mode: <strong>{logs.job.mode}</strong></span>
              <span>Källa: <strong>{logs.job.source}</strong></span>
              <span>Status: <strong>{logs.job.status}</strong></span>
              <span>Startad: <strong>{format(new Date(logs.job.startedAt), "yyyy-MM-dd HH:mm:ss", { locale: sv })}</strong></span>
            </div>
          )}
        </DialogHeader>

        <div className="flex gap-4 py-4 border-b">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Nivå</label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Alla nivåer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alla nivåer</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="WARNING">WARNING</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="DEBUG">DEBUG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Kategori</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Alla kategorier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alla kategorier</SelectItem>
                <SelectItem value="SCRIPT_START">Skript start</SelectItem>
                <SelectItem value="DB_CONNECT">Databas</SelectItem>
                <SelectItem value="TAXONOMY_LOAD">Taxonomi</SelectItem>
                <SelectItem value="INIT">Initiering</SelectItem>
                <SelectItem value="ASSOCIATION_PROCESS">Förening</SelectItem>
                <SelectItem value="TAG_MATCH">Tagg-matchning</SelectItem>
                <SelectItem value="TAG_CREATE">Skapa tagg</SelectItem>
                <SelectItem value="TAG_LINK">Länka tagg</SelectItem>
                <SelectItem value="BATCH_PROCESS">Batch</SelectItem>
                <SelectItem value="DB_READ">DB läsning</SelectItem>
                <SelectItem value="PROGRESS_UPDATE">Progress</SelectItem>
                <SelectItem value="REPORT_WRITE">Rapport</SelectItem>
                <SelectItem value="ERROR">Fel</SelectItem>
                <SelectItem value="COMPLETE">Klar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-slate-500">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            </div>
          ) : logs?.items?.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Inga loggar hittades.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Tidpunkt</TableHead>
                  <TableHead className="w-[100px]">Nivå</TableHead>
                  <TableHead className="w-[140px]">Kategori</TableHead>
                  <TableHead>Meddelande</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.items?.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-slate-50">
                    <TableCell className="text-xs font-mono">
                      {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss.SSS", { locale: sv })}
                    </TableCell>
                    <TableCell>{getLevelBadge(log.level)}</TableCell>
                    <TableCell className="text-xs">{getCategoryLabel(log.category)}</TableCell>
                    <TableCell className="text-sm">
                      <div>{log.message}</div>
                      {log.data && (
                        <details className="mt-1">
                          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                            Data
                          </summary>
                          <pre className="mt-1 text-xs bg-slate-50 p-2 rounded overflow-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-slate-500">
              Visar {page * pageSize + 1}–{Math.min((page + 1) * pageSize, logs.total)} av {logs.total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Föregående
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                Nästa
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
